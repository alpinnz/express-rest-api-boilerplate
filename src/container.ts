import { asClass, asFunction, asValue, createContainer, InjectionMode } from "awilix";
import type { Sequelize } from "sequelize";
import type { Environment } from "./config/environment.type.js";
import type { Cradle } from "./container.type.js";
import type { UserModel } from "./modules/users/model/user-model.type.js";
import type { RoleModel } from "./modules/roles/model/role-model.type.js";
import { createDatabase } from "./config/database.js";
import { createLogger } from "./shared/logging/logger.js";
import { TransactionManager } from "./shared/database/transaction-manager.js";
import { NodeArgon2PasswordHasher } from "./modules/auth/security/index.js";
import { createUserModel } from "./modules/users/model/user.model.js";
import { createAuthCredentialModel } from "./modules/auth/model/auth-credential.model.js";
import { createAuthSessionModel } from "./modules/auth/model/auth-session.model.js";
import { SequelizeUserRepository } from "./modules/users/repository/user.repository.js";
import { SequelizeAuthCredentialRepository } from "./modules/auth/repository/auth-credential.repository.js";
import { SequelizeAuthSessionRepository } from "./modules/auth/repository/auth-session.repository.js";
import { UserService } from "./modules/users/service/user.service.js";
import { AuthService } from "./modules/auth/service/auth.service.js";
import { UserController } from "./modules/users/controller/user.controller.js";
import { AuthController } from "./modules/auth/controller/auth.controller.js";
import { HealthService } from "./modules/health/service/health.service.js";
import { HealthController } from "./modules/health/controller/health.controller.js";
import { createRoleModel } from "./modules/roles/model/role.model.js";
import { SequelizeRoleRepository } from "./modules/roles/repository/role.repository.js";
import { RoleService } from "./modules/roles/service/role.service.js";
import { RoleController } from "./modules/roles/controller/role.controller.js";

function createUserModelWithRole(database: Sequelize, roleModel: RoleModel): UserModel {
  const userModel = createUserModel(database);
  userModel.belongsTo(roleModel, { foreignKey: "role_id", as: "role" });
  return userModel;
}

export function createDependencyContainer(environment: Environment) {
  const container = createContainer<Cradle>({ injectionMode: InjectionMode.CLASSIC, strict: true });
  container.register({
    environment: asValue(environment),
    database: asFunction(createDatabase)
      .singleton()
      .disposer((database) => database.close()),
    logger: asFunction(createLogger).singleton(),
    transactionManager: asClass(TransactionManager).singleton(),
    passwordHasher: asClass(NodeArgon2PasswordHasher).singleton(),
    userModel: asFunction(createUserModelWithRole).singleton(),
    roleModel: asFunction(createRoleModel).singleton(),
    authCredentialModel: asFunction(createAuthCredentialModel).singleton(),
    authSessionModel: asFunction(createAuthSessionModel).singleton(),
    userRepository: asClass(SequelizeUserRepository).singleton(),
    roleRepository: asClass(SequelizeRoleRepository).singleton(),
    authCredentialRepository: asClass(SequelizeAuthCredentialRepository).singleton(),
    authSessionRepository: asClass(SequelizeAuthSessionRepository).singleton(),
    userService: asClass(UserService).scoped(),
    roleService: asClass(RoleService).scoped(),
    authService: asClass(AuthService).scoped(),
    authController: asClass(AuthController).scoped(),
    userController: asClass(UserController).scoped(),
    roleController: asClass(RoleController).scoped(),
    healthService: asClass(HealthService).scoped(),
    healthController: asClass(HealthController).scoped(),
  });
  return container;
}
