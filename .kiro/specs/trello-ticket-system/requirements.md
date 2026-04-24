# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive Trello-like ticket management application. The system enables users to organize tasks using boards, lists, and cards with collaborative features including authentication, role-based permissions, real-time notifications, and activity tracking. The application consists of a NestJS backend with MongoDB storage and a Next.js frontend, using JWT-based authentication.

## Glossary

- **System**: The complete Trello-like ticket management application
- **Authentication_Service**: The component responsible for user authentication and authorization
- **Board**: A workspace container that holds multiple lists
- **List**: A column within a board that contains multiple cards
- **Card**: A task or ticket item within a list
- **User**: An authenticated person using the system
- **Admin**: A user with full permissions on a board
- **Member**: A user with edit permissions on a board
- **Observer**: A user with read-only permissions on a board
- **Activity_Log**: A chronological record of all actions performed in the system
- **Notification_Service**: The component responsible for delivering notifications to users
- **Archive**: A soft-delete state where items are hidden but recoverable
- **Watcher**: A user who subscribes to receive notifications about a card
- **Checklist**: A set of subtasks within a card
- **Label**: A categorization tag that can be applied to cards
- **Attachment**: A file uploaded and associated with a card
- **Comment**: A text message posted on a card
- **Mention**: A reference to a user within a comment using @username syntax
- **JWT_Token**: JSON Web Token used for authentication
- **API**: The REST endpoints exposed by the backend
- **Priority**: A classification level indicating card urgency (Low, Medium, High, Critical)

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to register and sign in securely, so that I can access my boards and maintain data privacy.

#### Acceptance Criteria

1. THE Authentication_Service SHALL provide a registration endpoint that accepts email and password
2. WHEN a user registers with valid credentials, THE Authentication_Service SHALL create a new user account
3. WHEN a user registers with an email that already exists, THE Authentication_Service SHALL return an error
4. THE Authentication_Service SHALL hash passwords before storing them in the database
5. THE Authentication_Service SHALL provide a sign-in endpoint that accepts email and password
6. WHEN a user signs in with valid credentials, THE Authentication_Service SHALL generate a JWT_Token
7. THE Authentication_Service SHALL store the JWT_Token in an HTTP-only cookie
8. WHEN a user provides invalid credentials, THE Authentication_Service SHALL return an authentication error
9. THE Authentication_Service SHALL validate JWT_Token on protected endpoints
10. WHEN a JWT_Token expires, THE Authentication_Service SHALL require re-authentication

### Requirement 2: Board Creation and Management

**User Story:** As a user, I want to create and manage boards, so that I can organize different projects separately.

#### Acceptance Criteria

1. WHEN an authenticated user requests board creation, THE System SHALL create a new board with the user as Admin
2. THE System SHALL assign a unique identifier to each board
3. WHEN a board is created, THE System SHALL initialize it with three default lists: To-Do, In Progress, and Completed
4. THE System SHALL allow Admin users to update board name and description
5. WHEN a user requests their boards, THE System SHALL return all boards where the user has any role
6. THE System SHALL store board metadata including creation date and creator
7. WHEN an Admin archives a board, THE System SHALL mark it as archived and hide it from default views
8. THE System SHALL allow Admin users to restore archived boards

### Requirement 3: Board Role-Based Access Control

**User Story:** As a board admin, I want to control who can access and modify my board, so that I can maintain appropriate permissions.

#### Acceptance Criteria

1. THE System SHALL support three role types: Admin, Member, and Observer
2. WHEN a board is created, THE System SHALL assign the creator as Admin
3. THE System SHALL allow Admin users to invite other users to the board
4. WHEN inviting a user, THE Admin SHALL specify the role being granted
5. THE System SHALL allow Admin users to modify roles of existing board members
6. THE System SHALL allow Admin users to remove users from the board
7. THE System SHALL prevent Member and Observer users from modifying board settings
8. THE System SHALL prevent Observer users from creating, editing, or deleting lists and cards
9. THE System SHALL allow Member users to create, edit, and delete lists and cards
10. THE System SHALL allow all role types to view board content

### Requirement 4: List Management

**User Story:** As a board member, I want to create and organize lists, so that I can structure my workflow.

#### Acceptance Criteria

1. WHEN a Member or Admin creates a list, THE System SHALL add it to the board
2. THE System SHALL assign a unique identifier to each list
3. THE System SHALL maintain a position order for lists within a board
4. WHEN a user reorders lists via drag and drop, THE System SHALL persist the new order
5. THE System SHALL allow Member and Admin users to rename lists
6. WHEN a Member or Admin archives a list, THE System SHALL mark it as archived and hide it from default views
7. THE System SHALL allow Member and Admin users to restore archived lists
8. WHEN a list is archived, THE System SHALL maintain all cards within it
9. THE System SHALL return lists in their stored position order

### Requirement 5: Card Creation and Basic Properties

**User Story:** As a board member, I want to create cards with essential information, so that I can track tasks.

#### Acceptance Criteria

1. WHEN a Member or Admin creates a card in a list, THE System SHALL add the card to that list
2. THE System SHALL assign a unique identifier to each card
3. THE System SHALL require a title for each card
4. THE System SHALL allow cards to have an optional description
5. THE System SHALL maintain a position order for cards within a list
6. WHEN a user reorders cards via drag and drop within a list, THE System SHALL persist the new order
7. WHEN a user moves a card to a different list via drag and drop, THE System SHALL update the card's list and persist the position
8. THE System SHALL allow Member and Admin users to update card title and description
9. THE System SHALL store card metadata including creation date and creator
10. THE System SHALL return cards in their stored position order within each list

### Requirement 6: Card Assignment and Due Dates

**User Story:** As a board member, I want to assign cards to users and set due dates, so that I can track responsibility and deadlines.

#### Acceptance Criteria

1. THE System SHALL allow Member and Admin users to assign a card to any board member
2. THE System SHALL allow only one assignee per card
3. THE System SHALL allow Member and Admin users to change the assignee
4. THE System SHALL allow Member and Admin users to remove the assignee
5. THE System SHALL allow Member and Admin users to set a due date on a card
6. THE System SHALL store due dates with date and time precision
7. THE System SHALL allow Member and Admin users to update or remove due dates
8. WHEN a card has a due date, THE System SHALL include it in the card response

### Requirement 7: Card Labels

**User Story:** As a board member, I want to add labels to cards, so that I can categorize and visually organize tasks.

#### Acceptance Criteria

1. THE System SHALL allow Member and Admin users to create labels with a name and color
2. THE System SHALL allow multiple labels to be applied to a single card
3. THE System SHALL allow Member and Admin users to add labels to cards
4. THE System SHALL allow Member and Admin users to remove labels from cards
5. THE System SHALL maintain a list of available labels per board
6. THE System SHALL allow Admin users to edit label names and colors
7. THE System SHALL allow Admin users to delete labels from the board
8. WHEN a label is deleted from a board, THE System SHALL remove it from all cards

### Requirement 8: Card Priority Levels

**User Story:** As a board member, I want to set priority levels on cards, so that I can indicate task urgency.

#### Acceptance Criteria

1. THE System SHALL support four priority levels: Low, Medium, High, and Critical
2. THE System SHALL allow Member and Admin users to set a priority level on a card
3. THE System SHALL allow Member and Admin users to change the priority level
4. THE System SHALL allow Member and Admin users to remove the priority level
5. WHEN a card has a priority level, THE System SHALL include it in the card response

### Requirement 9: Card Checklists

**User Story:** As a board member, I want to add checklists to cards, so that I can break down tasks into subtasks.

#### Acceptance Criteria

1. THE System SHALL allow Member and Admin users to add a checklist to a card
2. THE System SHALL allow multiple checklists per card
3. THE System SHALL require a title for each checklist
4. THE System SHALL allow Member and Admin users to add items to a checklist
5. THE System SHALL allow Member and Admin users to mark checklist items as complete or incomplete
6. THE System SHALL allow Member and Admin users to reorder checklist items
7. THE System SHALL allow Member and Admin users to delete checklist items
8. THE System SHALL allow Member and Admin users to delete entire checklists
9. THE System SHALL calculate and return the completion percentage for each checklist

### Requirement 10: Card Comments and Mentions

**User Story:** As a board member, I want to comment on cards and mention other users, so that I can communicate about tasks.

#### Acceptance Criteria

1. THE System SHALL allow all board members to add comments to cards
2. THE System SHALL store the comment author and timestamp
3. THE System SHALL allow comment authors to edit their own comments
4. THE System SHALL allow comment authors and Admin users to delete comments
5. THE System SHALL support @username mentions within comments
6. WHEN a comment contains a mention, THE System SHALL parse and identify mentioned users
7. WHEN a user is mentioned in a comment, THE Notification_Service SHALL notify that user
8. THE System SHALL return comments in chronological order

### Requirement 11: Card File Attachments

**User Story:** As a board member, I want to attach files to cards, so that I can include relevant documents and images.

#### Acceptance Criteria

1. THE System SHALL allow Member and Admin users to upload files to cards
2. THE System SHALL store file metadata including filename, size, and upload date
3. THE System SHALL allow multiple attachments per card
4. THE System SHALL allow Member and Admin users to delete attachments
5. THE System SHALL provide a download endpoint for attachments
6. WHEN a file exceeds the maximum size limit, THE System SHALL return an error
7. THE System SHALL store the uploader's identity with each attachment

### Requirement 12: Card Watchers

**User Story:** As a board member, I want to watch cards, so that I can receive notifications about cards I'm interested in.

#### Acceptance Criteria

1. THE System SHALL allow any board member to add themselves as a watcher to a card
2. THE System SHALL allow any board member to remove themselves as a watcher from a card
3. THE System SHALL allow multiple watchers per card
4. WHEN a card is updated, THE Notification_Service SHALL notify all watchers
5. WHEN a user is assigned to a card, THE System SHALL automatically add them as a watcher
6. THE System SHALL return the list of watchers for each card

### Requirement 13: Card Archiving

**User Story:** As a board member, I want to archive cards, so that I can hide completed or irrelevant tasks without deleting them.

#### Acceptance Criteria

1. THE System SHALL allow Member and Admin users to archive cards
2. WHEN a card is archived, THE System SHALL mark it as archived and hide it from default views
3. THE System SHALL allow Member and Admin users to restore archived cards
4. WHEN a card is restored, THE System SHALL return it to its original list
5. THE System SHALL maintain all card data when archived

### Requirement 14: Activity Logging

**User Story:** As a user, I want to see a history of all actions, so that I can track changes and understand what happened.

#### Acceptance Criteria

1. WHEN a board is created, THE Activity_Log SHALL record the action
2. WHEN a list is created, updated, or archived, THE Activity_Log SHALL record the action
3. WHEN a card is created, updated, moved, or archived, THE Activity_Log SHALL record the action
4. WHEN a comment is added or deleted, THE Activity_Log SHALL record the action
5. WHEN a user is added to or removed from a board, THE Activity_Log SHALL record the action
6. WHEN an attachment is uploaded or deleted, THE Activity_Log SHALL record the action
7. THE Activity_Log SHALL store the actor, action type, timestamp, and affected entity
8. THE System SHALL provide an endpoint to retrieve activity logs for a board
9. THE System SHALL return activity logs in reverse chronological order
10. THE System SHALL provide an endpoint to retrieve activity logs for a specific card

### Requirement 15: Notification System

**User Story:** As a user, I want to receive notifications about relevant activities, so that I stay informed about changes.

#### Acceptance Criteria

1. WHEN a user is mentioned in a comment, THE Notification_Service SHALL create a notification for that user
2. WHEN a user is assigned to a card, THE Notification_Service SHALL create a notification for that user
3. WHEN a watched card is updated, THE Notification_Service SHALL create notifications for all watchers
4. WHEN a user is invited to a board, THE Notification_Service SHALL create a notification for that user
5. THE System SHALL provide an endpoint to retrieve unread notifications for a user
6. THE System SHALL allow users to mark notifications as read
7. THE System SHALL store notification type, related entity, actor, and timestamp
8. THE System SHALL return notifications in reverse chronological order

### Requirement 16: Search Functionality

**User Story:** As a user, I want to search for cards, so that I can quickly find specific tasks.

#### Acceptance Criteria

1. THE System SHALL provide a search endpoint that accepts a query string
2. WHEN a user searches within a board, THE System SHALL return cards matching the query in title or description
3. THE System SHALL support case-insensitive search
4. THE System SHALL return search results with card details including list name
5. THE System SHALL exclude archived cards from search results by default

### Requirement 17: Filtering Capabilities

**User Story:** As a user, I want to filter cards by various criteria, so that I can focus on specific subsets of tasks.

#### Acceptance Criteria

1. THE System SHALL allow filtering cards by assignee
2. THE System SHALL allow filtering cards by label
3. THE System SHALL allow filtering cards by priority level
4. THE System SHALL allow filtering cards by due date range
5. THE System SHALL allow combining multiple filter criteria
6. THE System SHALL return filtered results with full card details
7. THE System SHALL exclude archived cards from filter results by default

### Requirement 18: API Input Validation

**User Story:** As a developer, I want all API inputs to be validated, so that the system maintains data integrity.

#### Acceptance Criteria

1. WHEN an API receives a request with missing required fields, THE System SHALL return a validation error
2. WHEN an API receives a request with invalid data types, THE System SHALL return a validation error
3. WHEN an API receives a request with invalid email format, THE System SHALL return a validation error
4. WHEN an API receives a request with a password shorter than 8 characters, THE System SHALL return a validation error
5. WHEN an API receives a request with invalid entity identifiers, THE System SHALL return a not found error
6. THE System SHALL validate that referenced entities exist before creating relationships
7. THE System SHALL return descriptive error messages for all validation failures

### Requirement 19: API Authorization

**User Story:** As a developer, I want all API endpoints to enforce authorization, so that users can only perform permitted actions.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses a protected endpoint, THE System SHALL return an authentication error
2. WHEN a user attempts to access a board they are not a member of, THE System SHALL return an authorization error
3. WHEN an Observer attempts to modify a list or card, THE System SHALL return an authorization error
4. WHEN a Member attempts to modify board settings, THE System SHALL return an authorization error
5. WHEN a non-Admin attempts to change user roles, THE System SHALL return an authorization error
6. WHEN a user attempts to modify another user's comment, THE System SHALL return an authorization error
7. THE System SHALL verify user permissions before executing any state-changing operation

### Requirement 20: API Error Handling

**User Story:** As a developer, I want consistent error handling across all API endpoints, so that clients can handle errors predictably.

#### Acceptance Criteria

1. WHEN an error occurs, THE API SHALL return an appropriate HTTP status code
2. WHEN a validation error occurs, THE API SHALL return status code 400
3. WHEN an authentication error occurs, THE API SHALL return status code 401
4. WHEN an authorization error occurs, THE API SHALL return status code 403
5. WHEN a resource is not found, THE API SHALL return status code 404
6. WHEN a server error occurs, THE API SHALL return status code 500
7. THE API SHALL return error responses in a consistent JSON format with message and error code
8. THE API SHALL log all server errors for debugging purposes

## Requirements Summary

This requirements document defines a comprehensive ticket management system with 20 major requirements covering authentication, board management, role-based access control, list and card operations, collaborative features (comments, mentions, watchers), activity tracking, notifications, search and filtering, and robust API validation and error handling. The system is designed to support team collaboration with appropriate security and data integrity controls.
