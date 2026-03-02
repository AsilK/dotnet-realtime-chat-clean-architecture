export type ApiResult<T> = {
  isSuccess: boolean;
  error: string | null;
  value: T | null;
};

export type ApiResultWithoutValue = {
  isSuccess: boolean;
  error: string | null;
};

export type PaginatedList<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
};

export type AuthResponseDto = {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  refreshTokenExpiresAtUtc: string;
};

export type UserDto = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  isOnline: boolean;
  lastSeenAtUtc: string | null;
};

export type ChatRoomDto = {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  type: string;
  createdByUserId: string;
  memberCount: number;
};

export type MessageDto = {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  type: string;
  replyToMessageId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAtUtc: string;
  editedAtUtc: string | null;
};
