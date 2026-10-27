import type { User } from "../entity/user.entity.js";

export type UserProfileWithRole = {
  user: User;
  role: {
    id: string;
    name: string;
    level: number;
  };
};
