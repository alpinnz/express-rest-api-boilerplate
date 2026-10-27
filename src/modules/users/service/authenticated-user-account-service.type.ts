export interface AuthenticatedUserAccountServiceApi {
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  deactivateAccount(userId: string, currentPassword: string): Promise<void>;
  deactivateAccountByAdministrator(userId: string): Promise<void>;
}
