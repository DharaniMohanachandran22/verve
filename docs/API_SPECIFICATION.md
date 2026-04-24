# API Specification

## Authentication
All protected routes require a Bearer JWT token in the `Authorization` header.

### Endpoints
- `POST /auth/register`: Create a new user account.
- `POST /auth/login`: Authenticate and receive a JWT.
- `POST /auth/forgot-password`: Initiate password recovery.
- `GET /auth/profile`: Retrieve the current user's profile.

## Boards
Manage Kanban boards and their members.

### Endpoints
- `POST /boards`: Create a new board.
- `GET /boards`: List all boards for the authenticated user.
- `GET /boards/:id`: Retrieve details for a specific board.
- `PATCH /boards/:id`: Update board settings.
- `DELETE /boards/:id`: Delete a board.
- `POST /boards/:id/invite`: Invite a user to the board.

## Lists
Manage vertical columns within a board.

### Endpoints
- `POST /lists`: Create a new list.
- `GET /lists/board/:boardId`: List all lists for a specific board.
- `PATCH /lists/:id`: Update list title or position.

## Cards
Manage tasks (cards) within lists.

### Endpoints
- `POST /cards`: Create a new card.
- `GET /cards/list/:listId`: List all cards for a specific list.
- `PATCH /cards/:id`: Update card details or move between lists.
- `DELETE /cards/:id`: Delete a card.

## Comments
Interact with cards via comments.

### Endpoints
- `POST /comments`: Add a comment to a card.
- `GET /comments/card/:cardId`: Retrieve all comments for a card.

## Notifications
Track in-app updates.

### Endpoints
- `GET /notifications`: List user notifications.
- `PATCH /notifications/:id/read`: Mark a notification as read.

---

## Error Handling
The API returns standard HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side failure
