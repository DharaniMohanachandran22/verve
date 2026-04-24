export type Role = 'owner' | 'editor' | 'viewer';

export interface BoardSummary {
  id: string;
  name: string;
  role: Role;
}

export interface MemberResponse {
  userId: string;
  role: Role;
  name?: string;
  email?: string;
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export interface ChecklistItem {
  id: string;
  _id?: string;
  content: string;
  text?: string;
  completed: boolean;
  assignee?: string;
}

export interface ChecklistDetail {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface CommentDetail {
  id: string;
  content: string;
  authorId: string;
  authorName?: string | null;
  createdAt: string;
}

export interface AttachmentDetail {
  id: string;
  filename: string;
  originalname: string;
  originalName?: string;
  mimetype: string;
  mimeType?: string;
  size: number;
  createdAt: string;
}

export interface ActivityDetail {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface CardDetail {
  id: string;
  title: string;
  description?: string;
  position: number;
  priority?: Priority;
  dueDate?: string;
  labels: string[];
  assignee?: string;
  checklists: ChecklistDetail[];
  comments: CommentDetail[];
  attachments: AttachmentDetail[];
  activities: ActivityDetail[];
  watchers: string[];
}

export interface ListDetail {
  id: string;
  name: string;
  position: number;
  cards: CardDetail[];
  watchers: string[];
}

export interface LabelDetail {
  id: string;
  name: string;
  color: string;
}

export interface BoardDetail {
  id: string;
  name: string;
  description: string;
  members: MemberResponse[];
  lists: ListDetail[];
  labels: LabelDetail[];
}
