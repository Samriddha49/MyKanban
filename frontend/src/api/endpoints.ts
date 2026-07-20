import { apiClient } from './client';
import type {
  AuthResponse, Organization, Workspace, Board, BoardList,
  CardItem, Label, Comment, Attachment, ActivityLogEntry, User, MemberRole,
} from '../types';

// ---------- Auth ----------
export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }),
};

// ---------- Organizations ----------
export const orgApi = {
  create: (name: string) => apiClient.post<Organization>('/organizations', { name }),
  listMine: () => apiClient.get<Organization[]>('/organizations'),
  get: (orgId: number) => apiClient.get<Organization>(`/organizations/${orgId}`),
  inviteMember: (orgId: number, email: string, role: MemberRole) =>
    apiClient.post<User>(`/organizations/${orgId}/members`, { email, role }),
  listMembers: (orgId: number) => apiClient.get<User[]>(`/organizations/${orgId}/members`),
};

// ---------- Workspaces ----------
export const workspaceApi = {
  create: (orgId: number, name: string, description?: string) =>
    apiClient.post<Workspace>(`/organizations/${orgId}/workspaces`, { name, description }),
  listByOrg: (orgId: number) => apiClient.get<Workspace[]>(`/organizations/${orgId}/workspaces`),
  get: (workspaceId: number) => apiClient.get<Workspace>(`/workspaces/${workspaceId}`),
};

// ---------- Boards ----------
export const boardApi = {
  create: (workspaceId: number, name: string, backgroundColor?: string) =>
    apiClient.post<Board>(`/workspaces/${workspaceId}/boards`, { name, backgroundColor }),
  listByWorkspace: (workspaceId: number) => apiClient.get<Board[]>(`/workspaces/${workspaceId}/boards`),
  get: (boardId: number) => apiClient.get<Board>(`/boards/${boardId}`),
  archive: (boardId: number) => apiClient.delete(`/boards/${boardId}`),
};

// ---------- Lists ----------
export const listApi = {
  create: (boardId: number, name: string) =>
    apiClient.post<BoardList>(`/boards/${boardId}/lists`, { name }),
  listByBoard: (boardId: number) => apiClient.get<BoardList[]>(`/boards/${boardId}/lists`),
  move: (listId: number, newPosition: number) =>
    apiClient.patch(`/lists/${listId}/move`, { newPosition }),
  archive: (listId: number) => apiClient.delete(`/lists/${listId}`),
};

// ---------- Cards ----------
export const cardApi = {
  create: (listId: number, title: string, description?: string, dueDate?: string) =>
    apiClient.post<CardItem>(`/lists/${listId}/cards`, { title, description, dueDate }),
  get: (cardId: number) => apiClient.get<CardItem>(`/cards/${cardId}`),
  update: (cardId: number, title: string, description?: string, dueDate?: string) =>
    apiClient.put<CardItem>(`/cards/${cardId}`, { title, description, dueDate }),
  move: (cardId: number, targetListId: number, newPosition: number) =>
    apiClient.patch<CardItem>(`/cards/${cardId}/move`, { targetListId, newPosition }),
  archive: (cardId: number) => apiClient.delete(`/cards/${cardId}`),
  addLabel: (cardId: number, labelId: number) => apiClient.post<CardItem>(`/cards/${cardId}/labels/${labelId}`),
  removeLabel: (cardId: number, labelId: number) => apiClient.delete<CardItem>(`/cards/${cardId}/labels/${labelId}`),
  assign: (cardId: number, userId: number) => apiClient.post<CardItem>(`/cards/${cardId}/assignees/${userId}`),
  unassign: (cardId: number, userId: number) => apiClient.delete<CardItem>(`/cards/${cardId}/assignees/${userId}`),
  search: (boardId: number, query: string) =>
    apiClient.get<CardItem[]>(`/boards/${boardId}/cards/search`, { params: { query } }),
  filter: (boardId: number, labelId?: number, assigneeId?: number) =>
    apiClient.get<CardItem[]>(`/boards/${boardId}/cards/filter`, { params: { labelId, assigneeId } }),
};

// ---------- Labels ----------
export const labelApi = {
  create: (boardId: number, name: string, color: string) =>
    apiClient.post<Label>(`/boards/${boardId}/labels`, { name, color }),
  listByBoard: (boardId: number) => apiClient.get<Label[]>(`/boards/${boardId}/labels`),
  delete: (labelId: number) => apiClient.delete(`/labels/${labelId}`),
};

// ---------- Comments ----------
export const commentApi = {
  add: (cardId: number, content: string) => apiClient.post<Comment>(`/cards/${cardId}/comments`, { content }),
  listByCard: (cardId: number) => apiClient.get<Comment[]>(`/cards/${cardId}/comments`),
  update: (commentId: number, content: string) => apiClient.put<Comment>(`/comments/${commentId}`, { content }),
  delete: (commentId: number) => apiClient.delete(`/comments/${commentId}`),
};

// ---------- Attachments ----------
export const attachmentApi = {
  add: (cardId: number, fileName: string, url: string) =>
    apiClient.post<Attachment>(`/cards/${cardId}/attachments`, { fileName, url }),
  listByCard: (cardId: number) => apiClient.get<Attachment[]>(`/cards/${cardId}/attachments`),
  delete: (attachmentId: number) => apiClient.delete(`/attachments/${attachmentId}`),
};

// ---------- Activity Log ----------
export const activityApi = {
  getForBoard: (boardId: number) => apiClient.get<ActivityLogEntry[]>(`/boards/${boardId}/activity`),
};
