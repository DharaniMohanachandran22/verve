import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

// Authentication Exceptions
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid email or password');
  }
}

export class EmailNotFoundException extends BadRequestException {
  constructor() {
    super('Email does not exist');
  }
}

export class IncorrectPasswordException extends BadRequestException {
  constructor() {
    super('Invalid or incorrect password');
  }
}

export class InvalidOtpException extends BadRequestException {
  constructor() {
    super('Invalid OTP');
  }
}

export class ExpiredOtpException extends BadRequestException {
  constructor() {
    super('OTP expired, please resend');
  }
}

export class SamePasswordException extends BadRequestException {
  constructor() {
    super('New password cannot be the same as the old password');
  }
}

export class DuplicateEmailException extends BadRequestException {
  constructor() {
    super('Email already exists');
  }
}

export class EmailExistsButNotVerifiedException extends BadRequestException {
  constructor() {
    super('Account exists but is not verified');
  }
}

export class EmailNotVerifiedException extends UnauthorizedException {
  constructor() {
    super('Please verify your email before logging in');
  }
}

// Authorization Exceptions
export class NotBoardMemberException extends ForbiddenException {
  constructor() {
    super('You are not a member of this board');
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(action?: string) {
    super(action ? `Insufficient permissions to ${action}` : 'Insufficient permissions');
  }
}

// Not Found Exceptions
export class BoardNotFoundException extends NotFoundException {
  constructor(boardId?: string) {
    super(boardId ? `Board with ID ${boardId} not found` : 'Board not found');
  }
}

export class ListNotFoundException extends NotFoundException {
  constructor(listId?: string) {
    super(listId ? `List with ID ${listId} not found` : 'List not found');
  }
}

export class CardNotFoundException extends NotFoundException {
  constructor(cardId?: string) {
    super(cardId ? `Card with ID ${cardId} not found` : 'Card not found');
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(userId?: string) {
    super(userId ? `User with ID ${userId} not found` : 'User not found');
  }
}

export class CommentNotFoundException extends NotFoundException {
  constructor(commentId?: string) {
    super(commentId ? `Comment with ID ${commentId} not found` : 'Comment not found');
  }
}

export class AttachmentNotFoundException extends NotFoundException {
  constructor(attachmentId?: string) {
    super(attachmentId ? `Attachment with ID ${attachmentId} not found` : 'Attachment not found');
  }
}

export class LabelNotFoundException extends NotFoundException {
  constructor(labelId?: string) {
    super(labelId ? `Label with ID ${labelId} not found` : 'Label not found');
  }
}

export class ChecklistNotFoundException extends NotFoundException {
  constructor(checklistId?: string) {
    super(checklistId ? `Checklist with ID ${checklistId} not found` : 'Checklist not found');
  }
}

// File Upload Exceptions
export class InvalidFileTypeException extends BadRequestException {
  constructor(allowedTypes?: string[]) {
    super(
      allowedTypes
        ? `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        : 'Invalid file type',
    );
  }
}

export class FileSizeExceededException extends BadRequestException {
  constructor(maxSize?: number) {
    super(
      maxSize
        ? `File size exceeds maximum allowed size of ${maxSize} bytes`
        : 'File size exceeds maximum allowed size',
    );
  }
}
