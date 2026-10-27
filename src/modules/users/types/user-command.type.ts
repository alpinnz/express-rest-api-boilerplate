export type CreateUserCommand = {
  roleId: string;
  name: string;
  email: string;
  phone_number: string | null;
  country_code: string | null;
};
export type UpdateUserCommand = {
  userId: string;
  name?: string;
  phone_number?: string | null;
  country_code?: string | null;
};
