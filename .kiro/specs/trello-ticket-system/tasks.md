# Implementation Plan: Trello Ticket System

## Overview

This implementation plan breaks down the Trello-like ticket management system into sequential, actionable tasks. The system uses NestJS with MongoDB for the backend and Next.js with React for the frontend. Each task builds on previous work, starting with foundational infrastructure and progressing through feature implementation to frontend integration.

## Tasks

- [x] 1. Backend project setup and core infrastructure
  - Initialize NestJS project with TypeScript configuration
  - Install dependencies: @nestjs/mongoose, mongoose, @nestjs/jwt, @nestjs/passport, bcrypt, class-validator, class-transformer
  - Configure MongoDB connection with environment variables
  - Set up global validation pipe and exception filters
  - Create base project structure with modules folder
  - Configure CORS for frontend integration
  - _Requirements: 1.1, 1.4, 18.1, 18.2, 20.7_

- [x] 2. Authentication module implementation
  - [x] 2.1 Create User schema and model
    - Define User schema with email (unique, indexed), password, name, timestamps
    - Implement password hashing with bcrypt pre-save hook
    - _Requirements: 1.2, 1.4_

  - [ ]* 2.2 Write property test for User schema
    - **Property 1: Valid Registration Creates Account**
    - **Validates: Requirements 1.2, 1.4**

  - [x] 2.3 Create authentication DTOs
    - Implement RegisterDto with email, password, name validation
    - Implement LoginDto with email, password validation
    - Add class-validator decorators for validation rules
    - _Requirements: 1.1, 1.5, 18.3, 18.4_

  - [x] 2.4 Implement AuthService
    - Create register method with duplicate email check
    - Create login method with credential validation
    - Implement JWT token generation with 7-day expiration
    - Add password comparison logic
    - _Requirements: 1.2, 1.3, 1.6, 1.8_

  - [ ]* 2.5 Write property tests for AuthService
    - **Property 2: Duplicate Email Registration Rejected**
    - **Property 3: Valid Login Generates JWT**
    - **Property 4: Invalid Credentials Rejected**
    - **Validates: Requirements 1.3, 1.6, 1.7, 1.8**

  - [x] 2.6 Create JWT strategy and guards
    - Implement JwtStrategy with cookie extraction
    - Create JwtAuthGuard for protected endpoints
    - Create Public decorator for public endpoints
    - Create CurrentUser decorator for user extraction
    - _Requirements: 1.7, 1.9, 1.10_

  - [ ]* 2.7 Write property tests for JWT validation
    - **Property 5: Protected Endpoints Validate Tokens**
    - **Property 6: Expired Tokens Rejected**
    - **Validates: Requirements 1.9, 1.10**

  - [x] 2.8 Create AuthController
    - Implement POST /api/auth/register endpoint
    - Implement POST /api/auth/login endpoint with HTTP-only cookie
    - Implement POST /api/auth/logout endpoint
    - Implement GET /api/auth/me endpoint
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

  - [ ]* 2.9 Write unit tests for AuthController
    - Test registration success and validation errors
    - Test login success and authentication errors
    - Test logout cookie clearing
    - _Requirements: 1.1, 1.3, 1.8_

- [x] 3. Users module implementation
  - [x] 3.1 Create UsersService
    - Implement findById, findByEmail, findIdsByUsernames methods
    - Add user lookup and validation logic
    - _Requirements: 1.2, 10.6_

  - [x] 3.2 Create UsersController
    - Implement GET /api/users/:userId endpoint
    - Add authentication guard
    - _Requirements: 1.9_

  - [ ]* 3.3 Write unit tests for UsersService
    - Test user lookup methods
    - Test error handling for non-existent users
    - _Requirements: 18.5_

- [x] 4. Checkpoint - Ensure authentication works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Board module implementation
  - [x] 5.1 Create Board schema and model
    - Define Board schema with name, description, createdBy, members array, archived flag
    - Add indexes for members.user and archived fields
    - Implement member subdocument with user reference and role enum
    - _Requirements: 2.1, 2.2, 2.6, 3.1_

  - [x] 5.2 Create List schema and model
    - Define List schema with boardId, name, position, archived flag
    - Add indexes for boardId and position fields
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.3 Create board DTOs
    - Implement CreateBoardDto with name and description validation
    - Implement UpdateBoardDto with optional fields
    - Implement InviteMemberDto with userId and role validation
    - Implement UpdateMemberRoleDto with role validation
    - _Requirements: 2.4, 3.3, 3.4, 3.5_

  - [x] 5.4 Implement BoardsService core methods
    - Create createBoard method that assigns creator as admin
    - Create default lists (To-Do, In Progress, Completed) on board creation
    - Implement findById, findUserBoards methods
    - Implement updateBoard method with admin check
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 3.2_

  - [ ]* 5.5 Write property tests for board creation
    - **Property 7: Board Creator Assigned as Admin**
    - **Property 9: Default Lists Created**
    - **Property 12: Board Metadata Stored**
    - **Validates: Requirements 2.1, 2.3, 2.6, 3.2**

  - [x] 5.6 Implement board member management
    - Create inviteMember method with role assignment
    - Create updateMemberRole method with admin check
    - Create removeMember method with admin check
    - Add validation to prevent removing last admin
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.7 Write property tests for member management
    - **Property 14: Admin Can Invite Users**
    - **Property 15: Admin Can Modify Member Roles**
    - **Property 16: Admin Can Remove Members**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6**

  - [x] 5.8 Implement board archive and restore
    - Create archiveBoard method with admin check
    - Create restoreBoard method with admin check
    - _Requirements: 2.7, 2.8_

  - [ ]* 5.9 Write property test for archive/restore
    - **Property 13: Board Archive and Restore Round Trip**
    - **Validates: Requirements 2.7, 2.8**

  - [x] 5.10 Create authorization guards
    - Implement BoardMemberGuard to verify board membership
    - Implement BoardRoleGuard to verify role permissions
    - Create RequireRole decorator for role specification
    - _Requirements: 3.7, 3.8, 3.9, 3.10, 19.2, 19.3, 19.4_

  - [ ]* 5.11 Write property tests for authorization
    - **Property 17: Non-Admins Cannot Modify Board Settings**
    - **Property 18: Observers Cannot Modify Lists or Cards**
    - **Property 19: Members Can Modify Lists and Cards**
    - **Property 20: All Roles Can View Content**
    - **Validates: Requirements 3.7, 3.8, 3.9, 3.10, 19.3, 19.4**

  - [x] 5.12 Create BoardsController
    - Implement POST /api/boards endpoint
    - Implement GET /api/boards endpoint
    - Implement GET /api/boards/:boardId endpoint
    - Implement PATCH /api/boards/:boardId endpoint with admin guard
    - Implement DELETE /api/boards/:boardId/archive endpoint with admin guard
    - Implement POST /api/boards/:boardId/restore endpoint with admin guard
    - Implement POST /api/boards/:boardId/members endpoint with admin guard
    - Implement PATCH /api/boards/:boardId/members/:userId endpoint with admin guard
    - Implement DELETE /api/boards/:boardId/members/:userId endpoint with admin guard
    - _Requirements: 2.1, 2.4, 2.5, 2.7, 2.8, 3.3, 3.5, 3.6_

  - [ ]* 5.13 Write unit tests for BoardsController
    - Test board creation and default lists
    - Test authorization for admin-only endpoints
    - Test member management operations
    - _Requirements: 2.1, 2.3, 3.3, 19.4_

- [x] 6. Lists module implementation
  - [x] 6.1 Create list DTOs
    - Implement CreateListDto with name and optional position
    - Implement UpdateListDto with optional name
    - Implement ReorderListDto with position
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.2 Implement ListsService
    - Create createList method with position calculation
    - Implement findByBoardId method with position sorting
    - Implement updateList method with member check
    - Implement reorderList method with position updates
    - Implement archiveList and restoreList methods
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9_

  - [ ]* 6.3 Write property tests for lists
    - **Property 21: List Creation Adds to Board**
    - **Property 22: List Position Order Maintained**
    - **Property 24: List Archive and Restore Round Trip**
    - **Property 25: Lists Returned in Position Order**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 4.9**

  - [x] 6.4 Create ListsController
    - Implement POST /api/boards/:boardId/lists endpoint with member guard
    - Implement GET /api/boards/:boardId/lists endpoint
    - Implement PATCH /api/lists/:listId endpoint with member guard
    - Implement PATCH /api/lists/:listId/position endpoint with member guard
    - Implement DELETE /api/lists/:listId/archive endpoint with member guard
    - Implement POST /api/lists/:listId/restore endpoint with member guard
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 6.5 Write unit tests for ListsController
    - Test list creation and position assignment
    - Test list reordering logic
    - Test archive and restore operations
    - _Requirements: 4.1, 4.4, 4.6_

- [x] 7. Cards module implementation
  - [x] 7.1 Create Card schema and model
    - Define Card schema with listId, boardId, title, description, position
    - Add assignee, dueDate, priority, labels array, watchers array
    - Add archived flag and createdBy reference
    - Add indexes for listId, boardId, assignee, archived, dueDate
    - _Requirements: 5.1, 5.2, 5.9, 6.1, 6.5, 7.2, 8.1, 12.1_

  - [x] 7.2 Create card DTOs
    - Implement CreateCardDto with title, description, position validation
    - Implement UpdateCardDto with optional fields
    - Implement MoveCardDto with listId and position
    - Implement AddLabelDto with labelId
    - _Requirements: 5.1, 5.3, 5.7, 5.8, 6.1, 6.5, 7.3, 8.2_

  - [x] 7.3 Implement CardsService core methods
    - Create createCard method with position calculation
    - Implement findByListId method with position sorting
    - Implement findById method with population
    - Implement updateCard method with member check
    - Implement moveCard method with list and position updates
    - Implement archiveCard and restoreCard methods
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8, 5.10, 13.1, 13.2, 13.3_

  - [ ]* 7.4 Write property tests for card operations
    - **Property 26: Card Creation Adds to List**
    - **Property 27: Card Title Required**
    - **Property 28: Card Position Order Maintained**
    - **Property 29: Card Movement Updates List and Position**
    - **Property 31: Card Metadata Stored**
    - **Property 32: Cards Returned in Position Order**
    - **Property 61: Card Archive Authorization**
    - **Property 62: Card Archive and Restore Round Trip**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 5.9, 5.10, 13.1, 13.2, 13.3, 13.4, 13.5**

  - [x] 7.5 Implement card assignment and due date
    - Add assignCard method with board member validation
    - Add updateDueDate method with date validation
    - Add removeAssignee and removeDueDate methods
    - Implement auto-watch on assignment
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.5_

  - [ ]* 7.6 Write property tests for assignment and due dates
    - **Property 33: Card Assignment to Board Members**
    - **Property 34: Assignee Can Be Changed or Removed**
    - **Property 35: Due Date Management**
    - **Property 59: Assignee Auto-Watch**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 12.5**

  - [x] 7.6 Implement card priority
    - Add setPriority method with enum validation
    - Add removePriority method
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]* 7.7 Write property test for priority
    - **Property 41: Priority Management**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**

  - [x] 7.8 Implement card watchers
    - Add addWatcher method for self-watching
    - Add removeWatcher method for self-removal
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 7.9 Write property tests for watchers
    - **Property 57: Self-Watching Management**
    - **Property 60: Watchers Included in Response**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.6**

  - [x] 7.10 Create CardsController
    - Implement POST /api/lists/:listId/cards endpoint with member guard
    - Implement GET /api/lists/:listId/cards endpoint
    - Implement GET /api/cards/:cardId endpoint
    - Implement PATCH /api/cards/:cardId endpoint with member guard
    - Implement PATCH /api/cards/:cardId/move endpoint with member guard
    - Implement DELETE /api/cards/:cardId/archive endpoint with member guard
    - Implement POST /api/cards/:cardId/restore endpoint with member guard
    - Implement POST /api/cards/:cardId/watchers endpoint
    - Implement DELETE /api/cards/:cardId/watchers endpoint
    - Implement POST /api/cards/:cardId/labels endpoint with member guard
    - Implement DELETE /api/cards/:cardId/labels/:labelId endpoint with member guard
    - _Requirements: 5.1, 5.7, 5.8, 6.1, 6.3, 7.3, 7.4, 8.2, 12.1, 12.2, 13.1, 13.3_

  - [ ]* 7.11 Write unit tests for CardsController
    - Test card creation and position assignment
    - Test card movement between lists
    - Test assignment and due date operations
    - Test watcher management
    - _Requirements: 5.1, 5.7, 6.1, 12.1_

- [x] 8. Checkpoint - Ensure core board/list/card functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Labels module implementation
  - [x] 9.1 Create Label schema and model
    - Define Label schema with boardId, name, color
    - Add index for boardId
    - _Requirements: 7.1, 7.5_

  - [x] 9.2 Create label DTOs
    - Implement CreateLabelDto with name and color validation
    - Implement UpdateLabelDto with optional fields
    - Add hex color format validation
    - _Requirements: 7.1, 7.6_

  - [x] 9.3 Implement LabelsService
    - Create createLabel method with board validation
    - Implement findByBoardId method
    - Implement updateLabel method with admin check
    - Implement deleteLabel method with cascade removal from cards
    - _Requirements: 7.1, 7.2, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 9.4 Write property tests for labels
    - **Property 36: Label Creation and Application**
    - **Property 38: Labels Are Board-Specific**
    - **Property 39: Admin Can Edit Labels**
    - **Property 40: Label Deletion Cascades**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8**

  - [x] 9.5 Create LabelsController
    - Implement POST /api/boards/:boardId/labels endpoint with member guard
    - Implement GET /api/boards/:boardId/labels endpoint
    - Implement PATCH /api/labels/:labelId endpoint with admin guard
    - Implement DELETE /api/labels/:labelId endpoint with admin guard
    - _Requirements: 7.1, 7.6, 7.7_

  - [ ]* 9.6 Write unit tests for LabelsController
    - Test label creation and board association
    - Test label deletion cascade
    - Test admin-only operations
    - _Requirements: 7.1, 7.7, 7.8_

- [x] 10. Checklists module implementation
  - [x] 10.1 Create Checklist schema and model
    - Define Checklist schema with cardId, title, items array
    - Define ChecklistItem subdocument with text, completed, position
    - Add index for cardId
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 10.2 Create checklist DTOs
    - Implement CreateChecklistDto with title validation
    - Implement AddChecklistItemDto with text and position
    - Implement UpdateChecklistItemDto with text and completed
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 10.3 Implement ChecklistsService
    - Create createChecklist method with card validation
    - Implement addItem method with position calculation
    - Implement updateItem method for text and completion
    - Implement deleteItem method
    - Implement deleteChecklist method
    - Add calculateCompletionPercentage helper method
    - _Requirements: 9.1, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [ ]* 10.4 Write property tests for checklists
    - **Property 42: Checklist Creation**
    - **Property 43: Checklist Item Management**
    - **Property 44: Checklist Deletion**
    - **Property 45: Checklist Completion Percentage**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9**

  - [x] 10.5 Create ChecklistsController
    - Implement POST /api/cards/:cardId/checklists endpoint with member guard
    - Implement POST /api/checklists/:checklistId/items endpoint with member guard
    - Implement PATCH /api/checklists/:checklistId/items/:itemId endpoint with member guard
    - Implement DELETE /api/checklists/:checklistId/items/:itemId endpoint with member guard
    - Implement DELETE /api/checklists/:checklistId endpoint with member guard
    - _Requirements: 9.1, 9.4, 9.5, 9.7, 9.8_

  - [ ]* 10.6 Write unit tests for ChecklistsController
    - Test checklist creation and item management
    - Test completion percentage calculation
    - Test authorization checks
    - _Requirements: 9.1, 9.4, 9.9_

- [x] 11. Comments module implementation
  - [x] 11.1 Create Comment schema and model
    - Define Comment schema with cardId, author, content, mentions array
    - Add indexes for cardId and createdAt
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 11.2 Create comment DTOs
    - Implement CreateCommentDto with content validation
    - Implement UpdateCommentDto with content validation
    - _Requirements: 10.1, 10.3_

  - [x] 11.3 Implement CommentsService
    - Create createComment method with mention parsing
    - Implement parseMentions helper to extract @username references
    - Implement findByCardId method with chronological sorting
    - Implement updateComment method with author check
    - Implement deleteComment method with author/admin check
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8_

  - [ ]* 11.4 Write property tests for comments
    - **Property 46: All Members Can Comment**
    - **Property 47: Comment Metadata Stored**
    - **Property 48: Comment Author Can Edit**
    - **Property 49: Comment Deletion Authorization**
    - **Property 50: Mention Parsing**
    - **Property 52: Comments Returned Chronologically**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8, 19.6**

  - [x] 11.5 Create IsCommentAuthor guard
    - Implement guard to verify comment author or board admin
    - _Requirements: 10.4, 19.6_

  - [x] 11.6 Create CommentsController
    - Implement POST /api/cards/:cardId/comments endpoint
    - Implement GET /api/cards/:cardId/comments endpoint
    - Implement PATCH /api/comments/:commentId endpoint with author guard
    - Implement DELETE /api/comments/:commentId endpoint with author/admin guard
    - _Requirements: 10.1, 10.3, 10.4_

  - [ ]* 11.7 Write unit tests for CommentsController
    - Test comment creation and mention parsing
    - Test author-only edit operations
    - Test admin delete permissions
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [x] 12. Attachments module implementation
  - [x] 12.1 Create Attachment schema and model
    - Define Attachment schema with cardId, filename, originalName, mimeType, size, path, uploadedBy
    - Add index for cardId
    - _Requirements: 11.2, 11.7_

  - [x] 12.2 Configure file upload middleware
    - Set up Multer with local storage configuration
    - Configure file size limit (10MB)
    - Configure allowed MIME types
    - Implement filename sanitization and UUID generation
    - Create uploads directory structure
    - _Requirements: 11.1, 11.5, 11.6_

  - [x] 12.3 Implement AttachmentsService
    - Create uploadAttachment method with file validation
    - Implement findByCardId method
    - Implement deleteAttachment method with file system cleanup
    - Add file size validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 11.7_

  - [ ]* 12.4 Write property tests for attachments
    - **Property 53: File Upload Authorization**
    - **Property 54: Attachment Metadata Stored**
    - **Property 55: Attachment Deletion Authorization**
    - **Property 56: File Size Validation**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.6, 11.7**

  - [x] 12.5 Create AttachmentsController
    - Implement POST /api/cards/:cardId/attachments endpoint with member guard and file upload
    - Implement GET /api/attachments/:attachmentId endpoint for file download
    - Implement DELETE /api/attachments/:attachmentId endpoint with member guard
    - _Requirements: 11.1, 11.4, 11.5_

  - [ ]* 12.6 Write unit tests for AttachmentsController
    - Test file upload and metadata storage
    - Test file download streaming
    - Test file size validation
    - _Requirements: 11.1, 11.6_

- [x] 13. Activities module implementation
  - [x] 13.1 Create Activity schema and model
    - Define Activity schema with boardId, cardId, actor, actionType, entityType, entityId, metadata
    - Add indexes for boardId, cardId, createdAt
    - Define actionType enum with all activity types
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 13.2 Implement ActivitiesService
    - Create logActivity method to persist activity records
    - Implement findByBoardId method with reverse chronological sorting
    - Implement findByCardId method with reverse chronological sorting
    - Add actor population for activity responses
    - _Requirements: 14.1, 14.7, 14.8, 14.9_

  - [ ]* 13.3 Write property tests for activities
    - **Property 63: Board Operations Logged**
    - **Property 64: List Operations Logged**
    - **Property 65: Card Operations Logged**
    - **Property 66: Comment Operations Logged**
    - **Property 67: Member Operations Logged**
    - **Property 68: Attachment Operations Logged**
    - **Property 69: Activity Log Metadata Complete**
    - **Property 70: Activities Returned in Reverse Chronological Order**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.9**

  - [x] 13.4 Create ActivityLoggerInterceptor
    - Implement NestJS interceptor to automatically log activities
    - Extract action type from route and HTTP method
    - Extract entity information from params, body, and response
    - Call ActivitiesService.logActivity for each request
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 13.5 Create ActivitiesController
    - Implement GET /api/boards/:boardId/activities endpoint
    - Implement GET /api/cards/:cardId/activities endpoint
    - _Requirements: 14.8, 14.9_

  - [ ]* 13.6 Write unit tests for ActivitiesController
    - Test activity retrieval for boards
    - Test activity retrieval for cards
    - Test reverse chronological ordering
    - _Requirements: 14.8, 14.9_

- [x] 14. Notifications module implementation
  - [x] 14.1 Create Notification schema and model
    - Define Notification schema with userId, type, actor, entityType, entityId, read flag
    - Add indexes for userId, read, createdAt
    - Define notification type enum
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.7_

  - [x] 14.2 Implement NotificationsService
    - Create createNotification method for different notification types
    - Implement findByUserId method with unread filter and reverse chronological sorting
    - Implement markAsRead method
    - Implement markAllAsRead method
    - Add entity population for notification responses
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.8_

  - [ ]* 14.3 Write property tests for notifications
    - **Property 51: Mention Notifications**
    - **Property 58: Watcher Notifications**
    - **Property 71: Assignment Notifications**
    - **Property 72: Board Invitation Notifications**
    - **Property 73: Notification Mark as Read**
    - **Property 74: Notification Metadata Complete**
    - **Property 75: Notifications Returned in Reverse Chronological Order**
    - **Validates: Requirements 10.7, 12.4, 15.1, 15.2, 15.3, 15.4, 15.6, 15.7, 15.8**

  - [x] 14.4 Integrate notifications into existing services
    - Add notification creation to CommentsService for mentions
    - Add notification creation to CardsService for assignments and updates
    - Add notification creation to BoardsService for invitations
    - Filter out actor from watcher notifications
    - _Requirements: 10.7, 12.4, 15.1, 15.2, 15.3, 15.4_

  - [x] 14.5 Create NotificationsController
    - Implement GET /api/notifications endpoint
    - Implement PATCH /api/notifications/:notificationId/read endpoint
    - Implement PATCH /api/notifications/read-all endpoint
    - _Requirements: 15.5, 15.6_

  - [ ]* 14.6 Write unit tests for NotificationsController
    - Test notification retrieval
    - Test mark as read operations
    - Test filtering and sorting
    - _Requirements: 15.5, 15.6, 15.8_

- [x] 15. Search and filter module implementation
  - [x] 15.1 Implement SearchService
    - Create searchCards method with case-insensitive regex matching
    - Search both title and description fields
    - Exclude archived cards from results
    - Add list name population
    - Sort by updatedAt descending
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ]* 15.2 Write property tests for search
    - **Property 76: Search Matches Title or Description**
    - **Property 77: Search Results Include List Name**
    - **Property 78: Search Excludes Archived Cards**
    - **Validates: Requirements 16.2, 16.3, 16.4, 16.5**

  - [x] 15.3 Implement filter functionality
    - Create filterCards method with multiple criteria support
    - Implement assignee filter
    - Implement labels filter with ALL logic
    - Implement priority filter
    - Implement due date range filter
    - Combine filters with AND logic
    - Exclude archived cards from results
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [ ]* 15.4 Write property tests for filtering
    - **Property 79: Filter by Assignee**
    - **Property 80: Filter by Labels**
    - **Property 81: Filter by Priority**
    - **Property 82: Filter by Due Date Range**
    - **Property 83: Combined Filters Use AND Logic**
    - **Property 84: Filter Results Include Full Card Details**
    - **Property 85: Filters Exclude Archived Cards**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7**

  - [x] 15.5 Create search and filter DTOs
    - Implement SearchCardsDto with query validation
    - Implement FilterCardsDto with optional filter fields
    - _Requirements: 16.1, 17.1, 17.2, 17.3, 17.4_

  - [x] 15.6 Create SearchController
    - Implement GET /api/boards/:boardId/search endpoint
    - Implement GET /api/boards/:boardId/cards/filter endpoint
    - _Requirements: 16.1, 17.1_

  - [ ]* 15.7 Write unit tests for SearchController
    - Test search functionality
    - Test filter combinations
    - Test result formatting
    - _Requirements: 16.1, 17.1, 17.5_

- [ ] 16. Checkpoint - Ensure all backend modules work together
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Error handling and validation implementation
  - [ ] 17.1 Create global exception filter
    - Implement AllExceptionsFilter to catch all exceptions
    - Format error responses consistently
    - Log server errors with stack traces
    - Map exceptions to appropriate HTTP status codes
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

  - [ ]* 17.2 Write property tests for error handling
    - **Property 86: Missing Required Fields Rejected**
    - **Property 87: Invalid Data Types Rejected**
    - **Property 88: Invalid Email Format Rejected**
    - **Property 89: Short Passwords Rejected**
    - **Property 90: Invalid Entity IDs Rejected**
    - **Property 91: Referential Integrity Validated**
    - **Property 95: Appropriate HTTP Status Codes**
    - **Property 96: Consistent Error Response Format**
    - **Property 97: Server Errors Logged**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 20.1-20.8**

  - [ ] 17.3 Create custom exception classes
    - Implement InvalidCredentialsException
    - Implement NotBoardMemberException
    - Implement InsufficientPermissionsException
    - Implement BoardNotFoundException, CardNotFoundException, etc.
    - Implement DuplicateEmailException
    - Implement InvalidFileTypeException, FileSizeExceededException
    - _Requirements: 1.8, 18.3, 18.5, 18.6, 19.2, 19.3_

  - [ ] 17.4 Add ParseObjectIdPipe for MongoDB ID validation
    - Implement pipe to validate ObjectId format
    - Return 400 for invalid ObjectId strings
    - _Requirements: 18.5_

  - [ ]* 17.5 Write property tests for authorization
    - **Property 92: Unauthenticated Requests Rejected**
    - **Property 93: Non-Members Cannot Access Board**
    - **Property 94: Non-Admins Cannot Change Roles**
    - **Validates: Requirements 19.1, 19.2, 19.5**

- [ ] 18. Backend integration and configuration
  - [ ] 18.1 Configure environment variables
    - Create .env.example with all required variables
    - Document MongoDB connection string, JWT secret, port, file upload settings
    - _Requirements: 1.6, 11.6_

  - [ ] 18.2 Set up main.ts with global configuration
    - Apply global validation pipe with whitelist and transform
    - Apply global exception filter
    - Apply activity logger interceptor
    - Configure CORS for frontend
    - Configure cookie parser
    - Set up Swagger/OpenAPI documentation
    - _Requirements: 18.1, 18.2, 20.7_

  - [ ] 18.3 Create database indexes
    - Ensure all schema indexes are created on application startup
    - Add compound indexes for common query patterns
    - _Requirements: Performance optimization_

  - [ ]* 18.4 Write integration tests
    - Test complete user registration and login flow
    - Test board creation with default lists
    - Test card creation and movement workflow
    - Test notification creation on mentions and assignments
    - _Requirements: 1.1, 2.1, 2.3, 5.1, 5.7, 10.7, 15.2_

- [ ] 19. Frontend project setup
  - [ ] 19.1 Initialize Next.js project
    - Create Next.js 14 project with TypeScript and App Router
    - Install dependencies: axios, react-query/swr, react-beautiful-dnd or @dnd-kit
    - Configure Tailwind CSS or preferred styling solution
    - Set up project structure with components, lib, contexts folders
    - _Requirements: Frontend infrastructure_

  - [ ] 19.2 Create API client
    - Implement ApiClient class with axios
    - Configure credentials: 'include' for cookie handling
    - Add request/response interceptors
    - Create typed API methods for all endpoints
    - Add error handling and response transformation
    - _Requirements: Frontend API integration_

  - [x] 19.3 Set up authentication context
    - Create AuthContext with user state
    - Implement useAuth hook
    - Add login, logout, register methods
    - Implement protected route wrapper
    - _Requirements: 1.1, 1.5, 1.6_

- [x] 20. Authentication pages implementation
  - [ ] 20.1 Create login page
    - Implement LoginForm component with email and password fields
    - Add form validation with error messages
    - Handle login API call and cookie storage
    - Redirect to dashboard on success
    - _Requirements: 1.5, 1.8_

  - [ ] 20.2 Create registration page
    - Implement RegisterForm component with email, password, name fields
    - Add form validation with password length check
    - Handle registration API call
    - Redirect to dashboard on success
    - _Requirements: 1.1, 1.2, 18.3, 18.4_

  - [ ] 20.3 Create landing page
    - Implement public landing page with app description
    - Add links to login and register pages
    - _Requirements: User experience_

- [x] 21. Dashboard and board list implementation
  - [ ] 21.1 Create dashboard page
    - Implement page to display user's boards
    - Fetch boards from API on load
    - Add create board button and modal
    - Show loading and error states
    - _Requirements: 2.1, 2.5_

  - [ ] 21.2 Create BoardCard component
    - Display board name and description
    - Show member count
    - Add click handler to navigate to board
    - _Requirements: 2.5_

  - [ ] 21.3 Create CreateBoardModal component
    - Implement form with name and description fields
    - Handle board creation API call
    - Refresh board list on success
    - _Requirements: 2.1_

- [ ] 22. Board view implementation
  - [x] 22.1 Create board page
    - Implement dynamic route for /boards/[boardId]
    - Fetch board details with lists and cards
    - Display board header with name and description
    - Render lists horizontally
    - Add create list button
    - _Requirements: 2.5, 4.1, 5.1_

  - [ ] 22.2 Create BoardHeader component
    - Display board name and description
    - Show board members with avatars
    - Add invite member button for admins
    - Add board settings button for admins
    - _Requirements: 2.4, 3.3_

  - [ ] 22.3 Create BoardMemberList component
    - Display list of board members with roles
    - Show role badges (Admin, Member, Observer)
    - Add role change dropdown for admins
    - Add remove member button for admins
    - _Requirements: 3.5, 3.6_

  - [ ] 22.4 Create InviteMemberModal component
    - Implement user search/select functionality
    - Add role selection dropdown
    - Handle invite member API call
    - _Requirements: 3.3, 3.4_

- [ ] 23. List components implementation
  - [x] 23.1 Create List component
    - Display list name and card count
    - Render cards vertically
    - Add create card button
    - Add list menu with archive option
    - Implement drag and drop for list reordering
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 5.1_

  - [ ] 23.2 Create ListHeader component
    - Display list name with inline editing
    - Add list menu dropdown
    - Show archive and restore options
    - _Requirements: 4.5, 4.6, 4.7_

  - [ ] 23.3 Create CreateListForm component
    - Implement inline form to create new list
    - Handle list creation API call
    - Clear form on success
    - _Requirements: 4.1_

- [ ] 24. Card components implementation
  - [x] 24.1 Create Card component
    - Display card title and preview information
    - Show assignee avatar if assigned
    - Show due date badge with color coding
    - Show priority indicator
    - Show label chips
    - Show checklist progress if present
    - Add click handler to open card detail
    - Implement drag and drop for card reordering and movement
    - _Requirements: 5.1, 5.5, 5.6, 5.7, 6.1, 6.5, 7.2, 8.1, 9.2_

  - [x] 24.2 Create CardDetail modal/page
    - Display full card information
    - Show title with inline editing
    - Show description with markdown support
    - Display all card properties (assignee, due date, priority, labels)
    - Show checklists with items
    - Show comments section
    - Show attachments list
    - Show activity log
    - Add watchers section
    - _Requirements: 5.8, 6.1, 6.5, 7.2, 8.1, 9.2, 10.1, 11.1, 12.1, 14.8_

  - [ ] 24.3 Create CardAssignment component
    - Display current assignee with avatar
    - Add assignee selector dropdown with board members
    - Handle assign/unassign API calls
    - _Requirements: 6.1, 6.3, 6.4_

  - [ ] 24.4 Create CardDueDate component
    - Display current due date with formatting
    - Add date/time picker
    - Show overdue indicator
    - Handle due date set/update/remove API calls
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

  - [ ] 24.5 Create CardPriority component
    - Display current priority with color coding
    - Add priority selector dropdown
    - Handle priority set/update/remove API calls
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 24.6 Create CardLabels component
    - Display label chips with colors
    - Add label selector dropdown
    - Handle add/remove label API calls
    - Show create new label option for members
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 24.7 Create CardChecklist component
    - Display checklist title and completion percentage
    - Render checklist items with checkboxes
    - Add new item input
    - Handle item toggle, edit, delete API calls
    - Add delete checklist button
    - _Requirements: 9.1, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [ ] 24.8 Create CardComments component
    - Display comments in chronological order
    - Show comment author and timestamp
    - Add new comment input with mention support
    - Handle comment create, edit, delete API calls
    - Show edit/delete buttons for own comments
    - Implement @mention autocomplete
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.8_

  - [x] 24.9 Create CardAttachments component
    - Display list of attachments with icons
    - Show filename, size, uploader, date
    - Add file upload button with drag and drop
    - Handle file upload API call with progress
    - Add download and delete buttons
    - Show file size validation errors
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 24.10 Create CardActivity component
    - Display activity log in reverse chronological order
    - Format activity messages for readability
    - Show actor name and timestamp
    - Group activities by date
    - _Requirements: 14.8, 14.9_

  - [x] 24.11 Create CardWatchers component
    - Display list of watchers
    - Add watch/unwatch button for current user
    - Show watcher count
    - _Requirements: 12.1, 12.2, 12.3, 12.6_

- [ ] 25. Checkpoint - Ensure core frontend functionality works
  - Ensure all components render correctly, ask the user if questions arise.

- [x] 26. Drag and drop implementation
  - [x] 26.1 Set up drag and drop context
    - Install and configure react-beautiful-dnd or @dnd-kit
    - Create DragDropContext wrapper component
    - _Requirements: 4.4, 5.6, 5.7_

  - [x] 26.2 Implement list drag and drop
    - Make lists draggable
    - Handle list reorder API call on drop
    - Implement optimistic UI updates
    - Add rollback on API error
    - _Requirements: 4.4_

  - [x] 26.3 Implement card drag and drop
    - Make cards draggable within lists
    - Handle card reorder API call on drop within same list
    - Handle card move API call on drop to different list
    - Implement optimistic UI updates
    - Add rollback on API error
    - _Requirements: 5.6, 5.7_

- [x] 27. Notifications implementation
  - [x] 27.1 Create notifications page
    - Implement page to display user notifications
    - Fetch notifications from API
    - Display notification list with icons and messages
    - Add mark as read functionality
    - Add mark all as read button
    - _Requirements: 15.5, 15.6, 15.8_

  - [x] 27.2 Create NotificationList component
    - Display notifications in reverse chronological order
    - Show unread indicator
    - Format notification messages
    - Add click handler to navigate to related entity
    - _Requirements: 15.5, 15.8_

  - [x] 27.3 Create notification badge in navbar
    - Display unread notification count
    - Add dropdown with recent notifications
    - Link to full notifications page
    - Poll for new notifications or implement real-time updates
    - _Requirements: 15.5_

- [x] 28. Search and filter implementation
  - [x] 28.1 Create search bar component
    - Implement search input in board header
    - Add debounced search API call
    - Display search results in modal or overlay
    - Show matching cards with list names
    - Add click handler to open card detail
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 28.2 Create filter panel component
    - Implement filter sidebar or dropdown
    - Add assignee filter with member selector
    - Add label filter with multi-select
    - Add priority filter with dropdown
    - Add due date range filter with date pickers
    - Handle filter API call with combined criteria
    - Display filtered cards
    - Add clear filters button
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 29. Common components and navigation
  - [x] 29.1 Create Navbar component
    - Display app logo and name
    - Show current user info
    - Add notifications badge
    - Add logout button
    - Add navigation links
    - _Requirements: User experience_

  - [x] 29.2 Create Modal component
    - Implement reusable modal wrapper
    - Add backdrop click to close
    - Add escape key handler
    - Support different sizes
    - _Requirements: User experience_

  - [x] 29.3 Create DropdownMenu component
    - Implement reusable dropdown wrapper
    - Add click outside to close
    - Support different positions
    - _Requirements: User experience_

  - [x] 29.4 Create loading and error states
    - Implement loading spinner component
    - Create error message component
    - Add empty state components
    - _Requirements: User experience_

- [ ] 30. State management and caching
  - [x] 30.1 Set up React Query or SWR
    - Configure query client with cache settings
    - Create custom hooks for all API endpoints
    - Implement optimistic updates for mutations
    - Add automatic refetching on window focus
    - _Requirements: Frontend performance_

  - [ ] 30.2 Implement cache invalidation
    - Invalidate board queries on board updates
    - Invalidate list queries on list updates
    - Invalidate card queries on card updates
    - Invalidate notification queries on mark as read
    - _Requirements: Frontend data consistency_

- [ ] 31. Frontend testing setup
  - [ ] 31.1 Configure testing framework
    - Set up Jest and React Testing Library
    - Configure test environment
    - Add test scripts to package.json
    - _Requirements: Testing infrastructure_

  - [ ]* 31.2 Write component tests
    - Test authentication forms
    - Test board and list components
    - Test card components
    - Test drag and drop functionality
    - _Requirements: Frontend quality assurance_

- [ ] 32. Styling and responsive design
  - [ ] 32.1 Implement responsive layouts
    - Make board view responsive for mobile and tablet
    - Adjust card detail modal for small screens
    - Optimize navigation for mobile
    - _Requirements: User experience_

  - [ ] 32.2 Add visual polish
    - Implement consistent color scheme
    - Add hover and focus states
    - Add transitions and animations
    - Ensure accessibility (ARIA labels, keyboard navigation)
    - _Requirements: User experience, accessibility_

- [ ] 33. Final integration and testing
  - [ ] 33.1 End-to-end testing
    - Test complete user registration and login flow
    - Test board creation and member invitation
    - Test card creation, editing, and movement
    - Test comment and attachment functionality
    - Test notification delivery
    - Test search and filter functionality
    - _Requirements: System integration_

  - [ ] 33.2 Performance optimization
    - Optimize API response times with indexes
    - Implement pagination for large lists
    - Add lazy loading for images and attachments
    - Optimize bundle size
    - _Requirements: Performance_

  - [ ] 33.3 Security review
    - Verify JWT token security
    - Check authorization on all endpoints
    - Validate file upload security
    - Review CORS configuration
    - Test for common vulnerabilities
    - _Requirements: Security_

- [ ] 34. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: infrastructure → backend modules → frontend components → integration
- Checkpoints ensure incremental validation at key milestones
- All backend code uses TypeScript with NestJS framework
- All frontend code uses TypeScript with Next.js and React
- MongoDB is used for data persistence with Mongoose ODM
