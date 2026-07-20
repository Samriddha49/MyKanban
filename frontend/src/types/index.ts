export interface User {
  id: number;
  name: string;
  email: string;
}

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Organization {
  id: number;
  name: string;
  createdAt: string;
  myRole: MemberRole;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  organizationId: number;
  createdAt: string;
}

export interface Board {
  id: number;
  name: string;
  backgroundColor?: string;
  workspaceId: number;
  archived: boolean;
  createdAt: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface CardItem {
  id: number;
  title: string;
  description?: string;
  position: number;
  listId: number;
  dueDate?: string;
  labels: Label[];
  assignees: User[];
  createdById: number;
}

export interface BoardList {
  id: number;
  name: string;
  position: number;
  boardId: number;
  cards: CardItem[];
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  createdAt: string;
  updatedAt?: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  url: string;
  uploadedBy: User;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  details: string;
  actor: User;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
}
