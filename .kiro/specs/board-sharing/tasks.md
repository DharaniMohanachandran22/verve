# Implementation Plan: Board Sharing

## Overview

Implement the `BoardsModule` in NestJS with MongoDB-backed role storage, JWT-authenticated endpoints, and role-based permission enforcement. The frontend (Next.js) consumes the eight REST endpoints. Implementation proceeds bottom-up: schema → DTOs → service → guards → controller → wiring.

## Tasks

- [x] 1. Set up module scaffold and data layer
  - [x] 1.1 Create the `BoardsModule` directory structure and register the module
    - Create `src/boards/boards.module.ts` and register it in `AppModule`
    - Create placeholder barrel exports for controller, service, schemas, DTOs, guards, and decorators
    - _Requirements: 1.1_

  - [x] 1.2 Define the `Role` enum and `Board` Mongoose schema with embedded `MemberEntry`
    - Create `src/boards/schemas/board.schema.ts` with `Board` and `MemberEntry` sub-schema
    - Add compound indexes: `{ 'members.userId': 1 }` and `{ 'members.userId': 1, 'members.role': 1 }`
    - Register `BoardSchema` in `BoardsModule` via `MongooseModule.forFeature`
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.3 Write property test for Role enum constraint (Property 1)
    - **Property 1: Valid Role Constraint**
    - **Validates: Requirements 1.1, 1.4**
    - Generate arbitrary strings; assert only `'owner'`, `'editor'`, `'viewer'` are accepted by the enum

- [x] 2. Implement DTOs with validation
  - [x] 2.1 Create `CreateBoardDto`, `InviteMemberDto`, and `UpdateMemberRoleDto`
    - `CreateBoardDto`: `name: string` with `@IsNotEmpty()`
    - `InviteMemberDto`: `email: string` with `@IsEmail()`, `role: Role` with `@IsEnum(Role)`
    - `UpdateMemberRoleDto`: `role: Role` with `@IsEnum(Role)`, `newOwnerId?: string` with `@IsOptional() @IsMongoId()`
    - Enable global `ValidationPipe` if not already active
    - _Requirements: 1.1, 1.4, 2.1, 3.1, 3.3_

  - [ ]* 2.2 Write unit tests for DTO validation
    - Test that invalid role strings are rejected with `400`
    - Test that missing required fields are rejected
    - Test that `newOwnerId` is optional
    - _Requirements: 1.4_

- [x] 3. Implement `BoardsService` — board lifecycle methods
  - [x] 3.1 Implement `createBoard(userId, dto)` and `listBoards(userId)`
    - `createBoard`: insert board with `members: [{ userId, role: 'owner' }]`; return `BoardDocument`
    - `listBoards`: query boards where `members.userId = userId`; return `BoardSummary[]` (id, name, caller's role)
    - _Requirements: 1.2, 6.1, 6.2_

  - [ ]* 3.2 Write property test for board creation owner assignment (Property 2)
    - **Property 2: Board Creation Assigns Owner**
    - **Validates: Requirements 1.2**
    - Generate random userId; call `createBoard`; assert `members` has exactly one entry with that userId and `role = 'owner'`

  - [ ]* 3.3 Write property test for board list membership filter (Property 11)
    - **Property 11: Board List Membership Filter**
    - **Validates: Requirements 6.1**
    - Generate random set of boards and users; call `listBoards` for a user; assert result equals boards where user is a member

  - [x] 3.4 Implement `getBoard(boardId, userId)` and `deleteBoard(boardId)`
    - `getBoard`: find board by id; return `BoardDetail` (id, name, members array); throw `404` if not found
    - `deleteBoard`: call `deleteMany` on lists and cards filtered by `boardId`, then delete the board document
    - _Requirements: 6.3, 7.1_

  - [ ]* 3.5 Write property test for cascading delete (Property 10)
    - **Property 10: Cascading Delete**
    - **Validates: Requirements 7.1**
    - Generate board with random lists and cards; call `deleteBoard`; assert zero documents remain for that `boardId` in all three collections

  - [ ]* 3.6 Write property test for response shape completeness (Property 12)
    - **Property 12: Response Shape Completeness**
    - **Validates: Requirements 6.2, 6.3**
    - Generate random board; call `listBoards` and `getBoard`; assert all required fields (`id`, `name`, `role` / `members`) are present

- [x] 4. Implement `BoardsService` — member management methods
  - [x] 4.1 Implement `inviteMember(boardId, dto)`
    - Call `UsersService.findByEmail(dto.email)`; throw `404` if not found
    - Throw `409` if user is already in `members` array
    - Push new `MemberEntry`; return the new entry
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 4.2 Write property test for member invitation grows membership (Property 4)
    - **Property 4: Member Invitation Grows Membership**
    - **Validates: Requirements 2.1, 1.3**
    - Generate board with n members + new user; call `inviteMember`; assert member count = n+1 and role matches

  - [ ]* 4.3 Write property test for duplicate invite rejected (Property 5)
    - **Property 5: Duplicate Invite Rejected**
    - **Validates: Requirements 2.3**
    - Generate board + existing member; call `inviteMember` again; assert `409` and member count unchanged

  - [x] 4.4 Implement `updateMemberRole(boardId, targetUserId, dto, callerId)`
    - Throw `400` if target is the sole owner and new role is not `owner`
    - If caller is demoting themselves, require `dto.newOwnerId` to be promoted simultaneously; throw `400` if missing
    - Update the target member's role; return updated `MemberEntry`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.5 Write property test for sole-owner invariant (Property 3)
    - **Property 3: Sole-Owner Invariant**
    - **Validates: Requirements 1.5, 3.2, 3.3, 4.2**
    - Generate random sequences of invite/update/remove operations; assert owner count is always exactly 1 after each step

  - [ ]* 4.6 Write property test for role update persisted (Property 14)
    - **Property 14: Role Update Persisted**
    - **Validates: Requirements 3.1**
    - Generate board + member + valid role; call `updateMemberRole`; call `getBoard`; assert member's role equals updated value

  - [x] 4.7 Implement `removeMember(boardId, targetUserId, callerId)`
    - Throw `400` if target is the sole owner
    - Allow self-removal for any non-sole-owner role
    - Pull the member entry from the array
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 4.8 Write property test for self-leave allowed (Property 9)
    - **Property 9: Self-Leave Allowed**
    - **Validates: Requirements 4.4**
    - Generate board + editor or viewer member; call self-remove; assert `200` and member no longer in `members` array

- [x] 5. Checkpoint — service layer complete
  - Ensure all service unit tests and property tests pass, ask the user if questions arise.

- [x] 6. Implement `@Roles()` decorator and `Permission_Guard`
  - [x] 6.1 Create the `@Roles()` metadata decorator
    - Create `src/boards/decorators/roles.decorator.ts`
    - Accept `roles: Role[]` and `allowSelf: boolean` matching `PermissionGuardMeta`
    - _Requirements: 5.5_

  - [x] 6.2 Implement `Permission_Guard` (`CanActivate`)
    - Create `src/boards/guards/permission.guard.ts`
    - Extract `boardId` from `req.params`; load board (lean, members only) via `BoardsService`
    - Find caller's membership; return `403` if not found
    - If `allowSelf` and `req.params.userId === req.user.userId` → allow
    - If caller's role is in required `roles` → allow; otherwise `403`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.3 Write property test for non-member access denied (Property 6)
    - **Property 6: Non-Member Access Denied**
    - **Validates: Requirements 5.4, 6.4**
    - Generate board + non-member userId; call any board-scoped endpoint; assert `403`

  - [ ]* 6.4 Write property test for non-owner management denied (Property 7)
    - **Property 7: Non-Owner Management Denied**
    - **Validates: Requirements 2.4, 3.4, 4.3, 7.2**
    - Generate board + editor/viewer member; call owner-only endpoints; assert `403`

  - [ ]* 6.5 Write property test for role permission matrix (Property 8)
    - **Property 8: Role Permission Matrix**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Generate board + member with random role; call each HTTP method on each endpoint type; assert allow/deny matches permission matrix

- [x] 7. Implement `Auth_Guard` (JWT validation)
  - [x] 7.1 Create `Auth_Guard` using `@nestjs/passport` or manual JWT verification
    - Validate Bearer token; attach `{ userId, email }` to `req.user`
    - Return `401` for missing, invalid, or expired tokens
    - _Requirements: 2.5_

  - [ ]* 7.2 Write property test for unauthenticated requests rejected (Property 13)
    - **Property 13: Unauthenticated Requests Rejected**
    - **Validates: Requirements 2.5**
    - Generate any endpoint + request with missing/invalid JWT; assert `401`

- [x] 8. Implement `BoardsController` and wire everything together
  - [x] 8.1 Implement all eight route handlers in `BoardsController`
    - `POST /boards` — `Auth_Guard`, calls `createBoard`
    - `GET /boards` — `Auth_Guard`, calls `listBoards`
    - `GET /boards/:boardId` — `Auth_Guard` + `Permission_Guard(@Roles([]))`, calls `getBoard`
    - `DELETE /boards/:boardId` — `Auth_Guard` + `Permission_Guard(@Roles([owner]))`, calls `deleteBoard`
    - `GET /boards/:boardId/members` — `Auth_Guard` + `Permission_Guard(@Roles([]))`, calls `listMembers`
    - `POST /boards/:boardId/members` — `Auth_Guard` + `Permission_Guard(@Roles([owner]))`, calls `inviteMember`
    - `PATCH /boards/:boardId/members/:userId` — `Auth_Guard` + `Permission_Guard(@Roles([owner]))`, calls `updateMemberRole`
    - `DELETE /boards/:boardId/members/:userId` — `Auth_Guard` + `Permission_Guard(@Roles([owner]), allowSelf: true)`, calls `removeMember`
    - _Requirements: 1.2, 2.1, 2.4, 3.1, 3.4, 4.1, 4.3, 5.5, 6.1, 6.3, 7.1, 7.2_

  - [x] 8.2 Register `BoardsController`, `BoardsService`, `Auth_Guard`, and `Permission_Guard` in `BoardsModule`
    - Ensure `UsersModule` is imported so `UsersService` is injectable
    - _Requirements: all_

  - [ ]* 8.3 Write unit tests for `BoardsController` route handlers
    - Mock `BoardsService`; verify each handler delegates correctly and returns the right HTTP status
    - _Requirements: 2.1, 3.1, 4.1, 6.1, 7.1_

- [x] 9. Final checkpoint — full integration
  - Ensure all unit tests and property-based tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each property-based test uses `fast-check` with a minimum of 100 iterations (`{ numRuns: 100 }`)
- Each property test file must include the tag comment: `// Feature: board-sharing, Property <N>: <property_text>`
- Sole-owner protection is enforced in the service layer, not the guard
- `Permission_Guard` uses a lean MongoDB query (members array only) to minimize read overhead

---

## Frontend Tasks (Next.js + Tailwind CSS)

- [x] 10. Set up frontend project structure and API client
  - [x] 10.1 Create the API client module for board-sharing endpoints
    - Create `lib/api/boards.ts` with typed fetch wrappers for all 8 endpoints
    - Read JWT from cookies and attach as `Authorization: Bearer <token>` header on every request
    - Export typed functions: `createBoard`, `listBoards`, `getBoard`, `deleteBoard`, `listMembers`, `inviteMember`, `updateMemberRole`, `removeMember`
    - _Requirements: 1.2, 2.1, 3.1, 4.1, 6.1, 6.3, 7.1_

  - [x] 10.2 Define shared TypeScript types for the frontend
    - Create `lib/types/board.ts` with `BoardSummary`, `BoardDetail`, `MemberResponse`, `Role` matching the API response shapes from the design
    - _Requirements: 1.1, 6.2, 6.3_

- [x] 11. Implement authentication handling
  - [x] 11.1 Create a JWT cookie utility
    - Create `lib/auth.ts` with helpers to read the JWT from cookies (`getToken`) and check if the user is authenticated (`isAuthenticated`)
    - _Requirements: 2.5_

  - [x] 11.2 Create an `AuthGuard` higher-order component / middleware
    - Redirect unauthenticated users to the login page
    - Wrap board-related pages with this guard
    - _Requirements: 2.5_

- [x] 12. Implement board list page and board creation
  - [x] 12.1 Create the boards list page (`app/boards/page.tsx`)
    - Fetch boards via `listBoards` on mount; display each board as a card showing name and the user's role
    - _Requirements: 6.1, 6.2_

  - [x] 12.2 Create the `CreateBoardModal` component
    - Form with a board name input; calls `createBoard` on submit; closes modal and refreshes board list on success
    - _Requirements: 1.2_

  - [ ]* 12.3 Write unit tests for the boards list page
    - Mock `listBoards`; assert boards render with correct name and role badge
    - _Requirements: 6.1, 6.2_

- [x] 13. Implement board detail page and state management
  - [x] 13.1 Create the board detail page (`app/boards/[boardId]/page.tsx`)
    - Fetch board detail via `getBoard` on mount; render board name and lists/cards layout
    - Store board state (lists, cards, members) in React state or a context
    - _Requirements: 6.3_

  - [x] 13.2 Create a `BoardContext` for shared board state
    - Provide `board`, `members`, `currentUserRole`, and mutation helpers to child components
    - Derive `currentUserRole` from the members list and the JWT-decoded userId
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 14. Implement List and Card UI components
  - [x] 14.1 Create the `List` component (`components/board/List.tsx`)
    - Render list title and its cards; show add-card button for `owner` and `editor` roles only
    - _Requirements: 5.1, 5.2_

  - [x] 14.2 Create the `Card` component (`components/board/Card.tsx`)
    - Render card title; show edit/delete controls for `owner` and `editor` roles only
    - _Requirements: 5.1, 5.2_

  - [x] 14.3 Create the `Board` component (`components/board/Board.tsx`)
    - Render all lists horizontally; show add-list button for `owner` and `editor` roles only
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 14.4 Write unit tests for role-based UI visibility
    - Render `Board`, `List`, and `Card` with each role; assert action buttons are shown/hidden correctly
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 15. Implement drag and drop for lists and cards
  - [x] 15.1 Add drag-and-drop to the `Board` component for reordering lists
    - Use a drag-and-drop library (e.g., `@hello-pangea/dnd`); only allow drag for `owner` and `editor` roles
    - Optimistically update local state on drop; persist order via the relevant API call
    - _Requirements: 5.2, 5.3_

  - [x] 15.2 Add drag-and-drop to the `List` component for reordering and moving cards
    - Allow cards to be reordered within a list and moved between lists
    - Only allow drag for `owner` and `editor` roles
    - _Requirements: 5.2, 5.3_

- [x] 16. Implement member management UI
  - [x] 16.1 Create the `MembersPanel` component (`components/board/MembersPanel.tsx`)
    - Fetch members via `listMembers`; display each member with their role
    - Show invite, role-change, and remove controls only for `owner` role
    - _Requirements: 2.4, 3.4, 4.3, 5.3_

  - [x] 16.2 Create the `InviteMemberModal` component
    - Form with email and role inputs; calls `inviteMember` on submit; shows error messages for `404` and `409` responses
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 16.3 Create the `UpdateRoleModal` component
    - Dropdown to select new role; if owner is demoting themselves, show a second dropdown to select the new owner (`newOwnerId`)
    - Calls `updateMemberRole` on submit
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 16.4 Implement self-leave and member removal actions in `MembersPanel`
    - Show a "Leave board" button for the current user (non-sole-owner); show "Remove" button per member for owners
    - Call `removeMember` and redirect/refresh accordingly
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 16.5 Write unit tests for `MembersPanel` and modals
    - Mock API calls; assert correct rendering and error handling for each scenario
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 4.1, 4.4_

- [x] 17. Implement board deletion UI
  - [x] 17.1 Add a delete board action to the board detail page
    - Show a confirmation modal; call `deleteBoard` on confirm; redirect to boards list on success
    - Only render the delete button for `owner` role
    - _Requirements: 7.1, 7.2_

- [x] 18. Frontend checkpoint — core UI complete
  - Ensure all component unit tests pass and role-based visibility is correct, ask the user if questions arise.

---

## Integration Tasks

- [x] 19. Wire API client to board list and board detail pages
  - [x] 19.1 Connect `listBoards` to the boards list page with loading and error states
    - Show a loading skeleton while fetching; show an error message on failure
    - _Requirements: 6.1, 6.2_

  - [x] 19.2 Connect `getBoard` and `listMembers` to the board detail page
    - Populate `BoardContext` with fetched data; handle `403` by redirecting to boards list
    - _Requirements: 6.3, 6.4_

- [x] 20. Wire member management actions to the backend
  - [x] 20.1 Connect `InviteMemberModal` to `inviteMember` endpoint
    - On success, refresh the members list in `BoardContext`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 20.2 Connect `UpdateRoleModal` to `updateMemberRole` endpoint
    - On success, update the member's role in `BoardContext`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 20.3 Connect removal and self-leave actions to `removeMember` endpoint
    - On success, remove the member from `BoardContext`; redirect current user to boards list on self-leave
    - _Requirements: 4.1, 4.4_

- [x] 21. Wire drag-and-drop to backend persistence
  - [x] 21.1 Connect list reorder drop events to the relevant list-order API call
    - Optimistic update on drop; revert on API error
    - _Requirements: 5.2, 5.3_

  - [x] 21.2 Connect card move/reorder drop events to the relevant card-order API call
    - Optimistic update on drop; revert on API error
    - _Requirements: 5.2, 5.3_

- [x] 22. Handle authentication errors across all API calls
  - [x] 22.1 Add a global response interceptor in the API client
    - On `401` response from any endpoint, clear the JWT cookie and redirect to the login page
    - _Requirements: 2.5_

- [x] 23. Final integration checkpoint
  - Ensure all unit tests pass and all API integrations are wired correctly, ask the user if questions arise.
