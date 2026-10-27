# ADR 0027: Role catalog management and profile role join

- Status: Accepted (role deletion retention superseded in part by [ADR 0028](0028-soft-delete-resource-lifecycle.md))
- Date: 2026-10-27
- Supersedes: role-catalog scope in [ADR 0024](0024-role-level-assignment.md)

## Context

The API previously exposed only the role list and user role assignment. Clients could not create, inspect individually, update, or delete custom roles through the API. The authenticated user's profile also returned only `role_id`, so callers needed a separate request to show the role name and level.

## Decisions

- Expose role catalog operations through `POST /roles`, `GET /roles/{role_id}`, `PATCH /roles/{role_id}`, and `DELETE /roles/{role_id}`. The existing `GET /roles` remains the list operation.
- Require a valid bearer access token for all role catalog operations.
- An actor may create, update, or delete only custom roles whose level is strictly below the actor's role level. Role updates must keep both the current and resulting levels below the actor's level.
- Seeded `member`, `manager`, and `admin` were the system roles at the time of this decision. The current protected catalog (`owner`, `admin`, `staff`, and `user`) is defined by [ADR 0030](0030-default-role-catalog.md). Role retention and active-user rules are superseded by [ADR 0028](0028-soft-delete-resource-lifecycle.md).
- Keep the one-role-per-user relationship and existing assignment rule: an actor can change another user's role only when both the target's current role and the selected role are strictly below the actor's level. Reassigning the same role and changing one's own role are rejected.
- `GET /users/me` returns the existing profile fields plus a nested `role` object containing `id`, `name`, and `level`. The Sequelize association is wired by the composition root so the Users module does not depend directly on Roles.
- No migration is needed. Role management uses the existing `roles` and `users.role_id` tables; the foreign key remains the final guard against deleting an assigned role during a concurrent assignment.

## Consequences

- OpenAPI and the Postman collection document the complete role CRUD flow and the profile response.
- Role catalog mutations follow the existing numeric hierarchy and return field-level errors for invalid levels, duplicate names, protected system roles, or roles still in use.
- The profile endpoint can render the user's role with one joined database query.
- General-purpose permissions and tenant authorization remain outside this change.
