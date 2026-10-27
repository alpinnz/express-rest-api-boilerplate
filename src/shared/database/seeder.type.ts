import type { Sequelize, Transaction } from "sequelize";
import type { Environment } from "../../config/environment.type.js";

export type SeederArguments = {
  context: { database: Sequelize; transaction: Transaction };
};

export type SeederModule = {
  environments: readonly Environment["nodeEnv"][];
  seed: (arguments_: SeederArguments) => Promise<void>;
};
