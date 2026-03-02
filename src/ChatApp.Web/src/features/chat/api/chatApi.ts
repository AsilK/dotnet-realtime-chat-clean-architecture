import { apiClient } from '../../../shared/api/client';
import type { ApiResult, ApiResultWithoutValue, ChatRoomDto, MessageDto, PaginatedList } from '../../../shared/api/contracts';

type ChatRoomType = 1 | 2 | 3;
type MessageType = 1 | 2 | 3 | 4;

export type CreateRoomRequest = {
  name: string;
  description: string | null;
  roomType: ChatRoomType;
  memberIds?: string[];
};

export type SendMessageRequest = {
  chatRoomId: string;
  content: string;
  type: MessageType;
  replyToMessageId?: string | null;
};

type GetRoomMessagesParams = {
  pageNumber?: number;
  pageSize?: number;
  beforeMessageId?: string;
};

function unwrapResult<T>(result: ApiResult<T>, fallbackError: string): T {
  if (!result.isSuccess || !result.value) {
    throw new Error(result.error ?? fallbackError);
  }

  return result.value;
}

function unwrapResultWithoutValue(result: ApiResultWithoutValue, fallbackError: string): void {
  if (!result.isSuccess) {
    throw new Error(result.error ?? fallbackError);
  }
}

export async function getMyChatRooms(pageNumber = 1, pageSize = 20): Promise<PaginatedList<ChatRoomDto>> {
  const response = await apiClient.get<ApiResult<PaginatedList<ChatRoomDto>>>('/api/chatrooms', {
    params: { pageNumber, pageSize },
  });

  return unwrapResult(response.data, 'Unable to fetch chat rooms.');
}

export async function createChatRoom(request: CreateRoomRequest): Promise<ChatRoomDto> {
  const payload = {
    name: request.name,
    description: request.description,
    roomType: request.roomType,
    memberIds: request.memberIds && request.memberIds.length > 0 ? request.memberIds : undefined,
  };

  const response = await apiClient.post<ApiResult<ChatRoomDto>>('/api/chatrooms', payload);
  return unwrapResult(response.data, 'Unable to create chat room.');
}

export async function getChatRoomById(roomId: string): Promise<ChatRoomDto> {
  const response = await apiClient.get<ApiResult<ChatRoomDto>>(`/api/chatrooms/${roomId}`);
  return unwrapResult(response.data, 'Unable to fetch room details.');
}

export async function joinChatRoom(roomId: string): Promise<void> {
  const response = await apiClient.post<ApiResultWithoutValue>(`/api/chatrooms/${roomId}/join`);
  unwrapResultWithoutValue(response.data, 'Unable to join room.');
}

export async function leaveChatRoom(roomId: string): Promise<void> {
  const response = await apiClient.post<ApiResultWithoutValue>(`/api/chatrooms/${roomId}/leave`);
  unwrapResultWithoutValue(response.data, 'Unable to leave room.');
}

export async function getRoomMessages(roomId: string, params?: GetRoomMessagesParams): Promise<PaginatedList<MessageDto>> {
  const response = await apiClient.get<ApiResult<PaginatedList<MessageDto>>>(`/api/messages/room/${roomId}`, {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 30,
      beforeMessageId: params?.beforeMessageId,
    },
  });

  return unwrapResult(response.data, 'Unable to fetch room messages.');
}

export async function searchRoomMessages(roomId: string, term: string, pageNumber = 1, pageSize = 30): Promise<PaginatedList<MessageDto>> {
  const response = await apiClient.get<ApiResult<PaginatedList<MessageDto>>>(`/api/messages/room/${roomId}/search`, {
    params: { term, pageNumber, pageSize },
  });

  return unwrapResult(response.data, 'Unable to search messages.');
}

export async function sendMessage(request: SendMessageRequest): Promise<MessageDto> {
  const response = await apiClient.post<ApiResult<MessageDto>>('/api/messages', {
    chatRoomId: request.chatRoomId,
    content: request.content,
    type: request.type,
    replyToMessageId: request.replyToMessageId ?? null,
  });

  return unwrapResult(response.data, 'Unable to send message.');
}

export async function editMessage(messageId: string, content: string): Promise<MessageDto> {
  const response = await apiClient.put<ApiResult<MessageDto>>(`/api/messages/${messageId}`, JSON.stringify(content), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return unwrapResult(response.data, 'Unable to edit message.');
}

export async function deleteMessage(messageId: string): Promise<void> {
  const response = await apiClient.delete<ApiResultWithoutValue>(`/api/messages/${messageId}`);
  unwrapResultWithoutValue(response.data, 'Unable to delete message.');
}
