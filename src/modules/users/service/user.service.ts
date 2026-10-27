import { randomUUIDv7 } from "../../../shared/uuid/uuid-v7.js";
import { User } from "../entity/user.entity.js";
import type { UserRepository } from "../repository/user-repository.type.js";
import type { CreateUserCommand, UpdateUserCommand } from "../types/user-command.type.js";
import type { UserListPagination } from "../types/user-pagination.type.js";
import type { UserProfileWithRole } from "../types/user-profile-with-role.type.js";
import type { Transaction } from "sequelize";
import type { TransactionManager } from "../../../shared/database/transaction-manager.js";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import type { UserServiceApi } from "./user-service.type.js";

export class UserService implements UserServiceApi {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionManager: TransactionManager,
  ) {}
  create(input: CreateUserCommand, transaction?: Transaction): Promise<User> {
    return this.transactionManager.run((active) => {
      const now = new Date();
      const user = new User({ id: randomUUIDv7(), ...input, createdAt: now, updatedAt: now });
      return this.userRepository.create(user, active);
    }, transaction);
  }
  async get(userId: string, transaction?: Transaction): Promise<User> {
    const user = await this.userRepository.findById(userId, transaction);
    if (!user) throw new ApplicationError("not_found");
    return user;
  }
  async getProfileWithRole(userId: string): Promise<UserProfileWithRole> {
    const profile = await this.userRepository.findProfileById(userId);
    if (!profile) throw new ApplicationError("not_found");
    return profile;
  }
  findById(userId: string, transaction?: Transaction): Promise<User | null> {
    return this.userRepository.findById(userId, transaction);
  }
  findByEmail(email: string, transaction?: Transaction): Promise<User | null> {
    return this.userRepository.findByEmail(email, transaction);
  }
  list(pagination: UserListPagination) {
    return this.userRepository.list(pagination);
  }
  update(input: UpdateUserCommand, transaction?: Transaction): Promise<User> {
    return this.transactionManager.run(async (active) => {
      const current = await this.get(input.userId, active);
      const next = new User({
        id: current.id,
        roleId: current.roleId,
        name: input.name ?? current.name,
        email: current.email,
        phone_number: input.phone_number === undefined ? current.phone_number : input.phone_number,
        country_code: input.country_code === undefined ? current.country_code : input.country_code,
        createdAt: current.createdAt,
        updatedAt: new Date(),
      });
      return this.userRepository.update(next, active);
    }, transaction);
  }
  softDelete(userId: string, transaction?: Transaction): Promise<void> {
    return this.transactionManager.run(async (active) => {
      if (!(await this.userRepository.softDelete(userId, active)))
        throw new ApplicationError("not_found");
    }, transaction);
  }
  findRoleAssignmentsForUpdate(userIds: string[], transaction: Transaction) {
    return this.userRepository.findRoleAssignmentsForUpdate(userIds, transaction);
  }
  hasUsersWithRole(roleId: string, transaction: Transaction): Promise<boolean> {
    return this.userRepository.hasUsersWithRole(roleId, transaction);
  }
  updateRoleId(userId: string, roleId: string, transaction: Transaction): Promise<void> {
    return this.userRepository.updateRoleId(userId, roleId, transaction);
  }
}
