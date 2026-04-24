# Requirements Document

## Introduction

Board Sharing enables users to collaborate on boards in a Trello-like application. A board owner can invite other users and assign them roles that control what actions they can perform. Three roles are defined: Owner (full control), Editor (can modify content but not manage members), and Viewer (read-only). The system enforces permissions on every API call using JWT-based authentication and MongoDB-backed role storage.

---

## Glossary

- **Board**: A collaborative workspace containing lists and cards, owned by a single user.
- **Member**: A user who has been granted access to a board with an assigned role.
- **Owner**: A role with full control over a board, including member management and deletion.
- **Editor**: A role that can create, update, and delete lists and cards but cannot manage members or delete the board.
- **Viewer**: A role that can only read board content and cannot make any modifications.
- **Invitation**: A request sent to a user to join a board with a specified role.
- **Permission**: An action that a role is authorized to perform on a board.
- **JWT**: JSON Web Token used to authenticate and identify the requesting user.
- **Board_Service**: The backend NestJS service responsible for board and membership operations.
- **Auth_Guard**: The NestJS guard that validates JWT tokens and attaches user identity to requests.
- **Permission_Guard**: The NestJS guard that checks a member's role before allowing an action.

---

## Requirements

### Requirement 1: Role Assignment

**User Story:** As a board owner, I want to assign roles to members when inviting them, so that I can control what each collaborator can do.

#### Acceptance Criteria

1. THE Board_Service SHALL support exactly three roles: `owner`, `editor`, and `viewer`.
2. WHEN a user creates a board, THE Board_Service SHALL automatically assign the `owner` role to that user.
3. WHEN an owner invites a user to a board, THE Board_Service SHALL assign the role specified in the invitation request.
4. IF the role specified in an invitation is not one of `owner`, `editor`, or `viewer`, THEN THE Board_Service SHALL return a `400 Bad Request` error with a descriptive message.
5. THE Board_Service SHALL allow at most one `owner` per board at any time.

---

### Requirement 2: Member Invitation

**User Story:** As a board owner, I want to invite other users to my board by their email address, so that they can collaborate with me.

#### Acceptance Criteria

1. WHEN an owner sends a `POST /boards/:boardId/members` request with a valid email and role, THE Board_Service SHALL add the target user as a member with the specified role.
2. IF the target user does not exist in the system, THEN THE Board_Service SHALL return a `404 Not Found` error.
3. IF the target user is already a member of the board, THEN THE Board_Service SHALL return a `409 Conflict` error.
4. WHEN a non-owner member sends a `POST /boards/:boardId/members` request, THE Permission_Guard SHALL reject the request with a `403 Forbidden` error.
5. IF the JWT token is missing or invalid on any request, THEN THE Auth_Guard SHALL return a `401 Unauthorized` error.

---

### Requirement 3: Member Role Update

**User Story:** As a board owner, I want to change a member's role, so that I can adjust their permissions as the project evolves.

#### Acceptance Criteria

1. WHEN an owner sends a `PATCH /boards/:boardId/members/:userId` request with a valid role, THE Board_Service SHALL update that member's role.
2. IF the target member is the board owner and the new role is not `owner`, THEN THE Board_Service SHALL return a `400 Bad Request` error to prevent the board from having no owner.
3. WHEN an owner changes their own role to `editor` or `viewer`, THE Board_Service SHALL require that another member is simultaneously promoted to `owner` in the same request.
4. WHEN a non-owner sends a `PATCH /boards/:boardId/members/:userId` request, THE Permission_Guard SHALL reject the request with a `403 Forbidden` error.

---

### Requirement 4: Member Removal

**User Story:** As a board owner, I want to remove members from a board, so that I can revoke access when needed.

#### Acceptance Criteria

1. WHEN an owner sends a `DELETE /boards/:boardId/members/:userId` request, THE Board_Service SHALL remove the specified member from the board.
2. IF the target member is the sole owner of the board, THEN THE Board_Service SHALL return a `400 Bad Request` error.
3. WHEN a non-owner sends a `DELETE /boards/:boardId/members/:userId` request, THE Permission_Guard SHALL reject the request with a `403 Forbidden` error.
4. WHEN a member sends a `DELETE /boards/:boardId/members/:userId` request where `:userId` matches their own identity, THE Board_Service SHALL allow the member to remove themselves regardless of role, except when they are the sole owner.

---

### Requirement 5: Board Access Control

**User Story:** As a system, I want to enforce role-based permissions on every board operation, so that users can only perform actions their role permits.

#### Acceptance Criteria

1. WHILE a user holds the `viewer` role on a board, THE Permission_Guard SHALL allow only `GET` requests to board, list, and card endpoints for that board.
2. WHILE a user holds the `editor` role on a board, THE Permission_Guard SHALL allow `GET`, `POST`, `PATCH`, and `DELETE` requests to list and card endpoints, and `GET` requests to the board endpoint.
3. WHILE a user holds the `owner` role on a board, THE Permission_Guard SHALL allow all operations on the board, its members, lists, and cards.
4. IF a user who is not a member of a board sends any request to a board-scoped endpoint, THEN THE Permission_Guard SHALL return a `403 Forbidden` error.
5. THE Permission_Guard SHALL evaluate permissions on every request to a board-scoped endpoint before the request handler executes.

---

### Requirement 6: Board Listing

**User Story:** As a user, I want to see all boards I have access to, so that I can navigate to my work.

#### Acceptance Criteria

1. WHEN a user sends a `GET /boards` request, THE Board_Service SHALL return only the boards where that user is a member, regardless of role.
2. THE Board_Service SHALL include each board's name, id, and the requesting user's role in the response.
3. WHEN a user sends a `GET /boards/:boardId` request and is a member of that board, THE Board_Service SHALL return the board details including the full member list with roles.
4. IF a user sends a `GET /boards/:boardId` request and is not a member of that board, THEN THE Board_Service SHALL return a `403 Forbidden` error.

---

### Requirement 7: Board Deletion

**User Story:** As a board owner, I want to delete a board, so that I can remove workspaces that are no longer needed.

#### Acceptance Criteria

1. WHEN an owner sends a `DELETE /boards/:boardId` request, THE Board_Service SHALL delete the board and all associated lists, cards, and memberships.
2. WHEN a non-owner sends a `DELETE /boards/:boardId` request, THE Permission_Guard SHALL reject the request with a `403 Forbidden` error.

---

## Permission Matrix

| Action                        | Owner | Editor | Viewer |
|-------------------------------|-------|--------|--------|
| View board & members          | ✅    | ✅     | ✅     |
| Create / edit / delete lists  | ✅    | ✅     | ❌     |
| Create / edit / delete cards  | ✅    | ✅     | ❌     |
| Invite members                | ✅    | ❌     | ❌     |
| Change member roles           | ✅    | ❌     | ❌     |
| Remove members                | ✅    | ❌     | ❌     |
| Delete board                  | ✅    | ❌     | ❌     |
| Leave board (self-remove)     | ✅*   | ✅     | ✅     |

*Owner can leave only if another owner exists or ownership is transferred first.

---

## REST API Reference

| Method | Endpoint                              | Role Required     | Description                        |
|--------|---------------------------------------|-------------------|------------------------------------|
| POST   | `/boards`                             | Authenticated     | Create a board (caller becomes owner) |
| GET    | `/boards`                             | Authenticated     | List boards the caller is a member of |
| GET    | `/boards/:boardId`                    | Member (any role) | Get board details and member list  |
| DELETE | `/boards/:boardId`                    | Owner             | Delete board and all its data      |
| GET    | `/boards/:boardId/members`            | Member (any role) | List members and their roles       |
| POST   | `/boards/:boardId/members`            | Owner             | Invite a user by email with a role |
| PATCH  | `/boards/:boardId/members/:userId`    | Owner             | Update a member's role             |
| DELETE | `/boards/:boardId/members/:userId`    | Owner or Self     | Remove a member (or self-leave)    |
