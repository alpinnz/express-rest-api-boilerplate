# OpenAPI Contract

Source of truth: docs/api/openapi.yaml. Generated; do not edit manually.

```yaml
openapi: 3.0.3
info:
  title: Express REST API
  version: 0.1.0
  description: Server-generated identifiers, including request IDs, use UUIDv7. UUID-format inputs accept earlier UUID versions for compatibility. The API covers user profiles, role assignment, authentication sessions, and infrastructure health.
servers:
  - url: "{base_url}/api/v1"
    description: API root. Set base_url to http://localhost:3000 for local development.
    variables:
      base_url:
        default: http://localhost:3000
        description: API host, without the /api/v1 prefix.
tags:
  - name: Health
    description: API and infrastructure health checks.
  - name: Auth
    description: Account registration, login, and token lifecycle.
  - name: User
    description: User creation, lookup, listing, update, and deletion.
  - name: Role
    description: Role catalog and hierarchical assignment to users.
paths:
  /health:
    get:
      tags:
        - Health
      summary: Check API and infrastructure health
      operationId: getApiHealth
      description: Checks API health and verifies database connectivity.
      security: []
      responses:
        "200":
          description: The API and database are healthy.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthStatusResponse"
              example:
                status: ok
                checks:
                  database:
                    status: ok
        "503":
          description: The API is responding but a required dependency is unavailable.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthStatusResponse"
              example:
                status: error
                checks:
                  database:
                    status: error
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "429":
          $ref: "#/components/responses/TooManyRequests"
  /auth/register:
    post:
      tags:
        - Auth
      summary: Register an account
      operationId: registerUser
      description: Creates a user account and password credential. This endpoint does not issue tokens; call login after registration.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUserRequest"
            example:
              name: "Alfin Noviaji"
              email: "alpinnz@gmail.com"
              phone_number: "81234567890"
              country_code: "+62"
              password: "!Password123"
              confirm_password: "!Password123"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "201":
          description: Account registered.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/RegisterUserResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "409":
          $ref: "#/components/responses/Conflict"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /auth/login:
    post:
      tags:
        - Auth
      summary: Create an access and refresh token pair
      operationId: login
      description: Returns an opaque bearer access token and a refresh token. Access-token lifetime is configured by AUTH_ACCESS_TOKEN_TTL_SECONDS. remember_me selects the configured refresh-token lifetime; omitted values default to false.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LoginRequest"
            example:
              email: "alpinnz@gmail.com"
              password: "!Password123"
              remember_me: false
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: Credentials accepted and a token pair issued.
          headers:
            Cache-Control:
              schema:
                type: string
              description: Set to no-store to prevent token caching.
            Pragma:
              schema:
                type: string
              description: Set to no-cache for legacy HTTP caches.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LoginResponse"
              example:
                message: success
                code: success
                data:
                  access_token: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                  refresh_token: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
                  token_type: Bearer
                  expires_in: 900
                  refresh_expires_in: 86400
                  user:
                    id: 01a17aa8-1c00-7007-8107-100000000007
                meta:
                  request_id: 01a17aa8-1c00-700a-810a-10000000000a
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /auth/logout:
    post:
      tags:
        - Auth
      summary: Revoke the session identified by its refresh token
      operationId: logout
      description: Revokes the session associated with the supplied refresh token. Repeating the request is safe; unknown or already revoked tokens also return success.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LogoutRequest"
            example:
              refresh_token: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: The matching session was revoked, if it was active.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LogoutResponse"
              example:
                message: success
                code: success
                meta:
                  request_id: 01a17aa8-1c00-700a-810a-10000000000a
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /auth/refresh-token:
    post:
      tags:
        - Auth
      summary: Rotate an active refresh token
      operationId: refreshToken
      description: Exchanges an active refresh token for a new access and refresh token pair. The previous refresh token is invalidated and cannot be reused.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RefreshTokenRequest"
            example:
              refresh_token: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: A new access and refresh token pair was issued.
          headers:
            Cache-Control:
              schema:
                type: string
              description: Set to no-store to prevent token caching.
            Pragma:
              schema:
                type: string
              description: Set to no-cache for legacy HTTP caches.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/RefreshTokenResponse"
              example:
                message: success
                code: success
                data:
                  access_token: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"
                  refresh_token: "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
                  token_type: Bearer
                  expires_in: 900
                  refresh_expires_in: 86400
                  user:
                    id: 01a17aa8-1c00-7007-8107-100000000007
                meta:
                  request_id: 01a17aa8-1c00-700a-810a-10000000000a
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "422":
          $ref: "#/components/responses/ValidationFailed"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /roles:
    get:
      tags:
        - Role
      summary: List available roles
      operationId: listRoles
      description: Returns the seeded system roles owner (level 100), admin (level 80), staff (level 50), and user (level 10). New registrations receive user. Higher levels represent higher privilege.
      security:
        - bearerAuth: []
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: Available roles ordered from highest to lowest level.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ListRolesResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
    post:
      tags:
        - Role
      summary: Create a role
      operationId: createRole
      description: Creates a custom role. The actor can create only roles with a level strictly below their own. Seeded roles are reserved.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateRoleRequest"
            example:
              name: support
              level: 20
      responses:
        "201":
          description: Role created.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/CreateRoleResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/RoleManagementForbidden"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "409":
          $ref: "#/components/responses/RoleCatalogConflict"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /roles/{role_id}:
    parameters:
      - name: role_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    get:
      tags:
        - Role
      summary: Get a role
      operationId: getRole
      security:
        - bearerAuth: []
      responses:
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "200":
          description: Role details.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GetRoleResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
    patch:
      tags:
        - Role
      summary: Update a custom role
      operationId: updateRole
      description: Updates a custom role. At least one field is required. The current and resulting role levels must both be strictly below the actor's level. Seeded roles are reserved.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateRoleRequest"
            example:
              name: support_agent
              level: 25
      responses:
        "200":
          description: Role updated.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UpdateRoleResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/RoleManagementForbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "409":
          $ref: "#/components/responses/RoleCatalogConflict"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
    delete:
      tags:
        - Role
      summary: Delete a custom role
      operationId: deleteRole
      description: Soft-deletes a custom role only when its level is strictly below the actor's and no active users are assigned to it. The role row and name remain reserved. Seeded roles are reserved.
      security:
        - bearerAuth: []
      responses:
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "200":
          description: Role soft-deleted; its row and name remain reserved.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DeleteRoleResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/RoleManagementForbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "409":
          $ref: "#/components/responses/RoleCatalogConflict"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /users:
    post:
      tags:
        - User
      summary: Create a user
      operationId: createUser
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUserRequest"
            example:
              name: "Alfin Noviaji"
              email: "alpinnz@gmail.com"
              phone_number: "81234567890"
              country_code: "+62"
              password: "!Password123"
              confirm_password: "!Password123"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "201":
          description: User created.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/CreateUserResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "409":
          $ref: "#/components/responses/Conflict"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
        "422":
          $ref: "#/components/responses/ValidationFailed"
    get:
      tags:
        - User
      summary: List users
      operationId: listUsers
      description: Requires an active bearer access token and a role level of at least 80 (admin).
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 10000
            default: 1
          description: One-based page number.
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
          description: Maximum number of users to return.
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: Page of users.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ListUsersResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/UserManagementForbidden"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /users/me:
    get:
      tags:
        - User
      summary: Get the authenticated user's profile
      operationId: getCurrentUser
      description: Returns the profile associated with the active bearer access token, including the user's current role details.
      security:
        - bearerAuth: []
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: Authenticated user profile.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GetCurrentUserResponse"
              example:
                message: success
                code: success
                data:
                  id: 01a17aa8-1c00-7006-8106-100000000006
                  role_id: 01a17aa8-1c00-7004-8104-100000000004
                  name: Alfin Noviaji
                  email: alpinnz@gmail.com
                  phone_number: "81234567890"
                  country_code: "+62"
                  created_at: "2026-10-27T08:00:00.000Z"
                  updated_at: "2026-10-27T08:00:00.000Z"
                  role:
                    id: 01a17aa8-1c00-7004-8104-100000000004
                    name: user
                    level: 10
                meta:
                  request_id: 01a17aa8-1c00-700a-810a-10000000000a
        "401":
          $ref: "#/components/responses/Unauthorized"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
    patch:
      tags:
        - User
      summary: Update the authenticated user's profile
      operationId: updateCurrentUserProfile
      description: Updates the supplied profile fields. Email is immutable; unknown fields such as email are omitted by request validation.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateCurrentUserProfileRequest"
            example:
              name: Alfin Noviaji
              phone_number: "81234567890"
              country_code: "+62"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: Profile updated; email remains unchanged.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UpdateUserResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
        "422":
          $ref: "#/components/responses/ValidationFailed"
    delete:
      tags:
        - User
      summary: Deactivate the authenticated user's account
      operationId: deactivateCurrentUser
      description: Requires the current password, soft-deletes the account and password credential, clears the stored password hash, and revokes every session. The user, credential, and email rows remain stored as tombstones.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/DeactivateCurrentUserRequest"
            example:
              current_password: "!Password123"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: Account deactivated; its credentials and sessions are unavailable.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DeleteUserResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "422":
          $ref: "#/components/responses/ValidationFailed"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /users/me/password:
    put:
      tags:
        - User
      summary: Change the authenticated user's password
      operationId: changeCurrentUserPassword
      description: Verifies the current password, then changes the password and revokes all active sessions. Sign in again after this request succeeds.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ChangeCurrentUserPasswordRequest"
            example:
              current_password: "!Password123"
              new_password: "!NewPassword123"
              confirm_new_password: "!NewPassword123"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: Password changed; the response has no data payload and all sessions are revoked.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChangePasswordResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "422":
          $ref: "#/components/responses/ValidationFailed"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /users/{user_id}/role:
    parameters:
      - name: user_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    patch:
      tags:
        - Role
      summary: Change a user's role
      operationId: changeUserRole
      description: Requires an active bearer token. An actor can change another user's role only when the actor's level is strictly higher than the target user's current level and the selected role's level. Reassigning the current role and changing one's own role are rejected.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ChangeUserRoleRequest"
            example:
              role_id: 01a17aa8-1c00-7008-8108-100000000008
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: User role changed.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ChangeUserRoleResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "409":
          $ref: "#/components/responses/RoleConflict"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
  /users/{user_id}:
    parameters:
      - name: user_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    get:
      tags:
        - User
      summary: Get a user
      operationId: getUser
      description: Requires an active bearer access token and a role level of at least 80 (admin).
      security:
        - bearerAuth: []
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: User found.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GetUserResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/UserManagementForbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
    put:
      tags:
        - User
      summary: Replace a user's editable profile fields
      operationId: updateUser
      description: Requires an active bearer access token and the owner role (level 100). An owner cannot target their own account by ID; use PATCH /users/me instead. Email is immutable.
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateUserRequest"
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: User updated.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UpdateUserResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/UserManagementForbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "409":
          $ref: "#/components/responses/Conflict"
        "413":
          $ref: "#/components/responses/ContentTooLarge"
        "415":
          $ref: "#/components/responses/UnsupportedMediaType"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
        "422":
          $ref: "#/components/responses/ValidationFailed"
    delete:
      tags:
        - User
      summary: Deactivate a user account
      operationId: deleteUser
      description: Requires an active bearer access token and the owner role (level 100). An owner cannot target their own account by ID; use DELETE /users/me, which requires the current password. Deactivates the user and active credential and revokes all sessions in one transaction.
      security:
        - bearerAuth: []
      responses:
        "405":
          $ref: "#/components/responses/MethodNotAllowed"
        "200":
          description: User and credential are soft-deleted, the password hash is cleared, and all sessions are revoked. Rows are retained.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DeleteUserResponse"
        "400":
          $ref: "#/components/responses/InvalidRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/UserManagementForbidden"
        "404":
          $ref: "#/components/responses/NotFound"
        "406":
          $ref: "#/components/responses/NotAcceptable"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: opaque
  responses:
    InvalidRequest:
      description: Malformed input, or Valfuse rejected a request value.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          example:
            message: Invalid request
            code: bad_request
            errors:
              - field: email
                location: body
                code: email_invalid
                message: Enter a valid email address.
            meta:
              request_id: 01a17aa8-1c00-7009-8109-100000000009
    NotAcceptable:
      description: The Accept header does not allow an application/json response.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          example:
            message: The request does not accept a supported response format.
            code: not_acceptable
            errors:
              - field: Accept
                location: header
                code: accept_not_supported
                message: The Accept header must allow application/json.
            meta:
              request_id: 01a17aa8-1c00-7009-8109-100000000009
    Conflict:
      description: The request conflicts with existing resource state.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          example:
            message: The request failed because of a conflict.
            code: conflict
            errors:
              - field: email
                location: body
                code: email_already_used
                message: Email already in use
            meta:
              request_id: 01a17aa8-1c00-7009-8109-100000000009
    RoleConflict:
      description: The selected role is already assigned to the user.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          example:
            message: The request failed because of a conflict.
            code: conflict
            errors:
              - field: role_id
                location: body
                code: role_unchanged
                message: The user already has this role.
            meta:
              request_id: 01a17aa8-1c00-7009-8109-100000000009
    RoleCatalogConflict:
      description: The role name is already in use or the role is assigned to at least one user.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          examples:
            roleNameAlreadyExists:
              summary: Duplicate role name
              value:
                message: The request failed because of a conflict.
                code: conflict
                errors:
                  - field: name
                    location: body
                    code: role_name_already_exists
                    message: A role with this name already exists.
                meta:
                  request_id: 01a17aa8-1c00-7009-8109-100000000009
            roleInUse:
              summary: Role is assigned to users
              value:
                message: The request failed because of a conflict.
                code: conflict
                errors:
                  - field: role_id
                    location: path
                    code: role_in_use
                    message: The role cannot be deleted while active users are assigned to it.
                meta:
                  request_id: 01a17aa8-1c00-7009-8109-100000000009
    ContentTooLarge:
      description: The request body exceeds the configured size limit.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
    UnsupportedMediaType:
      description: The request body media type or content encoding is unsupported.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          example:
            message: The request uses an unsupported media type or encoding.
            code: unsupported_media_type
            errors:
              - field: Content-Type
                location: header
                code: content_type_unsupported
                message: Content-Type must be application/json.
            meta:
              request_id: 01a17aa8-1c00-7009-8109-100000000009
    TooManyRequests:
      description: The client exceeded the API rate limit.
      headers:
        RateLimit:
          schema:
            type: string
          description: Draft 8 rate limit status for the active limit.
        RateLimit-Policy:
          schema:
            type: string
          description: Draft 8 rate limit policy applied to the request.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
    InternalServerError:
      description: An unexpected server error occurred.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
    ServiceUnavailable:
      description: A required dependency is temporarily unavailable.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
    NotFound:
      description: The requested resource does not exist.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
    Unauthorized:
      description: A valid active bearer access token is required.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          example:
            message: Authentication is required or the token is invalid
            code: unauthorized
            errors:
              - field: Authorization
                location: header
                code: bearer_token_required
                message: A Bearer access token is required.
            meta:
              request_id: 01a17aa8-1c00-7009-8109-100000000009
    Forbidden:
      description: The authenticated actor is not allowed to make the requested change.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
    UserManagementForbidden:
      description: The actor lacks the required role level, or attempted to manage their own account by user ID.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          examples:
            roleLevelInsufficient:
              summary: The actor's role level is too low
              value:
                message: You are not allowed to perform this action.
                code: forbidden
                errors:
                  - field: Authorization
                    location: header
                    code: user_management_level_insufficient
                    message: Your role level is too low to manage users.
                meta:
                  request_id: 01a17aa8-1c00-7009-8109-100000000009
            selfUserManagementForbidden:
              summary: Manage the signed-in account through /users/me
              value:
                message: You are not allowed to perform this action.
                code: forbidden
                errors:
                  - field: user_id
                    location: path
                    code: self_user_management_forbidden
                    message: Use the authenticated profile endpoint to manage your own account.
                meta:
                  request_id: 01a17aa8-1c00-7009-8109-100000000009
    RoleManagementForbidden:
      description: The actor cannot manage the role because it is a seeded role or its level is not below the actor's level.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
          examples:
            roleLevelInsufficient:
              summary: Role level is not below the actor's level
              value:
                message: You are not allowed to perform this action.
                code: forbidden
                errors:
                  - field: level
                    location: body
                    code: role_management_level_insufficient
                    message: You can manage only roles with a level below your own.
                meta:
                  request_id: 01a17aa8-1c00-7009-8109-100000000009
            seededRoleProtected:
              summary: Seeded system roles cannot be modified
              value:
                message: You are not allowed to perform this action.
                code: forbidden
                errors:
                  - field: role_id
                    location: path
                    code: system_role_protected
                    message: Seeded system roles cannot be modified or deleted.
                meta:
                  request_id: 01a17aa8-1c00-7009-8109-100000000009
    MethodNotAllowed:
      description: The HTTP method is not supported on this path.
      headers:
        Allow:
          schema:
            type: string
          description: Methods supported by this path.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ApiFailureResponse"
    ValidationFailed:
      description: Application/domain validation failed.
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ValidationFailureResponse"
          example:
            message: Application validation failed
            code: validation_error
            errors:
              - field: credentials
                location: body
                code: credentials_invalid
                message: Email or password is invalid
            meta:
              request_id: 01a17aa8-1c00-7009-8109-100000000009
  schemas:
    HealthStatusResponse:
      type: object
      additionalProperties: false
      required:
        - status
        - checks
      properties:
        status:
          type: string
          enum:
            - ok
            - error
        checks:
          type: object
          additionalProperties: false
          required:
            - database
          properties:
            database:
              type: object
              additionalProperties: false
              required:
                - status
              properties:
                status:
                  type: string
                  enum:
                    - ok
                    - error
    UserProfileRequest:
      type: object
      description: Undeclared properties are omitted by Valfuse.
      additionalProperties: true
      required:
        - name
        - email
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        email:
          type: string
          format: email
          maxLength: 254
        phone_number:
          type: string
          nullable: true
          maxLength: 20
        country_code:
          type: string
          nullable: true
          maxLength: 5
    CreateUserRequest:
      description: Registration password must be 8 to 72 characters and contain at least one uppercase letter, one number, and one non-whitespace symbol. confirm_password must match password.
      allOf:
        - $ref: "#/components/schemas/UserProfileRequest"
        - type: object
          required:
            - password
            - confirm_password
          properties:
            password:
              type: string
              minLength: 8
              maxLength: 72
              pattern: "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s]).{8,72}$"
              writeOnly: true
            confirm_password:
              type: string
              minLength: 8
              maxLength: 72
              pattern: "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s]).{8,72}$"
              writeOnly: true
    UserEditableProfileRequest:
      type: object
      description: Only name, phone_number, and country_code can be changed. Email cannot be changed.
      additionalProperties: true
      required:
        - name
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        phone_number:
          type: string
          nullable: true
          maxLength: 20
        country_code:
          type: string
          nullable: true
          maxLength: 5
    LoginRequest:
      type: object
      description: Email is normalized by trimming whitespace and converting to lowercase. Password is 8 to 72 characters. remember_me defaults to false; true uses AUTH_REMEMBER_ME_REFRESH_TOKEN_TTL_SECONDS and false uses AUTH_REFRESH_TOKEN_TTL_SECONDS.
      additionalProperties: true
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          maxLength: 254
        password:
          type: string
          minLength: 8
          maxLength: 72
          writeOnly: true
        remember_me:
          type: boolean
          default: false
          description: Requests the longer refresh-token lifetime when true.
    RefreshTokenRequest:
      type: object
      description: Send the current 43-character URL-safe refresh token. Successful refresh invalidates it.
      additionalProperties: true
      required:
        - refresh_token
      properties:
        refresh_token:
          type: string
          minLength: 43
          maxLength: 43
          pattern: "^[A-Za-z0-9_-]{43}$"
          writeOnly: true
    LogoutRequest:
      description: Send the refresh token for the session to revoke.
      allOf:
        - $ref: "#/components/schemas/RefreshTokenRequest"
    UpdateUserRequest:
      description: Email cannot be changed. If phone_number or country_code is omitted or null, its stored value is cleared.
      allOf:
        - $ref: "#/components/schemas/UserEditableProfileRequest"
    UpdateCurrentUserProfileRequest:
      type: object
      description: Send at least one of name, phone_number, or country_code. Email cannot be changed; undeclared fields are omitted by request validation.
      minProperties: 1
      additionalProperties: true
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        phone_number:
          type: string
          nullable: true
          maxLength: 20
        country_code:
          type: string
          nullable: true
          maxLength: 5
    ChangeCurrentUserPasswordRequest:
      type: object
      description: Current password must match the account. New password must be 8 to 72 characters and include an uppercase letter, a number, and a non-whitespace symbol; confirmation must match.
      additionalProperties: true
      required:
        - current_password
        - new_password
        - confirm_new_password
      properties:
        current_password:
          type: string
          minLength: 8
          maxLength: 72
          writeOnly: true
        new_password:
          type: string
          minLength: 8
          maxLength: 72
          pattern: "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s]).{8,72}$"
          writeOnly: true
        confirm_new_password:
          type: string
          minLength: 8
          maxLength: 72
          pattern: "^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s]).{8,72}$"
          writeOnly: true
    DeactivateCurrentUserRequest:
      type: object
      description: Confirm account deactivation with the current password.
      additionalProperties: true
      required:
        - current_password
      properties:
        current_password:
          type: string
          minLength: 8
          maxLength: 72
          writeOnly: true
    UserResponse:
      type: object
      additionalProperties: false
      required:
        - id
        - role_id
        - name
        - email
        - phone_number
        - country_code
        - created_at
        - updated_at
      properties:
        id:
          type: string
          format: uuid
        role_id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        phone_number:
          type: string
          nullable: true
        country_code:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
    RoleResponse:
      type: object
      additionalProperties: false
      required:
        - id
        - name
        - level
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          minLength: 1
          maxLength: 50
        level:
          type: integer
          minimum: 1
          maximum: 2147483647
          description: Higher values represent higher privilege.
    CreateRoleRequest:
      type: object
      additionalProperties: true
      required:
        - name
        - level
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 50
          pattern: "^[a-z][a-z0-9_-]{0,49}$"
        level:
          type: integer
          minimum: 1
          maximum: 2147483647
          description: Must be strictly below the authenticated actor's level.
    UpdateRoleRequest:
      type: object
      additionalProperties: true
      minProperties: 1
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 50
          pattern: "^[a-z][a-z0-9_-]{0,49}$"
        level:
          type: integer
          minimum: 1
          maximum: 2147483647
          description: Must remain strictly below the authenticated actor's level.
    ChangeUserRoleRequest:
      type: object
      additionalProperties: true
      required:
        - role_id
      properties:
        role_id:
          type: string
          format: uuid
    ChangeUserRoleResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - updated
            data:
              type: object
              additionalProperties: false
              required:
                - user_id
                - role_id
              properties:
                user_id:
                  type: string
                  format: uuid
                role_id:
                  type: string
                  format: uuid
    ListRolesResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - success
            data:
              type: object
              additionalProperties: false
              required:
                - items
                - count
              properties:
                items:
                  type: array
                  items:
                    $ref: "#/components/schemas/RoleResponse"
                count:
                  type: integer
                  minimum: 0
    ApiResponseBase:
      type: object
      required:
        - message
        - code
        - meta
      properties:
        message:
          type: string
        code:
          type: string
        meta:
          $ref: "#/components/schemas/Meta"
    ApiSuccessResponse:
      allOf:
        - $ref: "#/components/schemas/ApiResponseBase"
        - type: object
          properties:
            code:
              type: string
              enum:
                - created
                - success
                - updated
                - deleted
            data: {}
    CreateUserResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - created
            data:
              type: object
              additionalProperties: false
              required:
                - id
              properties:
                id:
                  type: string
                  format: uuid
    RegisterUserResponse:
      $ref: "#/components/schemas/CreateUserResponse"
    AuthTokenResponse:
      type: object
      additionalProperties: false
      required:
        - access_token
        - refresh_token
        - token_type
        - expires_in
        - refresh_expires_in
        - user
      properties:
        access_token:
          type: string
          minLength: 43
          maxLength: 43
        refresh_token:
          type: string
          minLength: 43
          maxLength: 43
        token_type:
          type: string
          enum:
            - Bearer
        expires_in:
          type: integer
          minimum: 1
          description: Access-token lifetime in seconds, configured by AUTH_ACCESS_TOKEN_TTL_SECONDS.
        refresh_expires_in:
          type: integer
          minimum: 1
          description: Refresh-token lifetime in seconds, selected by remember_me at login.
        user:
          type: object
          additionalProperties: false
          required:
            - id
          properties:
            id:
              type: string
              format: uuid
    LoginResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - success
            data:
              $ref: "#/components/schemas/AuthTokenResponse"
    RefreshTokenResponse:
      $ref: "#/components/schemas/LoginResponse"
    LogoutResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - code
        - meta
      properties:
        message:
          type: string
        code:
          type: string
          enum:
            - success
        meta:
          $ref: "#/components/schemas/Meta"
    ChangePasswordResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - code
        - meta
      properties:
        message:
          type: string
        code:
          type: string
          enum:
            - updated
        meta:
          $ref: "#/components/schemas/Meta"
    GetUserResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - success
            data:
              $ref: "#/components/schemas/UserResponse"
    CurrentUserProfile:
      type: object
      additionalProperties: false
      required:
        - id
        - role_id
        - name
        - email
        - phone_number
        - country_code
        - created_at
        - updated_at
        - role
      properties:
        id:
          type: string
          format: uuid
        role_id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        phone_number:
          type: string
          nullable: true
        country_code:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        role:
          $ref: "#/components/schemas/RoleResponse"
    GetCurrentUserResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - success
            data:
              $ref: "#/components/schemas/CurrentUserProfile"
    CreateRoleResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - created
            data:
              $ref: "#/components/schemas/RoleResponse"
    GetRoleResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - success
            data:
              $ref: "#/components/schemas/RoleResponse"
    UpdateRoleResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - updated
            data:
              $ref: "#/components/schemas/RoleResponse"
    DeleteRoleResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - code
        - meta
      properties:
        message:
          type: string
        code:
          type: string
          enum:
            - deleted
        meta:
          $ref: "#/components/schemas/Meta"
    UpdateUserResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - updated
            data:
              $ref: "#/components/schemas/UserResponse"
    ListUsersResponse:
      allOf:
        - $ref: "#/components/schemas/ApiSuccessResponse"
        - type: object
          required:
            - data
          properties:
            code:
              type: string
              enum:
                - success
            data:
              type: object
              additionalProperties: false
              required:
                - items
                - count
              properties:
                items:
                  type: array
                  items:
                    $ref: "#/components/schemas/UserResponse"
                count:
                  type: integer
                  minimum: 0
            meta:
              $ref: "#/components/schemas/PaginatedMeta"
    DeleteUserResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - code
        - meta
      properties:
        message:
          type: string
        code:
          type: string
          enum:
            - deleted
        meta:
          $ref: "#/components/schemas/Meta"
    ApiFailureResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - code
        - meta
      properties:
        message:
          type: string
          description: General summary of the failure. Use errors for field-specific messages.
        code:
          type: string
          enum:
            - bad_request
            - conflict
            - content_too_large
            - forbidden
            - internal_server_error
            - method_not_allowed
            - not_acceptable
            - not_found
            - service_unavailable
            - too_many_requests
            - unauthorized
            - unsupported_media_type
            - validation_error
        errors:
          type: array
          description: Included only when one or more error details are available.
          minItems: 1
          items:
            $ref: "#/components/schemas/ErrorDetail"
        meta:
          $ref: "#/components/schemas/Meta"
    ValidationFailureResponse:
      allOf:
        - $ref: "#/components/schemas/ApiFailureResponse"
        - type: object
          required:
            - errors
          properties:
            code:
              type: string
              enum:
                - validation_error
            errors:
              type: array
              minItems: 1
              items:
                $ref: "#/components/schemas/ErrorDetail"
    ErrorDetail:
      type: object
      additionalProperties: false
      required:
        - field
        - location
        - code
        - message
      properties:
        field:
          type: string
        location:
          type: string
          enum:
            - body
            - query
            - path
            - header
            - system
        code:
          type: string
        message:
          type: string
          description: Specific explanation for this field error.
    Meta:
      type: object
      additionalProperties: true
      required:
        - request_id
      properties:
        request_id:
          type: string
          format: uuid
    PaginatedMeta:
      allOf:
        - $ref: "#/components/schemas/Meta"
        - type: object
          required:
            - pagination
          properties:
            pagination:
              $ref: "#/components/schemas/Pagination"
    Pagination:
      type: object
      additionalProperties: false
      required:
        - page
        - limit
        - total
        - total_page
        - has_next
        - has_prev
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_page:
          type: integer
        has_next:
          type: boolean
        has_prev:
          type: boolean
```
