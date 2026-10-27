import type { CreateUserCommand } from "../../users/types/user-command.type.js";

export type RegisterUserCommand = Omit<CreateUserCommand, "roleId"> & { password: string };
export type LoginCommand = { email: string; password: string; remember_me: boolean };
