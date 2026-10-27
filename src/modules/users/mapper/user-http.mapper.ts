import type { User } from "../entity/user.entity.js";
import type { CurrentUserProfile, UserResponse } from "../types/user-response.type.js";
import type { UserProfileWithRole } from "../types/user-profile-with-role.type.js";
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    role_id: user.roleId,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number,
    country_code: user.country_code,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export function toCurrentUserProfileResponse(profile: UserProfileWithRole): CurrentUserProfile {
  return {
    ...toUserResponse(profile.user),
    role: profile.role,
  };
}
