# Technical Design Document

## Overview

This document provides the technical design for a Trello-like ticket management system built with NestJS, MongoDB, and Next.js. The system enables collaborative task management through boards, lists, and cards with role-based access control, real-time notifications, and comprehensive activity tracking.

### System Architecture

The application follows a three-tier architecture:

**Backend (NestJS):**
- RESTful API server with modular architecture
- JWT-based authentication with HTTP-only cookies
- MongoDB integration via Mongoose ODM
- Service-oriented business logic layer
- Guard-based authorization system
- Interceptors for logging and error handling

**Database (MongoDB):**
- Document-based storage for flexible schema evolution
- Collections: users, boards, lists, cards, comments, attachments, activities, notifications, labels
- Indexed fields for query optimization
- Embedded documents for related data (checklists, checklist items)

**Frontend (Next.js):**
- Server-side rendering for initial page loads
- React components for interactive UI
- API client for backend communication
- Context API for state management
- Drag-and-drop functionality for card/list reordering

### Technology Stack

- **Backend Framework:** NestJS 10.x
- **Database:** MongoDB 7.x with Mongoose 8.x
- **Authentication:** JWT with bcrypt for password hashing
- **Frontend Framework:** Next.js 14.x (React 18.x)
- **File Storage:** Local filesystem with configurable cloud storage adapter
- **Validation:** class-validator and class-transformer
- **API Documentation:** Swagger/OpenAPI


## Architecture

### Module Structure

The NestJS backend is organized into the following modules:

**AuthModule:**
- Handles user registration, login, and JWT token management
- Provides authentication guards and decorators
- Services: AuthService, JwtStrategy
- Controllers: AuthController

**UsersModule:**
- Manages user profiles and user-related operations
- Services: UsersService
- Controllers: UsersController

**BoardsModule:**
- Manages board creation, updates, and member management
- Handles role-based access control
- Services: BoardsService
- Controllers: BoardsController
- Guards: BoardMemberGuard, BoardRoleGuard

**ListsModule:**
- Manages list creation, updates, archiving, and reordering
- Services: ListsService
- Controllers: ListsController

**CardsModule:**
- Manages card CRUD operations, assignments, priorities, and archiving
- Services: CardsService
- Controllers: CardsController

**ChecklistsModule:**
- Manages checklists and checklist items within cards
- Services: ChecklistsService
- Controllers: ChecklistsController

**CommentsModule:**
- Manages comments on cards with mention parsing
- Services: CommentsService
- Controllers: CommentsController

**AttachmentsModule:**
- Handles file uploads, storage, and retrieval
- Services: AttachmentsService
- Controllers: AttachmentsController

**LabelsModule:**
- Manages label creation and assignment to cards
- Services: LabelsService
- Controllers: LabelsController

**ActivitiesModule:**
- Logs all system activities and provides activity retrieval
- Services: ActivitiesService
- Controllers: ActivitiesController

**NotificationsModule:**
- Creates and manages user notifications
- Services: NotificationsService
- Controllers: NotificationsController

**SearchModule:**
- Provides search and filtering capabilities
- Services: SearchService
- Controllers: SearchController

### Request Flow

1. Client sends HTTP request to NestJS API
2. JWT authentication guard validates token from HTTP-only cookie
3. Authorization guards verify user permissions for the requested resource
4. Validation pipes validate request DTOs
5. Controller routes request to appropriate service method
6. Service executes business logic and interacts with MongoDB via Mongoose
7. Activity logging interceptor records the action
8. Notification service creates notifications for relevant users
9. Response is formatted and returned to client
10. Error handling interceptor catches and formats any errors


## Components and Interfaces

### Authentication Components

**JwtAuthGuard:**
- Validates JWT token from HTTP-only cookie
- Attaches user object to request
- Returns 401 for invalid/missing tokens

**JwtStrategy:**
- Passport strategy for JWT validation
- Extracts token from cookie
- Validates token signature and expiration

**CurrentUser Decorator:**
- Custom parameter decorator to extract user from request
- Usage: `@CurrentUser() user: User`

**Public Decorator:**
- Marks endpoints as publicly accessible (no authentication required)
- Usage: `@Public()`

### Authorization Components

**BoardMemberGuard:**
- Verifies user is a member of the requested board
- Extracts boardId from request params
- Returns 403 if user is not a board member

**BoardRoleGuard:**
- Verifies user has required role on board
- Configurable via @RequireRole decorator
- Checks: Admin, Member, or Observer
- Returns 403 if user lacks required role

**RequireRole Decorator:**
- Specifies minimum role required for endpoint
- Usage: `@RequireRole('admin')` or `@RequireRole('member')`

**IsCommentAuthor Guard:**
- Verifies user is the author of a comment
- Used for comment edit/delete operations
- Returns 403 if user is not the author

### Validation Components

**ValidationPipe:**
- Global pipe for DTO validation
- Uses class-validator decorators
- Returns 400 with detailed error messages

**ParseObjectIdPipe:**
- Validates and transforms MongoDB ObjectId strings
- Returns 400 for invalid ObjectId format

### Logging Components

**ActivityLoggerInterceptor:**
- Intercepts requests to log activities
- Extracts user, action, and entity information
- Calls ActivitiesService to persist logs

**ErrorLoggingInterceptor:**
- Catches and logs all errors
- Formats error responses consistently
- Maps exceptions to appropriate HTTP status codes


## Data Models

### MongoDB Schemas

**User Schema:**
```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  password: string (hashed),
  name: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Board Schema:**
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  createdBy: ObjectId (ref: User),
  members: [{
    user: ObjectId (ref: User),
    role: enum ['admin', 'member', 'observer']
  }],
  archived: boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: members.user, archived

**List Schema:**
```typescript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, indexed),
  name: string,
  position: number,
  archived: boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: boardId, position

**Card Schema:**
```typescript
{
  _id: ObjectId,
  listId: ObjectId (ref: List, indexed),
  boardId: ObjectId (ref: Board, indexed),
  title: string,
  description: string,
  position: number,
  assignee: ObjectId (ref: User),
  dueDate: Date,
  priority: enum ['low', 'medium', 'high', 'critical'],
  labels: [ObjectId] (ref: Label),
  watchers: [ObjectId] (ref: User),
  archived: boolean (default: false),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: listId, boardId, assignee, archived, dueDate

**Checklist Schema (embedded in Card):**
```typescript
{
  _id: ObjectId,
  cardId: ObjectId (ref: Card, indexed),
  title: string,
  items: [{
    _id: ObjectId,
    text: string,
    completed: boolean (default: false),
    position: number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Comment Schema:**
```typescript
{
  _id: ObjectId,
  cardId: ObjectId (ref: Card, indexed),
  author: ObjectId (ref: User),
  content: string,
  mentions: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: cardId, createdAt

**Attachment Schema:**
```typescript
{
  _id: ObjectId,
  cardId: ObjectId (ref: Card, indexed),
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  path: string,
  uploadedBy: ObjectId (ref: User),
  createdAt: Date
}
```
Indexes: cardId

**Label Schema:**
```typescript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, indexed),
  name: string,
  color: string (hex color code),
  createdAt: Date,
  updatedAt: Date
}
```
Indexes: boardId

**Activity Schema:**
```typescript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, indexed),
  cardId: ObjectId (ref: Card, indexed, optional),
  actor: ObjectId (ref: User),
  actionType: enum [
    'board_created', 'board_updated', 'board_archived',
    'list_created', 'list_updated', 'list_archived',
    'card_created', 'card_updated', 'card_moved', 'card_archived',
    'comment_added', 'comment_deleted',
    'attachment_uploaded', 'attachment_deleted',
    'member_added', 'member_removed', 'member_role_changed'
  ],
  entityType: enum ['board', 'list', 'card', 'comment', 'attachment', 'member'],
  entityId: ObjectId,
  metadata: Mixed (action-specific data),
  createdAt: Date
}
```
Indexes: boardId, cardId, createdAt

**Notification Schema:**
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  type: enum ['mention', 'assignment', 'card_update', 'board_invitation'],
  actor: ObjectId (ref: User),
  entityType: enum ['card', 'comment', 'board'],
  entityId: ObjectId,
  read: boolean (default: false),
  createdAt: Date
}
```
Indexes: userId, read, createdAt


### Data Transfer Objects (DTOs)

**Authentication DTOs:**
```typescript
RegisterDto {
  email: string (email format, required)
  password: string (min 8 chars, required)
  name: string (required)
}

LoginDto {
  email: string (email format, required)
  password: string (required)
}
```

**Board DTOs:**
```typescript
CreateBoardDto {
  name: string (required, max 100 chars)
  description: string (optional, max 500 chars)
}

UpdateBoardDto {
  name: string (optional, max 100 chars)
  description: string (optional, max 500 chars)
}

InviteMemberDto {
  userId: string (ObjectId, required)
  role: enum ['admin', 'member', 'observer'] (required)
}

UpdateMemberRoleDto {
  role: enum ['admin', 'member', 'observer'] (required)
}
```

**List DTOs:**
```typescript
CreateListDto {
  name: string (required, max 100 chars)
  position: number (optional)
}

UpdateListDto {
  name: string (optional, max 100 chars)
}

ReorderListDto {
  position: number (required)
}
```

**Card DTOs:**
```typescript
CreateCardDto {
  title: string (required, max 200 chars)
  description: string (optional, max 2000 chars)
  position: number (optional)
}

UpdateCardDto {
  title: string (optional, max 200 chars)
  description: string (optional, max 2000 chars)
  assignee: string (ObjectId, optional, nullable)
  dueDate: Date (optional, nullable)
  priority: enum ['low', 'medium', 'high', 'critical'] (optional, nullable)
}

MoveCardDto {
  listId: string (ObjectId, required)
  position: number (required)
}

AddLabelDto {
  labelId: string (ObjectId, required)
}
```

**Checklist DTOs:**
```typescript
CreateChecklistDto {
  title: string (required, max 100 chars)
}

AddChecklistItemDto {
  text: string (required, max 200 chars)
  position: number (optional)
}

UpdateChecklistItemDto {
  text: string (optional, max 200 chars)
  completed: boolean (optional)
}
```

**Comment DTOs:**
```typescript
CreateCommentDto {
  content: string (required, max 1000 chars)
}

UpdateCommentDto {
  content: string (required, max 1000 chars)
}
```

**Label DTOs:**
```typescript
CreateLabelDto {
  name: string (required, max 50 chars)
  color: string (hex color, required)
}

UpdateLabelDto {
  name: string (optional, max 50 chars)
  color: string (hex color, optional)
}
```

**Search and Filter DTOs:**
```typescript
SearchCardsDto {
  query: string (required, min 1 char)
}

FilterCardsDto {
  assignee: string (ObjectId, optional)
  labels: string[] (ObjectId array, optional)
  priority: enum ['low', 'medium', 'high', 'critical'] (optional)
  dueDateFrom: Date (optional)
  dueDateTo: Date (optional)
}
```


### REST API Endpoints

**Authentication Endpoints:**

```
POST /api/auth/register
Body: RegisterDto
Response: 201 { user: UserResponse, message: string }
Description: Register a new user account

POST /api/auth/login
Body: LoginDto
Response: 200 { user: UserResponse, message: string }
Sets HTTP-only cookie with JWT token
Description: Authenticate user and create session

POST /api/auth/logout
Response: 200 { message: string }
Clears HTTP-only cookie
Description: End user session

GET /api/auth/me
Response: 200 { user: UserResponse }
Description: Get current authenticated user
```

**Board Endpoints:**

```
POST /api/boards
Body: CreateBoardDto
Response: 201 { board: BoardResponse }
Description: Create a new board with user as admin

GET /api/boards
Response: 200 { boards: BoardResponse[] }
Description: Get all boards where user is a member

GET /api/boards/:boardId
Response: 200 { board: BoardResponse }
Description: Get board details with lists and members

PATCH /api/boards/:boardId
Body: UpdateBoardDto
Response: 200 { board: BoardResponse }
Guards: Admin role required
Description: Update board name or description

DELETE /api/boards/:boardId/archive
Response: 200 { board: BoardResponse }
Guards: Admin role required
Description: Archive a board

POST /api/boards/:boardId/restore
Response: 200 { board: BoardResponse }
Guards: Admin role required
Description: Restore an archived board

POST /api/boards/:boardId/members
Body: InviteMemberDto
Response: 201 { board: BoardResponse }
Guards: Admin role required
Description: Invite a user to the board

PATCH /api/boards/:boardId/members/:userId
Body: UpdateMemberRoleDto
Response: 200 { board: BoardResponse }
Guards: Admin role required
Description: Update a member's role

DELETE /api/boards/:boardId/members/:userId
Response: 200 { board: BoardResponse }
Guards: Admin role required
Description: Remove a member from the board
```

**List Endpoints:**

```
POST /api/boards/:boardId/lists
Body: CreateListDto
Response: 201 { list: ListResponse }
Guards: Member role required
Description: Create a new list in the board

GET /api/boards/:boardId/lists
Response: 200 { lists: ListResponse[] }
Description: Get all lists in a board (ordered by position)

PATCH /api/lists/:listId
Body: UpdateListDto
Response: 200 { list: ListResponse }
Guards: Member role required
Description: Update list name

PATCH /api/lists/:listId/position
Body: ReorderListDto
Response: 200 { list: ListResponse }
Guards: Member role required
Description: Reorder list position

DELETE /api/lists/:listId/archive
Response: 200 { list: ListResponse }
Guards: Member role required
Description: Archive a list

POST /api/lists/:listId/restore
Response: 200 { list: ListResponse }
Guards: Member role required
Description: Restore an archived list
```

**Card Endpoints:**

```
POST /api/lists/:listId/cards
Body: CreateCardDto
Response: 201 { card: CardResponse }
Guards: Member role required
Description: Create a new card in the list

GET /api/lists/:listId/cards
Response: 200 { cards: CardResponse[] }
Description: Get all cards in a list (ordered by position)

GET /api/cards/:cardId
Response: 200 { card: CardResponse }
Description: Get detailed card information

PATCH /api/cards/:cardId
Body: UpdateCardDto
Response: 200 { card: CardResponse }
Guards: Member role required
Description: Update card properties

PATCH /api/cards/:cardId/move
Body: MoveCardDto
Response: 200 { card: CardResponse }
Guards: Member role required
Description: Move card to different list or position

DELETE /api/cards/:cardId/archive
Response: 200 { card: CardResponse }
Guards: Member role required
Description: Archive a card

POST /api/cards/:cardId/restore
Response: 200 { card: CardResponse }
Guards: Member role required
Description: Restore an archived card

POST /api/cards/:cardId/watchers
Response: 200 { card: CardResponse }
Description: Add current user as watcher

DELETE /api/cards/:cardId/watchers
Response: 200 { card: CardResponse }
Description: Remove current user as watcher

POST /api/cards/:cardId/labels
Body: AddLabelDto
Response: 200 { card: CardResponse }
Guards: Member role required
Description: Add a label to the card

DELETE /api/cards/:cardId/labels/:labelId
Response: 200 { card: CardResponse }
Guards: Member role required
Description: Remove a label from the card
```

**Checklist Endpoints:**

```
POST /api/cards/:cardId/checklists
Body: CreateChecklistDto
Response: 201 { checklist: ChecklistResponse }
Guards: Member role required
Description: Create a checklist on the card

POST /api/checklists/:checklistId/items
Body: AddChecklistItemDto
Response: 201 { checklist: ChecklistResponse }
Guards: Member role required
Description: Add an item to the checklist

PATCH /api/checklists/:checklistId/items/:itemId
Body: UpdateChecklistItemDto
Response: 200 { checklist: ChecklistResponse }
Guards: Member role required
Description: Update checklist item

DELETE /api/checklists/:checklistId/items/:itemId
Response: 200 { checklist: ChecklistResponse }
Guards: Member role required
Description: Delete checklist item

DELETE /api/checklists/:checklistId
Response: 200 { message: string }
Guards: Member role required
Description: Delete entire checklist
```

**Comment Endpoints:**

```
POST /api/cards/:cardId/comments
Body: CreateCommentDto
Response: 201 { comment: CommentResponse }
Description: Add a comment to the card

GET /api/cards/:cardId/comments
Response: 200 { comments: CommentResponse[] }
Description: Get all comments for a card (chronological order)

PATCH /api/comments/:commentId
Body: UpdateCommentDto
Response: 200 { comment: CommentResponse }
Guards: Comment author only
Description: Update own comment

DELETE /api/comments/:commentId
Response: 200 { message: string }
Guards: Comment author or board admin
Description: Delete a comment
```

**Attachment Endpoints:**

```
POST /api/cards/:cardId/attachments
Body: multipart/form-data with file
Response: 201 { attachment: AttachmentResponse }
Guards: Member role required
Description: Upload a file attachment to the card

GET /api/attachments/:attachmentId
Response: File download
Description: Download an attachment

DELETE /api/attachments/:attachmentId
Response: 200 { message: string }
Guards: Member role required
Description: Delete an attachment
```

**Label Endpoints:**

```
POST /api/boards/:boardId/labels
Body: CreateLabelDto
Response: 201 { label: LabelResponse }
Guards: Member role required
Description: Create a label for the board

GET /api/boards/:boardId/labels
Response: 200 { labels: LabelResponse[] }
Description: Get all labels for a board

PATCH /api/labels/:labelId
Body: UpdateLabelDto
Response: 200 { label: LabelResponse }
Guards: Admin role required
Description: Update label name or color

DELETE /api/labels/:labelId
Response: 200 { message: string }
Guards: Admin role required
Description: Delete a label (removes from all cards)
```

**Activity Endpoints:**

```
GET /api/boards/:boardId/activities
Response: 200 { activities: ActivityResponse[] }
Description: Get activity log for a board (reverse chronological)

GET /api/cards/:cardId/activities
Response: 200 { activities: ActivityResponse[] }
Description: Get activity log for a specific card (reverse chronological)
```

**Notification Endpoints:**

```
GET /api/notifications
Response: 200 { notifications: NotificationResponse[] }
Description: Get unread notifications for current user (reverse chronological)

PATCH /api/notifications/:notificationId/read
Response: 200 { notification: NotificationResponse }
Description: Mark a notification as read

PATCH /api/notifications/read-all
Response: 200 { message: string }
Description: Mark all notifications as read
```

**Search and Filter Endpoints:**

```
GET /api/boards/:boardId/search
Query: SearchCardsDto
Response: 200 { cards: CardResponse[] }
Description: Search cards by title or description

GET /api/boards/:boardId/cards/filter
Query: FilterCardsDto
Response: 200 { cards: CardResponse[] }
Description: Filter cards by multiple criteria
```


### Authentication & Authorization Design

**JWT Token Strategy:**

The system uses JWT tokens stored in HTTP-only cookies for secure authentication:

1. **Token Generation:**
   - Upon successful login/registration, generate JWT with payload: `{ userId, email }`
   - Set expiration to 7 days
   - Sign with secret key from environment variable
   - Store in HTTP-only cookie named `auth_token`

2. **Token Validation:**
   - JwtAuthGuard extracts token from cookie on each request
   - Validates signature and expiration
   - Decodes payload and attaches user object to request
   - Returns 401 if token is invalid or expired

3. **Cookie Configuration:**
   - HTTP-only: true (prevents XSS attacks)
   - Secure: true (HTTPS only in production)
   - SameSite: 'strict' (prevents CSRF attacks)
   - Path: '/'
   - MaxAge: 7 days

**Authorization Flow:**

1. **Board Membership Check:**
   - BoardMemberGuard queries Board collection
   - Verifies user ID exists in board.members array
   - Returns 403 if user is not a member

2. **Role-Based Access:**
   - BoardRoleGuard checks user's role on the board
   - Compares against required role from @RequireRole decorator
   - Role hierarchy: Admin > Member > Observer
   - Returns 403 if user lacks required role

3. **Resource Ownership:**
   - IsCommentAuthor guard verifies comment.author matches current user
   - Used for edit/delete operations on comments
   - Admins can bypass this check for delete operations

**Guard Application Order:**

```typescript
@UseGuards(JwtAuthGuard, BoardMemberGuard, BoardRoleGuard)
```

1. First: Authenticate user (JwtAuthGuard)
2. Second: Verify board membership (BoardMemberGuard)
3. Third: Verify role permissions (BoardRoleGuard)

**Permission Matrix:**

| Action | Admin | Member | Observer |
|--------|-------|--------|----------|
| View board/lists/cards | ✓ | ✓ | ✓ |
| Create/edit/delete lists | ✓ | ✓ | ✗ |
| Create/edit/delete cards | ✓ | ✓ | ✗ |
| Add comments | ✓ | ✓ | ✓ |
| Edit own comments | ✓ | ✓ | ✓ |
| Delete any comments | ✓ | ✗ | ✗ |
| Upload attachments | ✓ | ✓ | ✗ |
| Manage labels | ✓ | ✓ | ✗ |
| Update board settings | ✓ | ✗ | ✗ |
| Manage members | ✓ | ✗ | ✗ |
| Archive board | ✓ | ✗ | ✗ |


### Frontend Architecture

**Page Structure (Next.js):**

```
/pages
  /index.tsx                    # Landing page (public)
  /login.tsx                    # Login page (public)
  /register.tsx                 # Registration page (public)
  /dashboard.tsx                # User's boards list (protected)
  /boards/[boardId].tsx         # Board view with lists and cards (protected)
  /cards/[cardId].tsx           # Card detail modal/page (protected)
  /notifications.tsx            # Notifications page (protected)
```

**Component Structure:**

```
/components
  /auth
    LoginForm.tsx               # Login form with validation
    RegisterForm.tsx            # Registration form with validation
  /board
    BoardCard.tsx               # Board preview card for dashboard
    BoardHeader.tsx             # Board title, description, members
    BoardMemberList.tsx         # List of board members with roles
    InviteMemberModal.tsx       # Modal to invite new members
  /list
    List.tsx                    # List container with cards
    ListHeader.tsx              # List title and actions
    CreateListForm.tsx          # Form to create new list
  /card
    Card.tsx                    # Card preview in list
    CardDetail.tsx              # Full card detail view
    CardAssignment.tsx          # Assignee selector
    CardDueDate.tsx             # Due date picker
    CardPriority.tsx            # Priority selector
    CardLabels.tsx              # Label chips and selector
    CardChecklist.tsx           # Checklist with items
    CardComments.tsx            # Comments section
    CardAttachments.tsx         # Attachments list
    CardActivity.tsx            # Activity log for card
  /common
    Navbar.tsx                  # Top navigation bar
    Sidebar.tsx                 # Side navigation
    Modal.tsx                   # Reusable modal component
    DropdownMenu.tsx            # Reusable dropdown
    DragDropContext.tsx         # Drag and drop wrapper
  /notifications
    NotificationList.tsx        # List of notifications
    NotificationItem.tsx        # Single notification display
```

**State Management:**

- Use React Context API for global state (user, boards)
- Local component state for UI interactions
- SWR or React Query for server state caching and synchronization

**API Client:**

```typescript
// /lib/api.ts
class ApiClient {
  async get(url: string): Promise<any>
  async post(url: string, data: any): Promise<any>
  async patch(url: string, data: any): Promise<any>
  async delete(url: string): Promise<any>
  async upload(url: string, file: File): Promise<any>
}
```

- Axios-based HTTP client
- Automatic cookie handling (credentials: 'include')
- Error handling and response transformation
- Request/response interceptors for loading states

**Drag and Drop:**

- Use react-beautiful-dnd or @dnd-kit for drag and drop
- Support card reordering within lists
- Support card movement between lists
- Support list reordering
- Optimistic UI updates with rollback on error


### File Upload Strategy

**Storage Configuration:**

The system supports pluggable storage backends:

1. **Local Filesystem (Development):**
   - Store files in `/uploads` directory
   - Organize by date: `/uploads/YYYY/MM/DD/`
   - Generate unique filenames using UUID + original extension
   - Serve files via static file middleware

2. **Cloud Storage (Production):**
   - AWS S3, Google Cloud Storage, or Azure Blob Storage
   - Use storage adapter pattern for easy switching
   - Generate signed URLs for secure downloads
   - Configure bucket with appropriate CORS settings

**Upload Process:**

1. Client sends multipart/form-data request with file
2. Multer middleware intercepts and validates file
3. File validation checks:
   - Maximum size: 10MB (configurable)
   - Allowed MIME types: images, PDFs, documents
   - Filename sanitization
4. Storage adapter saves file and returns path/URL
5. AttachmentsService creates database record
6. Activity log records upload action
7. Watchers receive notification
8. Response includes attachment metadata

**File Metadata:**

```typescript
{
  _id: ObjectId,
  cardId: ObjectId,
  filename: string,           // Stored filename (UUID-based)
  originalName: string,       // User's original filename
  mimeType: string,           // File MIME type
  size: number,               // File size in bytes
  path: string,               // Storage path or URL
  uploadedBy: ObjectId,       // User who uploaded
  createdAt: Date
}
```

**Download Process:**

1. Client requests GET /api/attachments/:attachmentId
2. Authorization check: user must be board member
3. Retrieve attachment metadata from database
4. For local storage: stream file from filesystem
5. For cloud storage: redirect to signed URL or proxy stream
6. Set appropriate Content-Type and Content-Disposition headers

**Security Considerations:**

- Validate file types to prevent malicious uploads
- Scan files for viruses (optional, production)
- Generate unique filenames to prevent overwrites
- Restrict access to board members only
- Use signed URLs with expiration for cloud storage
- Implement rate limiting on upload endpoint


### Activity Logging Implementation

**Activity Logging Strategy:**

All state-changing operations are logged automatically using an interceptor pattern:

**ActivityLoggerInterceptor:**

```typescript
@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, params } = request;
    
    return next.handle().pipe(
      tap((response) => {
        // Determine action type from route and method
        const actionType = this.determineActionType(method, url);
        
        // Extract entity information
        const entityInfo = this.extractEntityInfo(params, body, response);
        
        // Log activity
        this.activitiesService.logActivity({
          boardId: entityInfo.boardId,
          cardId: entityInfo.cardId,
          actor: user._id,
          actionType,
          entityType: entityInfo.entityType,
          entityId: entityInfo.entityId,
          metadata: entityInfo.metadata
        });
      })
    );
  }
}
```

**Logged Actions:**

| Action Type | Trigger | Metadata |
|-------------|---------|----------|
| board_created | POST /api/boards | { boardName } |
| board_updated | PATCH /api/boards/:id | { changes } |
| board_archived | DELETE /api/boards/:id/archive | {} |
| list_created | POST /api/boards/:id/lists | { listName } |
| list_updated | PATCH /api/lists/:id | { changes } |
| list_archived | DELETE /api/lists/:id/archive | {} |
| card_created | POST /api/lists/:id/cards | { cardTitle, listName } |
| card_updated | PATCH /api/cards/:id | { changes } |
| card_moved | PATCH /api/cards/:id/move | { fromList, toList, position } |
| card_archived | DELETE /api/cards/:id/archive | {} |
| comment_added | POST /api/cards/:id/comments | { commentPreview } |
| comment_deleted | DELETE /api/comments/:id | {} |
| attachment_uploaded | POST /api/cards/:id/attachments | { filename } |
| attachment_deleted | DELETE /api/attachments/:id | { filename } |
| member_added | POST /api/boards/:id/members | { userName, role } |
| member_removed | DELETE /api/boards/:id/members/:userId | { userName } |
| member_role_changed | PATCH /api/boards/:id/members/:userId | { userName, oldRole, newRole } |

**Activity Retrieval:**

- Activities are retrieved in reverse chronological order (newest first)
- Board activities: all actions related to the board
- Card activities: filtered by cardId for card-specific history
- Pagination support for large activity logs
- Activities include populated actor information (name, email)

**Activity Display Format:**

```typescript
{
  _id: "...",
  actor: {
    _id: "...",
    name: "John Doe",
    email: "john@example.com"
  },
  actionType: "card_moved",
  entityType: "card",
  entityId: "...",
  metadata: {
    fromList: "To-Do",
    toList: "In Progress",
    position: 2
  },
  createdAt: "2024-01-15T10:30:00Z"
}
```

**Frontend Display:**

Activities are rendered as human-readable messages:
- "John Doe created card 'Fix login bug' in To-Do"
- "Jane Smith moved card 'Update docs' from In Progress to Completed"
- "Bob Johnson added Alice Williams to the board as Member"


### Notification System Design

**Notification Triggers:**

The NotificationsService creates notifications based on specific events:

1. **Mention in Comment:**
   - Trigger: Comment created with @username
   - Recipients: All mentioned users
   - Type: 'mention'
   - Entity: Comment

2. **Card Assignment:**
   - Trigger: Card assignee updated
   - Recipients: New assignee
   - Type: 'assignment'
   - Entity: Card

3. **Card Update (for Watchers):**
   - Trigger: Card title, description, due date, or priority changed
   - Recipients: All watchers (excluding the actor)
   - Type: 'card_update'
   - Entity: Card

4. **Board Invitation:**
   - Trigger: User added to board
   - Recipients: Invited user
   - Type: 'board_invitation'
   - Entity: Board

**Notification Creation Flow:**

```typescript
// In CommentsService.create()
async createComment(cardId: string, userId: string, content: string) {
  // Parse mentions from content
  const mentions = this.parseMentions(content);
  
  // Create comment
  const comment = await this.commentModel.create({
    cardId,
    author: userId,
    content,
    mentions
  });
  
  // Create notifications for mentioned users
  for (const mentionedUserId of mentions) {
    await this.notificationsService.create({
      userId: mentionedUserId,
      type: 'mention',
      actor: userId,
      entityType: 'comment',
      entityId: comment._id
    });
  }
  
  return comment;
}
```

**Mention Parsing:**

```typescript
parseMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.matchAll(mentionRegex);
  const usernames = Array.from(matches, m => m[1]);
  
  // Look up user IDs from usernames
  return this.usersService.findIdsByUsernames(usernames);
}
```

**Notification Retrieval:**

- GET /api/notifications returns unread notifications only
- Sorted by createdAt descending (newest first)
- Includes populated actor and entity information
- Frontend polls this endpoint or uses WebSocket for real-time updates

**Notification Response Format:**

```typescript
{
  _id: "...",
  type: "mention",
  actor: {
    _id: "...",
    name: "John Doe"
  },
  entityType: "comment",
  entityId: "...",
  entityDetails: {
    cardTitle: "Fix login bug",
    commentPreview: "Hey @jane, can you review this?"
  },
  read: false,
  createdAt: "2024-01-15T10:30:00Z"
}
```

**Mark as Read:**

- PATCH /api/notifications/:id/read marks single notification
- PATCH /api/notifications/read-all marks all user's notifications
- Frontend updates notification badge count

**Real-time Updates (Optional Enhancement):**

- Implement WebSocket connection for instant notifications
- Use Socket.io or native WebSockets
- Emit notification events to connected clients
- Client subscribes to user-specific notification channel


### Search and Filtering Implementation

**Search Implementation:**

The search functionality uses MongoDB text search with case-insensitive matching:

```typescript
// SearchService.searchCards()
async searchCards(boardId: string, query: string): Promise<Card[]> {
  return this.cardModel.find({
    boardId,
    archived: false,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  })
  .populate('listId', 'name')
  .populate('assignee', 'name email')
  .populate('labels')
  .sort({ updatedAt: -1 })
  .exec();
}
```

**Search Features:**

- Case-insensitive matching
- Searches both title and description fields
- Excludes archived cards by default
- Returns results with populated list name
- Sorted by most recently updated
- Minimum query length: 1 character

**Filter Implementation:**

The filter functionality supports multiple criteria with AND logic:

```typescript
// SearchService.filterCards()
async filterCards(boardId: string, filters: FilterCardsDto): Promise<Card[]> {
  const query: any = {
    boardId,
    archived: false
  };
  
  // Filter by assignee
  if (filters.assignee) {
    query.assignee = filters.assignee;
  }
  
  // Filter by labels (cards must have ALL specified labels)
  if (filters.labels && filters.labels.length > 0) {
    query.labels = { $all: filters.labels };
  }
  
  // Filter by priority
  if (filters.priority) {
    query.priority = filters.priority;
  }
  
  // Filter by due date range
  if (filters.dueDateFrom || filters.dueDateTo) {
    query.dueDate = {};
    if (filters.dueDateFrom) {
      query.dueDate.$gte = filters.dueDateFrom;
    }
    if (filters.dueDateTo) {
      query.dueDate.$lte = filters.dueDateTo;
    }
  }
  
  return this.cardModel.find(query)
    .populate('listId', 'name')
    .populate('assignee', 'name email')
    .populate('labels')
    .sort({ position: 1 })
    .exec();
}
```

**Filter Criteria:**

1. **Assignee Filter:**
   - Match cards assigned to specific user
   - Pass userId as query parameter

2. **Label Filter:**
   - Match cards with ALL specified labels (AND logic)
   - Pass array of labelIds as query parameter
   - Example: `?labels=id1&labels=id2`

3. **Priority Filter:**
   - Match cards with specific priority level
   - Values: 'low', 'medium', 'high', 'critical'

4. **Due Date Range Filter:**
   - Match cards with due dates within range
   - dueDateFrom: minimum date (inclusive)
   - dueDateTo: maximum date (inclusive)
   - Can specify one or both bounds

**Combined Filters:**

All filter criteria are combined with AND logic:
- Example: Cards assigned to User A AND labeled "Bug" AND priority "High"

**Frontend Filter UI:**

```typescript
// Filter component state
const [filters, setFilters] = useState({
  assignee: null,
  labels: [],
  priority: null,
  dueDateFrom: null,
  dueDateTo: null
});

// Apply filters
const applyFilters = async () => {
  const params = new URLSearchParams();
  if (filters.assignee) params.append('assignee', filters.assignee);
  filters.labels.forEach(l => params.append('labels', l));
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
  if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
  
  const results = await api.get(`/api/boards/${boardId}/cards/filter?${params}`);
  setFilteredCards(results.cards);
};
```

**Performance Optimization:**

- Create compound indexes for common filter combinations
- Index: `{ boardId: 1, assignee: 1, archived: 1 }`
- Index: `{ boardId: 1, priority: 1, archived: 1 }`
- Index: `{ boardId: 1, dueDate: 1, archived: 1 }`
- Consider pagination for large result sets


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified and consolidated:

- Multiple criteria about "storing metadata" (creation date, creator, author, timestamp) were combined into single properties per entity type
- Permission checks for Member and Admin roles were consolidated where they share the same permissions
- Archive/restore operations were combined into round-trip properties
- Multiple notification creation triggers were kept separate as they represent distinct event types
- Activity logging for different entity types were kept separate for clarity
- Error handling properties for different HTTP status codes were kept separate as they test distinct error conditions

### Authentication Properties

### Property 1: Valid Registration Creates Account

For any valid email and password (8+ characters), registering should create a new user account with hashed password stored in the database.

**Validates: Requirements 1.2, 1.4**

### Property 2: Duplicate Email Registration Rejected

For any email that already exists in the system, attempting to register with that email should return an error and not create a duplicate account.

**Validates: Requirements 1.3**

### Property 3: Valid Login Generates JWT

For any valid email and password combination, signing in should generate a JWT token and store it in an HTTP-only cookie.

**Validates: Requirements 1.6, 1.7**

### Property 4: Invalid Credentials Rejected

For any invalid email/password combination (wrong password, non-existent email), attempting to sign in should return an authentication error.

**Validates: Requirements 1.8**

### Property 5: Protected Endpoints Validate Tokens

For any protected endpoint, requests without a valid JWT token should return a 401 authentication error.

**Validates: Requirements 1.9**

### Property 6: Expired Tokens Rejected

For any expired JWT token, attempting to access protected endpoints should return a 401 authentication error requiring re-authentication.

**Validates: Requirements 1.10**

### Board Management Properties

### Property 7: Board Creator Assigned as Admin

For any board creation request, the system should create the board with the requesting user assigned as an admin role.

**Validates: Requirements 2.1, 3.2**

### Property 8: Unique Board Identifiers

For any two boards created in the system, they should have different unique identifiers.

**Validates: Requirements 2.2**

### Property 9: Default Lists Created

For any board creation, the system should initialize the board with exactly three lists named "To-Do", "In Progress", and "Completed".

**Validates: Requirements 2.3**

### Property 10: Admin Can Update Board Settings

For any board and any user with admin role on that board, the user should be able to update the board's name and description.

**Validates: Requirements 2.4**

### Property 11: User Boards Retrieval

For any user, requesting their boards should return all and only boards where the user has any role (admin, member, or observer).

**Validates: Requirements 2.5**

### Property 12: Board Metadata Stored

For any board, the system should store and return creation date and creator information.

**Validates: Requirements 2.6**

### Property 13: Board Archive and Restore Round Trip

For any board, archiving it should mark it as archived and hide it from default views, and then restoring it should return it to its original unarchived state.

**Validates: Requirements 2.7, 2.8**

### Role-Based Access Control Properties

### Property 14: Admin Can Invite Users

For any board and any user with admin role, the admin should be able to invite other users to the board with a specified role.

**Validates: Requirements 3.3, 3.4**

### Property 15: Admin Can Modify Member Roles

For any board and any user with admin role, the admin should be able to change the roles of existing board members.

**Validates: Requirements 3.5**

### Property 16: Admin Can Remove Members

For any board and any user with admin role, the admin should be able to remove users from the board.

**Validates: Requirements 3.6**

### Property 17: Non-Admins Cannot Modify Board Settings

For any board and any user with member or observer role, attempting to modify board settings should return a 403 authorization error.

**Validates: Requirements 3.7, 19.4**

### Property 18: Observers Cannot Modify Lists or Cards

For any board and any user with observer role, attempting to create, edit, or delete lists or cards should return a 403 authorization error.

**Validates: Requirements 3.8, 19.3**

### Property 19: Members Can Modify Lists and Cards

For any board and any user with member role, the user should be able to create, edit, and delete lists and cards.

**Validates: Requirements 3.9**

### Property 20: All Roles Can View Content

For any board and any user with any role (admin, member, observer), the user should be able to view board content including lists and cards.

**Validates: Requirements 3.10**

### List Management Properties

### Property 21: List Creation Adds to Board

For any board and any user with member or admin role, creating a list should add it to the board with a unique identifier.

**Validates: Requirements 4.1, 4.2**

### Property 22: List Position Order Maintained

For any board, lists should maintain their position order, and reordering lists should persist the new order correctly.

**Validates: Requirements 4.3, 4.4**

### Property 23: Members Can Rename Lists

For any list and any user with member or admin role on the board, the user should be able to rename the list.

**Validates: Requirements 4.5**

### Property 24: List Archive and Restore Round Trip

For any list, archiving it should mark it as archived and hide it from default views, and restoring it should return it to its original unarchived state with all cards maintained.

**Validates: Requirements 4.6, 4.7, 4.8**

### Property 25: Lists Returned in Position Order

For any board, retrieving lists should return them sorted by their position field in ascending order.

**Validates: Requirements 4.9**

### Card Management Properties

### Property 26: Card Creation Adds to List

For any list and any user with member or admin role, creating a card should add it to the specified list with a unique identifier.

**Validates: Requirements 5.1, 5.2**

### Property 27: Card Title Required

For any card creation or update request without a title, the system should return a 400 validation error.

**Validates: Requirements 5.3**

### Property 28: Card Position Order Maintained

For any list, cards should maintain their position order, and reordering cards within a list should persist the new order correctly.

**Validates: Requirements 5.5, 5.6**

### Property 29: Card Movement Updates List and Position

For any card, moving it to a different list should update the card's listId and position, and the card should appear in the new list at the specified position.

**Validates: Requirements 5.7**

### Property 30: Members Can Update Cards

For any card and any user with member or admin role, the user should be able to update the card's title and description.

**Validates: Requirements 5.8**

### Property 31: Card Metadata Stored

For any card, the system should store and return creation date and creator information.

**Validates: Requirements 5.9**

### Property 32: Cards Returned in Position Order

For any list, retrieving cards should return them sorted by their position field in ascending order.

**Validates: Requirements 5.10**

### Card Assignment and Due Date Properties

### Property 33: Card Assignment to Board Members

For any card and any user with member or admin role, the user should be able to assign the card to any board member, with only one assignee allowed per card.

**Validates: Requirements 6.1, 6.2**

### Property 34: Assignee Can Be Changed or Removed

For any card with an assignee, users with member or admin role should be able to change the assignee to a different user or remove the assignee entirely.

**Validates: Requirements 6.3, 6.4**

### Property 35: Due Date Management

For any card and any user with member or admin role, the user should be able to set, update, or remove a due date with date and time precision, and the due date should be included in card responses when present.

**Validates: Requirements 6.5, 6.6, 6.7, 6.8**

### Label Properties

### Property 36: Label Creation and Application

For any board and any user with member or admin role, the user should be able to create labels with name and color, and apply multiple labels to any card.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 37: Label Removal from Cards

For any card with labels and any user with member or admin role, the user should be able to remove labels from the card.

**Validates: Requirements 7.4**

### Property 38: Labels Are Board-Specific

For any board, the system should maintain a list of labels specific to that board, and labels should not be shared across boards.

**Validates: Requirements 7.5**

### Property 39: Admin Can Edit Labels

For any label and any user with admin role on the board, the admin should be able to edit the label's name and color.

**Validates: Requirements 7.6**

### Property 40: Label Deletion Cascades

For any label, when an admin deletes it from the board, the system should remove it from all cards that had that label applied.

**Validates: Requirements 7.7, 7.8**

### Priority Properties

### Property 41: Priority Management

For any card and any user with member or admin role, the user should be able to set, change, or remove a priority level (low, medium, high, critical), and the priority should be included in card responses when present.

**Validates: Requirements 8.2, 8.3, 8.4, 8.5**

### Checklist Properties

### Property 42: Checklist Creation

For any card and any user with member or admin role, the user should be able to add multiple checklists to the card, with each checklist requiring a title.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 43: Checklist Item Management

For any checklist and any user with member or admin role, the user should be able to add items, mark items as complete or incomplete, reorder items, and delete items.

**Validates: Requirements 9.4, 9.5, 9.6, 9.7**

### Property 44: Checklist Deletion

For any checklist and any user with member or admin role, the user should be able to delete the entire checklist.

**Validates: Requirements 9.8**

### Property 45: Checklist Completion Percentage

For any checklist, the system should calculate and return the completion percentage as (completed items / total items) * 100.

**Validates: Requirements 9.9**

### Comment Properties

### Property 46: All Members Can Comment

For any card and any board member (any role), the member should be able to add comments to the card.

**Validates: Requirements 10.1**

### Property 47: Comment Metadata Stored

For any comment, the system should store and return the author and timestamp information.

**Validates: Requirements 10.2**

### Property 48: Comment Author Can Edit

For any comment, the author should be able to edit their own comment content.

**Validates: Requirements 10.3**

### Property 49: Comment Deletion Authorization

For any comment, only the comment author or board admins should be able to delete it; other users should receive a 403 authorization error.

**Validates: Requirements 10.4, 19.6**

### Property 50: Mention Parsing

For any comment containing @username syntax, the system should parse and identify the mentioned users, storing them in the mentions field.

**Validates: Requirements 10.5, 10.6**

### Property 51: Mention Notifications

For any comment containing mentions, the system should create a notification for each mentioned user.

**Validates: Requirements 10.7, 15.1**

### Property 52: Comments Returned Chronologically

For any card, retrieving comments should return them sorted by creation timestamp in ascending order (oldest first).

**Validates: Requirements 10.8**

### Attachment Properties

### Property 53: File Upload Authorization

For any card and any user with member or admin role, the user should be able to upload multiple files to the card.

**Validates: Requirements 11.1, 11.3**

### Property 54: Attachment Metadata Stored

For any attachment, the system should store and return filename, size, upload date, and uploader information.

**Validates: Requirements 11.2, 11.7**

### Property 55: Attachment Deletion Authorization

For any attachment and any user with member or admin role, the user should be able to delete the attachment.

**Validates: Requirements 11.4**

### Property 56: File Size Validation

For any file upload exceeding the maximum size limit (10MB), the system should return a 400 validation error.

**Validates: Requirements 11.6**

### Watcher Properties

### Property 57: Self-Watching Management

For any card and any board member, the member should be able to add themselves as a watcher or remove themselves as a watcher, with multiple watchers allowed per card.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 58: Watcher Notifications

For any card with watchers, when the card is updated (title, description, due date, or priority changed), the system should create notifications for all watchers except the user who made the update.

**Validates: Requirements 12.4, 15.3**

### Property 59: Assignee Auto-Watch

For any card, when a user is assigned to the card, the system should automatically add that user to the watchers list.

**Validates: Requirements 12.5**

### Property 60: Watchers Included in Response

For any card, the card response should include the list of watchers.

**Validates: Requirements 12.6**

### Card Archiving Properties

### Property 61: Card Archive Authorization

For any card and any user with member or admin role, the user should be able to archive the card.

**Validates: Requirements 13.1**

### Property 62: Card Archive and Restore Round Trip

For any card, archiving it should mark it as archived and hide it from default views, and restoring it should return the card to its original list with all card data maintained.

**Validates: Requirements 13.2, 13.3, 13.4, 13.5**

### Activity Logging Properties

### Property 63: Board Operations Logged

For any board creation, the system should create an activity log entry with actor, action type, timestamp, and entity information.

**Validates: Requirements 14.1**

### Property 64: List Operations Logged

For any list creation, update, or archive operation, the system should create an activity log entry with actor, action type, timestamp, and entity information.

**Validates: Requirements 14.2**

### Property 65: Card Operations Logged

For any card creation, update, move, or archive operation, the system should create an activity log entry with actor, action type, timestamp, and entity information.

**Validates: Requirements 14.3**

### Property 66: Comment Operations Logged

For any comment addition or deletion, the system should create an activity log entry with actor, action type, timestamp, and entity information.

**Validates: Requirements 14.4**

### Property 67: Member Operations Logged

For any user addition to or removal from a board, the system should create an activity log entry with actor, action type, timestamp, and entity information.

**Validates: Requirements 14.5**

### Property 68: Attachment Operations Logged

For any attachment upload or deletion, the system should create an activity log entry with actor, action type, timestamp, and entity information.

**Validates: Requirements 14.6**

### Property 69: Activity Log Metadata Complete

For any activity log entry, the system should store actor, action type, timestamp, and affected entity information.

**Validates: Requirements 14.7**

### Property 70: Activities Returned in Reverse Chronological Order

For any board or card, retrieving activity logs should return them sorted by timestamp in descending order (newest first).

**Validates: Requirements 14.9**

### Notification Properties

### Property 71: Assignment Notifications

For any card assignment, the system should create a notification for the assigned user.

**Validates: Requirements 15.2**

### Property 72: Board Invitation Notifications

For any user invited to a board, the system should create a notification for that user.

**Validates: Requirements 15.4**

### Property 73: Notification Mark as Read

For any notification, the user should be able to mark it as read, changing the read status from false to true.

**Validates: Requirements 15.6**

### Property 74: Notification Metadata Complete

For any notification, the system should store notification type, related entity, actor, and timestamp information.

**Validates: Requirements 15.7**

### Property 75: Notifications Returned in Reverse Chronological Order

For any user, retrieving notifications should return them sorted by timestamp in descending order (newest first).

**Validates: Requirements 15.8**

### Search and Filter Properties

### Property 76: Search Matches Title or Description

For any search query within a board, the system should return all non-archived cards where the query matches any part of the title or description (case-insensitive).

**Validates: Requirements 16.2, 16.3**

### Property 77: Search Results Include List Name

For any search results, each card should include the list name in the response.

**Validates: Requirements 16.4**

### Property 78: Search Excludes Archived Cards

For any search query, the results should not include any cards marked as archived.

**Validates: Requirements 16.5**

### Property 79: Filter by Assignee

For any assignee filter, the system should return all non-archived cards assigned to that specific user.

**Validates: Requirements 17.1**

### Property 80: Filter by Labels

For any label filter with one or more labels, the system should return all non-archived cards that have ALL specified labels applied.

**Validates: Requirements 17.2**

### Property 81: Filter by Priority

For any priority filter, the system should return all non-archived cards with that specific priority level.

**Validates: Requirements 17.3**

### Property 82: Filter by Due Date Range

For any due date range filter (from and/or to dates), the system should return all non-archived cards with due dates within that range (inclusive).

**Validates: Requirements 17.4**

### Property 83: Combined Filters Use AND Logic

For any combination of filter criteria (assignee, labels, priority, due date), the system should return only cards that match ALL specified criteria.

**Validates: Requirements 17.5**

### Property 84: Filter Results Include Full Card Details

For any filter results, each card should include complete card information including assignee, labels, priority, and due date.

**Validates: Requirements 17.6**

### Property 85: Filters Exclude Archived Cards

For any filter query, the results should not include any cards marked as archived.

**Validates: Requirements 17.7**

### Validation Properties

### Property 86: Missing Required Fields Rejected

For any API request missing required fields, the system should return a 400 validation error with a descriptive message.

**Validates: Requirements 18.1, 18.7**

### Property 87: Invalid Data Types Rejected

For any API request with invalid data types for fields, the system should return a 400 validation error with a descriptive message.

**Validates: Requirements 18.2, 18.7**

### Property 88: Invalid Email Format Rejected

For any registration or login request with an invalid email format, the system should return a 400 validation error.

**Validates: Requirements 18.3**

### Property 89: Short Passwords Rejected

For any registration request with a password shorter than 8 characters, the system should return a 400 validation error.

**Validates: Requirements 18.4**

### Property 90: Invalid Entity IDs Rejected

For any API request with invalid entity identifiers (non-existent IDs), the system should return a 404 not found error.

**Validates: Requirements 18.5**

### Property 91: Referential Integrity Validated

For any operation creating relationships (e.g., assigning card to user, adding label to card), the system should validate that referenced entities exist and return a 404 error if they don't.

**Validates: Requirements 18.6**

### Authorization Properties

### Property 92: Unauthenticated Requests Rejected

For any protected endpoint, requests without a valid JWT token should return a 401 authentication error.

**Validates: Requirements 19.1**

### Property 93: Non-Members Cannot Access Board

For any board and any authenticated user who is not a member of that board, attempting to access board resources should return a 403 authorization error.

**Validates: Requirements 19.2**

### Property 94: Non-Admins Cannot Change Roles

For any board and any user without admin role, attempting to change user roles should return a 403 authorization error.

**Validates: Requirements 19.5**

### Error Handling Properties

### Property 95: Appropriate HTTP Status Codes

For any error condition, the API should return the appropriate HTTP status code: 400 for validation errors, 401 for authentication errors, 403 for authorization errors, 404 for not found errors, and 500 for server errors.

**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6**

### Property 96: Consistent Error Response Format

For any error response, the API should return a JSON object with a consistent structure containing a message field and an error code field.

**Validates: Requirements 20.7**

### Property 97: Server Errors Logged

For any server error (500 status code), the system should log the error with sufficient detail for debugging purposes.

**Validates: Requirements 20.8**


## Error Handling

### Error Response Format

All API errors follow a consistent JSON structure:

```typescript
{
  statusCode: number,
  message: string | string[],
  error: string,
  timestamp: string,
  path: string
}
```

Example error responses:

```json
// Validation Error (400)
{
  "statusCode": 400,
  "message": ["email must be a valid email", "password must be at least 8 characters"],
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/register"
}

// Authentication Error (401)
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/login"
}

// Authorization Error (403)
{
  "statusCode": 403,
  "message": "You do not have permission to perform this action",
  "error": "Forbidden",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/boards/123/settings"
}

// Not Found Error (404)
{
  "statusCode": 404,
  "message": "Board not found",
  "error": "Not Found",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/boards/123"
}

// Server Error (500)
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/cards/123"
}
```

### Exception Handling Strategy

**Global Exception Filter:**

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    let status = 500;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message;
      error = exception.name;
    }
    
    // Log server errors
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception
      );
    }
    
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}
```

### Custom Exceptions

**Domain-Specific Exceptions:**

```typescript
// Authentication exceptions
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid credentials');
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super('Token has expired');
  }
}

// Authorization exceptions
export class NotBoardMemberException extends ForbiddenException {
  constructor() {
    super('You are not a member of this board');
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(action: string) {
    super(`You do not have permission to ${action}`);
  }
}

// Resource exceptions
export class BoardNotFoundException extends NotFoundException {
  constructor(boardId: string) {
    super(`Board with ID ${boardId} not found`);
  }
}

export class CardNotFoundException extends NotFoundException {
  constructor(cardId: string) {
    super(`Card with ID ${cardId} not found`);
  }
}

// Validation exceptions
export class DuplicateEmailException extends BadRequestException {
  constructor() {
    super('Email already exists');
  }
}

export class InvalidFileTypeException extends BadRequestException {
  constructor(allowedTypes: string[]) {
    super(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
}

export class FileSizeExceededException extends BadRequestException {
  constructor(maxSize: number) {
    super(`File size exceeds maximum allowed size of ${maxSize} bytes`);
  }
}
```

### Error Handling by Layer

**Controller Layer:**
- Validates request DTOs using ValidationPipe
- Catches service exceptions and lets them propagate
- Returns appropriate HTTP responses

**Service Layer:**
- Throws domain-specific exceptions for business logic errors
- Validates business rules (e.g., user permissions, entity existence)
- Handles database errors and transforms them to domain exceptions

**Repository Layer:**
- Catches MongoDB errors
- Throws appropriate exceptions for database issues
- Handles connection errors and timeouts

### Validation Error Handling

**Class-Validator Integration:**

```typescript
// Global validation pipe configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
    transform: true,            // Transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true
    },
    exceptionFactory: (errors) => {
      const messages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      return new BadRequestException(messages);
    }
  })
);
```

### Database Error Handling

**MongoDB Error Mapping:**

```typescript
// In service methods
try {
  const board = await this.boardModel.findById(boardId);
  if (!board) {
    throw new BoardNotFoundException(boardId);
  }
  return board;
} catch (error) {
  if (error instanceof NotFoundException) {
    throw error;
  }
  if (error.name === 'CastError') {
    throw new BadRequestException('Invalid ID format');
  }
  if (error.code === 11000) {
    throw new BadRequestException('Duplicate key error');
  }
  throw new InternalServerErrorException('Database error');
}
```

### Logging Strategy

**Winston Logger Configuration:**

```typescript
// Log levels: error, warn, info, debug
// Production: error, warn, info
// Development: all levels

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
```

**What to Log:**
- All server errors (500) with full stack traces
- Authentication failures (for security monitoring)
- Authorization failures (for security monitoring)
- Database connection issues
- File upload errors
- External API failures (if any)

**What NOT to Log:**
- Passwords or sensitive credentials
- JWT tokens
- Full request bodies containing PII
- Credit card or payment information


## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests:**
- Verify specific examples and edge cases
- Test integration points between components
- Validate error conditions and boundary cases
- Test specific user scenarios and workflows
- Mock external dependencies

**Property-Based Tests:**
- Verify universal properties across all inputs
- Generate random test data for comprehensive coverage
- Test invariants and round-trip properties
- Validate business rules across input space
- Each test runs minimum 100 iterations

Both approaches are complementary: unit tests catch concrete bugs and validate specific scenarios, while property tests verify general correctness across the entire input space.

### Property-Based Testing Configuration

**Framework Selection:**
- **JavaScript/TypeScript:** fast-check library
- Minimum 100 iterations per property test
- Configurable seed for reproducible failures
- Shrinking support for minimal failing examples

**Test Tagging Convention:**

Each property-based test must include a comment tag referencing the design document property:

```typescript
// Feature: trello-ticket-system, Property 1: Valid Registration Creates Account
it('should create account for any valid credentials', () => {
  fc.assert(
    fc.property(
      fc.emailAddress(),
      fc.string({ minLength: 8 }),
      async (email, password) => {
        const result = await authService.register(email, password);
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(email);
        const storedUser = await userModel.findOne({ email });
        expect(storedUser.password).not.toBe(password); // Hashed
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

**Backend Tests (NestJS):**

```
/test
  /unit
    /auth
      auth.service.spec.ts
      jwt.strategy.spec.ts
    /boards
      boards.service.spec.ts
      boards.controller.spec.ts
    /cards
      cards.service.spec.ts
      cards.controller.spec.ts
    /guards
      board-member.guard.spec.ts
      board-role.guard.spec.ts
  /property
    /auth
      auth.properties.spec.ts
    /boards
      boards.properties.spec.ts
    /cards
      cards.properties.spec.ts
    /permissions
      permissions.properties.spec.ts
  /integration
    /api
      auth.e2e.spec.ts
      boards.e2e.spec.ts
      cards.e2e.spec.ts
  /fixtures
    test-data.ts
    generators.ts
```

**Frontend Tests (Next.js):**

```
/tests
  /components
    /board
      BoardCard.test.tsx
      BoardHeader.test.tsx
    /card
      Card.test.tsx
      CardDetail.test.tsx
  /pages
    dashboard.test.tsx
    board.test.tsx
  /integration
    board-workflow.test.tsx
    card-workflow.test.tsx
```

### Unit Testing Strategy

**Service Layer Tests:**

Focus on business logic and data transformations:

```typescript
describe('BoardsService', () => {
  describe('createBoard', () => {
    it('should create board with user as admin', async () => {
      const userId = new Types.ObjectId();
      const dto = { name: 'Test Board', description: 'Test' };
      
      const board = await service.createBoard(userId, dto);
      
      expect(board.name).toBe(dto.name);
      expect(board.members).toHaveLength(1);
      expect(board.members[0].user.toString()).toBe(userId.toString());
      expect(board.members[0].role).toBe('admin');
    });
    
    it('should create default lists', async () => {
      const userId = new Types.ObjectId();
      const dto = { name: 'Test Board' };
      
      const board = await service.createBoard(userId, dto);
      const lists = await listModel.find({ boardId: board._id });
      
      expect(lists).toHaveLength(3);
      expect(lists.map(l => l.name)).toEqual(['To-Do', 'In Progress', 'Completed']);
    });
  });
  
  describe('archiveBoard', () => {
    it('should mark board as archived', async () => {
      const board = await createTestBoard();
      
      const archived = await service.archiveBoard(board._id);
      
      expect(archived.archived).toBe(true);
    });
    
    it('should throw error if user is not admin', async () => {
      const board = await createTestBoard();
      const memberId = new Types.ObjectId();
      
      await expect(
        service.archiveBoard(board._id, memberId)
      ).rejects.toThrow(InsufficientPermissionsException);
    });
  });
});
```

**Controller Layer Tests:**

Focus on request/response handling and guard integration:

```typescript
describe('BoardsController', () => {
  describe('POST /boards', () => {
    it('should create board and return 201', async () => {
      const dto = { name: 'Test Board', description: 'Test' };
      const user = { _id: new Types.ObjectId() };
      
      const result = await controller.createBoard(dto, user);
      
      expect(result.board).toBeDefined();
      expect(result.board.name).toBe(dto.name);
    });
    
    it('should return 400 for invalid DTO', async () => {
      const dto = { name: '' }; // Empty name
      const user = { _id: new Types.ObjectId() };
      
      await expect(
        controller.createBoard(dto as any, user)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

**Guard Tests:**

Focus on authorization logic:

```typescript
describe('BoardRoleGuard', () => {
  it('should allow admin to access admin-only endpoint', async () => {
    const context = createMockContext({
      user: { _id: userId },
      params: { boardId },
      metadata: { requiredRole: 'admin' }
    });
    
    const board = await createTestBoard({ 
      members: [{ user: userId, role: 'admin' }] 
    });
    
    const result = await guard.canActivate(context);
    
    expect(result).toBe(true);
  });
  
  it('should deny member access to admin-only endpoint', async () => {
    const context = createMockContext({
      user: { _id: userId },
      params: { boardId },
      metadata: { requiredRole: 'admin' }
    });
    
    const board = await createTestBoard({ 
      members: [{ user: userId, role: 'member' }] 
    });
    
    await expect(
      guard.canActivate(context)
    ).rejects.toThrow(ForbiddenException);
  });
});
```

### Property-Based Testing Strategy

**Test Data Generators:**

Create reusable generators for domain objects:

```typescript
// generators.ts
import * as fc from 'fast-check';

export const arbitraries = {
  email: () => fc.emailAddress(),
  
  password: () => fc.string({ minLength: 8, maxLength: 50 }),
  
  objectId: () => fc.hexaString({ minLength: 24, maxLength: 24 }),
  
  boardName: () => fc.string({ minLength: 1, maxLength: 100 }),
  
  cardTitle: () => fc.string({ minLength: 1, maxLength: 200 }),
  
  role: () => fc.constantFrom('admin', 'member', 'observer'),
  
  priority: () => fc.constantFrom('low', 'medium', 'high', 'critical'),
  
  user: () => fc.record({
    _id: arbitraries.objectId(),
    email: arbitraries.email(),
    name: fc.string({ minLength: 1, maxLength: 50 })
  }),
  
  board: () => fc.record({
    _id: arbitraries.objectId(),
    name: arbitraries.boardName(),
    description: fc.string({ maxLength: 500 }),
    members: fc.array(fc.record({
      user: arbitraries.objectId(),
      role: arbitraries.role()
    }), { minLength: 1, maxLength: 10 })
  }),
  
  card: () => fc.record({
    _id: arbitraries.objectId(),
    listId: arbitraries.objectId(),
    boardId: arbitraries.objectId(),
    title: arbitraries.cardTitle(),
    description: fc.string({ maxLength: 2000 }),
    position: fc.nat({ max: 1000 })
  })
};
```

**Example Property Tests:**

```typescript
// auth.properties.spec.ts

// Feature: trello-ticket-system, Property 1: Valid Registration Creates Account
describe('Authentication Properties', () => {
  it('should create account for any valid credentials', () => {
    fc.assert(
      fc.asyncProperty(
        arbitraries.email(),
        arbitraries.password(),
        async (email, password) => {
          const result = await authService.register(email, password);
          expect(result.user).toBeDefined();
          expect(result.user.email).toBe(email);
          
          const storedUser = await userModel.findOne({ email });
          expect(storedUser.password).not.toBe(password);
          expect(await bcrypt.compare(password, storedUser.password)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: trello-ticket-system, Property 2: Duplicate Email Registration Rejected
  it('should reject duplicate email registration', () => {
    fc.assert(
      fc.asyncProperty(
        arbitraries.email(),
        arbitraries.password(),
        arbitraries.password(),
        async (email, password1, password2) => {
          await authService.register(email, password1);
          
          await expect(
            authService.register(email, password2)
          ).rejects.toThrow(DuplicateEmailException);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// boards.properties.spec.ts

// Feature: trello-ticket-system, Property 7: Board Creator Assigned as Admin
describe('Board Properties', () => {
  it('should assign creator as admin for any board creation', () => {
    fc.assert(
      fc.asyncProperty(
        arbitraries.user(),
        arbitraries.boardName(),
        fc.string({ maxLength: 500 }),
        async (user, name, description) => {
          const board = await boardsService.createBoard(user._id, { name, description });
          
          expect(board.members).toHaveLength(1);
          expect(board.members[0].user.toString()).toBe(user._id);
          expect(board.members[0].role).toBe('admin');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: trello-ticket-system, Property 9: Default Lists Created
  it('should create default lists for any board', () => {
    fc.assert(
      fc.asyncProperty(
        arbitraries.user(),
        arbitraries.boardName(),
        async (user, name) => {
          const board = await boardsService.createBoard(user._id, { name });
          const lists = await listModel.find({ boardId: board._id });
          
          expect(lists).toHaveLength(3);
          const listNames = lists.map(l => l.name).sort();
          expect(listNames).toEqual(['Completed', 'In Progress', 'To-Do']);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: trello-ticket-system, Property 13: Board Archive and Restore Round Trip
  it('should restore board to original state after archive/restore', () => {
    fc.assert(
      fc.asyncProperty(
        arbitraries.board(),
        async (boardData) => {
          const board = await boardModel.create(boardData);
          const originalState = board.toObject();
          
          const archived = await boardsService.archiveBoard(board._id);
          expect(archived.archived).toBe(true);
          
          const restored = await boardsService.restoreBoard(board._id);
          expect(restored.archived).toBe(false);
          expect(restored.name).toBe(originalState.name);
          expect(restored.description).toBe(originalState.description);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// cards.properties.spec.ts

// Feature: trello-ticket-system, Property 28: Card Position Order Maintained
describe('Card Properties', () => {
  it('should maintain position order for any card reordering', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(arbitraries.card(), { minLength: 3, maxLength: 10 }),
        fc.nat(),
        async (cards, newPosition) => {
          const list = await createTestList();
          const createdCards = await Promise.all(
            cards.map((c, i) => cardModel.create({ ...c, listId: list._id, position: i }))
          );
          
          const cardToMove = createdCards[0];
          const validPosition = newPosition % createdCards.length;
          
          await cardsService.reorderCard(cardToMove._id, validPosition);
          
          const reorderedCards = await cardModel
            .find({ listId: list._id })
            .sort({ position: 1 });
          
          const positions = reorderedCards.map(c => c.position);
          expect(positions).toEqual([...positions].sort((a, b) => a - b));
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing Strategy

**E2E API Tests:**

Test complete request/response cycles:

```typescript
describe('Board API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Register and login
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test' });
    
    authToken = response.headers['set-cookie'][0];
  });
  
  it('should create board with default lists', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/boards')
      .set('Cookie', authToken)
      .send({ name: 'Test Board', description: 'Test' })
      .expect(201);
    
    expect(response.body.board).toBeDefined();
    expect(response.body.board.name).toBe('Test Board');
    
    const listsResponse = await request(app.getHttpServer())
      .get(`/api/boards/${response.body.board._id}/lists`)
      .set('Cookie', authToken)
      .expect(200);
    
    expect(listsResponse.body.lists).toHaveLength(3);
  });
});
```

### Frontend Testing Strategy

**Component Tests:**

```typescript
describe('Card Component', () => {
  it('should render card with title and description', () => {
    const card = {
      _id: '123',
      title: 'Test Card',
      description: 'Test Description',
      position: 0
    };
    
    render(<Card card={card} />);
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
  
  it('should call onMove when dragged', () => {
    const onMove = jest.fn();
    const card = { _id: '123', title: 'Test', position: 0 };
    
    render(<Card card={card} onMove={onMove} />);
    
    // Simulate drag and drop
    fireEvent.dragStart(screen.getByText('Test'));
    fireEvent.drop(screen.getByTestId('drop-zone'));
    
    expect(onMove).toHaveBeenCalledWith('123', expect.any(Number));
  });
});
```

### Test Coverage Goals

- Unit test coverage: 80% minimum
- Property test coverage: All correctness properties from design document
- Integration test coverage: All critical user workflows
- Frontend component coverage: 70% minimum

### Continuous Integration

**CI Pipeline:**

1. Run linting and type checking
2. Run unit tests
3. Run property-based tests
4. Run integration tests
5. Generate coverage reports
6. Fail build if coverage below thresholds

