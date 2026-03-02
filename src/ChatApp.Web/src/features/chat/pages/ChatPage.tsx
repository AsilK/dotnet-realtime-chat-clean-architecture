import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  createChatRoom,
  deleteMessage,
  editMessage,
  getChatRoomById,
  getMyChatRooms,
  getRoomMessages,
  joinChatRoom,
  leaveChatRoom,
  searchRoomMessages,
  sendMessage,
} from '../api/chatApi';
import { createChatHubClient, type ChatHubClient, type ChatHubConnectionState } from '../realtime/chatHubClient';
import type { ChatRoomDto, MessageDto } from '../../../shared/api/contracts';
import { getStoredTokens } from '../../auth/api/tokenStorage';
import { useAuth } from '../../../shared/state/auth';
import { parseApiError } from '../../../shared/api/errorParser';

const roomPageSize = 50;
const messagePageSize = 30;
const typingThrottleMs = 1500;
const typingVisibilityMs = 2500;
const realtimeLogLimit = 10;
const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RoomTypeValue = 1 | 2 | 3;
type MessageReadMap = Record<string, string[]>;
type TypingByRoomMap = Record<string, string[]>;

function normalizeMessages(items: MessageDto[]): MessageDto[] {
  return [...items].sort((left, right) => Date.parse(left.createdAtUtc) - Date.parse(right.createdAtUtc));
}

function mergeMessages(current: MessageDto[], incoming: MessageDto[]): MessageDto[] {
  const merged = new Map<string, MessageDto>();
  current.forEach((message) => {
    merged.set(message.id, message);
  });

  incoming.forEach((message) => {
    merged.set(message.id, message);
  });

  return normalizeMessages([...merged.values()]);
}

function replaceMessage(items: MessageDto[], nextMessage: MessageDto): MessageDto[] {
  return items.map((message) => (message.id === nextMessage.id ? nextMessage : message));
}

function upsertRoomMembershipCount(rooms: ChatRoomDto[], roomId: string, delta: number): ChatRoomDto[] {
  return rooms.map((room) =>
    room.id === roomId
      ? {
          ...room,
          memberCount: Math.max(0, room.memberCount + delta),
        }
      : room,
  );
}

function dedupeReadUsers(current: MessageReadMap, messageId: string, userId: string): MessageReadMap {
  const existing = current[messageId] ?? [];
  if (existing.includes(userId)) {
    return current;
  }

  return {
    ...current,
    [messageId]: [...existing, userId],
  };
}

export function ChatPage() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomDto | null>(null);

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [messageTotalCount, setMessageTotalCount] = useState<number>(0);
  const [messageReadBy, setMessageReadBy] = useState<MessageReadMap>({});
  const [searchResults, setSearchResults] = useState<MessageDto[]>([]);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [composeText, setComposeText] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  const [createRoomName, setCreateRoomName] = useState<string>('');
  const [createRoomDescription, setCreateRoomDescription] = useState<string>('');
  const [createRoomType, setCreateRoomType] = useState<RoomTypeValue>(1);
  const [createRoomMembers, setCreateRoomMembers] = useState<string>('');

  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [isLoadingRoomState, setIsLoadingRoomState] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const [isRunningSearch, setIsRunningSearch] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [hubState, setHubState] = useState<ChatHubConnectionState>('disconnected');
  const [typingByRoom, setTypingByRoom] = useState<TypingByRoomMap>({});
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);

  const selectedRoomIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(currentUser?.id ?? null);
  const joinedRoomRef = useRef<string | null>(null);
  const lastTypingSignalAtRef = useRef<number>(0);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hubClientRef = useRef<ChatHubClient | null>(null);

  const visibleMessages = isSearchMode ? searchResults : messages;
  const oldestMessageId = messages.length > 0 ? messages[0].id : null;
  const canLoadOlder = !isSearchMode && messageTotalCount > messages.length && Boolean(oldestMessageId);
  const activeTypingUsers = selectedRoomId ? typingByRoom[selectedRoomId] ?? [] : [];

  const pushRealtimeEvent = useCallback((message: string): void => {
    const timestamp = new Date().toLocaleTimeString();
    setRealtimeEvents((current) => [`[${timestamp}] ${message}`, ...current].slice(0, realtimeLogLimit));
  }, []);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  const registerTypingEvent = useCallback((roomId: string, userId: string) => {
    const key = `${roomId}:${userId}`;
    const existingTimer = typingTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    setTypingByRoom((current) => {
      const users = current[roomId] ?? [];
      if (users.includes(userId)) {
        return current;
      }

      return {
        ...current,
        [roomId]: [...users, userId],
      };
    });

    const timeoutHandle = setTimeout(() => {
      setTypingByRoom((current) => {
        const users = current[roomId] ?? [];
        const nextUsers = users.filter((id) => id !== userId);
        if (nextUsers.length === users.length) {
          return current;
        }

        if (nextUsers.length === 0) {
          const { [roomId]: _, ...rest } = current;
          return rest;
        }

        return {
          ...current,
          [roomId]: nextUsers,
        };
      });
      typingTimersRef.current.delete(key);
    }, typingVisibilityMs);

    typingTimersRef.current.set(key, timeoutHandle);
  }, []);

  useEffect(() => {
    let disposed = false;

    const client = createChatHubClient({
      getAccessToken: () => getStoredTokens()?.accessToken ?? null,
      handlers: {
        onStateChange: (state) => {
          setHubState(state);
        },
        onReceiveMessage: (message) => {
          const activeRoomId = selectedRoomIdRef.current;
          if (activeRoomId && message.chatRoomId === activeRoomId) {
            setMessages((current) => {
              const isNewMessage = !current.some((item) => item.id === message.id);
              if (isNewMessage) {
                setMessageTotalCount((count) => count + 1);
              }
              return mergeMessages(current, [message]);
            });
          } else {
            setMessageTotalCount((count) => count + 1);
          }

          pushRealtimeEvent(`ReceiveMessage in room ${message.chatRoomId}`);
        },
        onUserStatusChanged: (userId, status) => {
          pushRealtimeEvent(`UserStatusChanged ${userId} -> ${status}`);
        },
        onUserJoinedRoom: (userId, roomId) => {
          setRooms((current) => upsertRoomMembershipCount(current, roomId, 1));
          setSelectedRoom((current) =>
            current && current.id === roomId
              ? {
                  ...current,
                  memberCount: current.memberCount + 1,
                }
              : current,
          );
          pushRealtimeEvent(`UserJoinedRoom ${userId} in ${roomId}`);
        },
        onUserLeftRoom: (userId, roomId) => {
          setRooms((current) => upsertRoomMembershipCount(current, roomId, -1));
          setSelectedRoom((current) =>
            current && current.id === roomId
              ? {
                  ...current,
                  memberCount: Math.max(0, current.memberCount - 1),
                }
              : current,
          );
          pushRealtimeEvent(`UserLeftRoom ${userId} in ${roomId}`);
        },
        onUserTyping: (userId, roomId) => {
          if (!userId || userId === currentUserIdRef.current) {
            return;
          }
          registerTypingEvent(roomId, userId);
          pushRealtimeEvent(`UserTyping ${userId} in ${roomId}`);
        },
        onMessageRead: (messageId, userId) => {
          setMessageReadBy((current) => dedupeReadUsers(current, messageId, userId));
          pushRealtimeEvent(`MessageRead ${messageId} by ${userId}`);
        },
      },
    });

    hubClientRef.current = client;
    void client.start().catch((startError: unknown) => {
      if (disposed) {
        return;
      }

      const message = startError instanceof Error ? startError.message : 'Unable to connect chat hub.';
      if (message.toLowerCase().includes('stopped during negotiation')) {
        return;
      }
      setError(message);
    });

    return () => {
      disposed = true;
      typingTimersRef.current.forEach((timeoutHandle) => clearTimeout(timeoutHandle));
      typingTimersRef.current.clear();
      void client.stop();
      hubClientRef.current = null;
    };
  }, [pushRealtimeEvent, registerTypingEvent]);

  useEffect(() => {
    if (hubState !== 'connected') {
      joinedRoomRef.current = null;
      return;
    }

    const client = hubClientRef.current;
    if (!client || !selectedRoomId) {
      return;
    }

    const previousRoomId = joinedRoomRef.current;
    if (previousRoomId && previousRoomId !== selectedRoomId) {
      void client.leaveRoom(previousRoomId).catch(() => undefined);
    }

    void client
      .joinRoom(selectedRoomId)
      .then(() => {
        joinedRoomRef.current = selectedRoomId;
      })
      .catch((joinError: unknown) => {
        const message = joinError instanceof Error ? joinError.message : 'Unable to join room channel.';
        setError(message);
      });
  }, [hubState, selectedRoomId]);

  const refreshRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    setError('');

    try {
      const result = await getMyChatRooms(1, roomPageSize);
      setRooms(result.items);
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to fetch rooms.'));
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    void refreshRooms();
  }, [refreshRooms]);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
      return;
    }

    if (selectedRoomId && !rooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(rooms.length > 0 ? rooms[0].id : null);
    }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) {
      setSelectedRoom(null);
      setMessages([]);
      setMessageTotalCount(0);
      setMessageReadBy({});
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }

    let isCancelled = false;

    const loadRoomState = async (): Promise<void> => {
      setIsLoadingRoomState(true);
      setError('');
      setSearchTerm('');
      setSearchResults([]);
      setIsSearchMode(false);

      try {
        const [room, page] = await Promise.all([getChatRoomById(selectedRoomId), getRoomMessages(selectedRoomId, { pageNumber: 1, pageSize: messagePageSize })]);
        if (isCancelled) {
          return;
        }

        setSelectedRoom(room);
        setMessages(normalizeMessages(page.items));
        setMessageTotalCount(page.totalCount);
        setMessageReadBy({});
      } catch (requestError) {
        if (isCancelled) {
          return;
        }

        setError(parseApiError(requestError, 'Unable to load selected room.'));
      } finally {
        if (!isCancelled) {
          setIsLoadingRoomState(false);
        }
      }
    };

    void loadRoomState();

    return () => {
      isCancelled = true;
    };
  }, [selectedRoomId]);

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');

    const trimmedName = createRoomName.trim();
    if (createRoomType !== 3 && trimmedName.length === 0) {
      setError('Room name is required for public/private rooms.');
      return;
    }

    setIsCreatingRoom(true);

    try {
      const memberIds = createRoomMembers
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      const invalidMemberIds = memberIds.filter((value) => !guidPattern.test(value));
      if (invalidMemberIds.length > 0) {
        setError(`Invalid member GUID(s): ${invalidMemberIds.join(', ')}`);
        setIsCreatingRoom(false);
        return;
      }

      const room = await createChatRoom({
        name: trimmedName || 'Direct Chat',
        description: createRoomDescription.trim() || null,
        roomType: createRoomType,
        memberIds: memberIds.length > 0 ? memberIds : undefined,
      });

      await refreshRooms();
      setSelectedRoomId(room.id);
      setCreateRoomName('');
      setCreateRoomDescription('');
      setCreateRoomMembers('');
      setCreateRoomType(1);
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to create room.'));
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (): Promise<void> => {
    if (!selectedRoomId) {
      return;
    }

    setError('');

    try {
      await joinChatRoom(selectedRoomId);
      if (hubClientRef.current) {
        await hubClientRef.current.joinRoom(selectedRoomId);
      }
      await refreshRooms();
      const room = await getChatRoomById(selectedRoomId);
      setSelectedRoom(room);
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to join room.'));
    }
  };

  const handleLeaveRoom = async (): Promise<void> => {
    if (!selectedRoomId) {
      return;
    }

    setError('');

    try {
      if (hubClientRef.current) {
        await hubClientRef.current.leaveRoom(selectedRoomId);
      }
      await leaveChatRoom(selectedRoomId);
      await refreshRooms();
      const room = await getChatRoomById(selectedRoomId);
      setSelectedRoom(room);
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to leave room.'));
    }
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');

    if (!selectedRoomId) {
      setError('Select a room first.');
      return;
    }

    const content = composeText.trim();
    if (!content) {
      return;
    }

    setIsSendingMessage(true);

    try {
      const nextMessage = await sendMessage({ chatRoomId: selectedRoomId, content, type: 1 });
      setComposeText('');
      setMessages((current) => mergeMessages(current, [nextMessage]));
      setMessageTotalCount((count) => Math.max(count, messages.length + 1));
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to send message.'));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleTypingChange = (nextValue: string): void => {
    setComposeText(nextValue);

    if (!selectedRoomId || !nextValue.trim()) {
      return;
    }

    const now = Date.now();
    if (now - lastTypingSignalAtRef.current < typingThrottleMs) {
      return;
    }

    lastTypingSignalAtRef.current = now;
    void hubClientRef.current?.sendTypingIndicator(selectedRoomId).catch(() => undefined);
  };

  const handleMarkAsRead = async (messageId: string): Promise<void> => {
    if (!selectedRoomId || !hubClientRef.current) {
      return;
    }

    setError('');

    try {
      await hubClientRef.current.markMessageAsRead(messageId, selectedRoomId);
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to mark message as read.'));
    }
  };

  const handleLoadOlder = async (): Promise<void> => {
    if (!selectedRoomId || !oldestMessageId) {
      return;
    }

    setIsLoadingOlder(true);
    setError('');

    try {
      const page = await getRoomMessages(selectedRoomId, {
        pageNumber: 1,
        pageSize: messagePageSize,
        beforeMessageId: oldestMessageId,
      });

      setMessages((current) => mergeMessages(current, normalizeMessages(page.items)));
      setMessageTotalCount(page.totalCount);
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to load older messages.'));
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');

    if (!selectedRoomId) {
      return;
    }

    const term = searchTerm.trim();
    if (!term) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    setIsRunningSearch(true);

    try {
      const page = await searchRoomMessages(selectedRoomId, term, 1, messagePageSize);
      setSearchResults(normalizeMessages(page.items));
      setIsSearchMode(true);
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to search messages.'));
    } finally {
      setIsRunningSearch(false);
    }
  };

  const handleClearSearch = (): void => {
    setSearchTerm('');
    setIsSearchMode(false);
    setSearchResults([]);
  };

  const handleStartEdit = (message: MessageDto): void => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleCancelEdit = (): void => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (messageId: string): Promise<void> => {
    const trimmedContent = editingContent.trim();
    if (!trimmedContent) {
      setError('Message content cannot be empty.');
      return;
    }

    setError('');

    try {
      const updatedMessage = await editMessage(messageId, trimmedContent);
      setMessages((current) => replaceMessage(current, updatedMessage));
      setSearchResults((current) => replaceMessage(current, updatedMessage));
      handleCancelEdit();
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to edit message.'));
    }
  };

  const handleDelete = async (messageId: string): Promise<void> => {
    setError('');

    try {
      await deleteMessage(messageId);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                isDeleted: true,
                content: '[deleted]',
              }
            : message,
        ),
      );
      setSearchResults((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                isDeleted: true,
                content: '[deleted]',
              }
            : message,
        ),
      );
    } catch (requestError) {
      setError(parseApiError(requestError, 'Unable to delete message.'));
    }
  };

  const roomTypeLabel = useMemo(() => {
    switch (selectedRoom?.type) {
      case 'Private':
        return 'Private';
      case 'Direct':
        return 'Direct';
      default:
        return 'Public';
    }
  }, [selectedRoom?.type]);

  return (
    <section className="chat-layout">
      <aside className="panel chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Rooms</h2>
          <button type="button" onClick={() => void refreshRooms()} disabled={isLoadingRooms}>
            {isLoadingRooms ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <ul className="room-list">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                className={room.id === selectedRoomId ? 'room-item active' : 'room-item'}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <strong>{room.name}</strong>
                <span>{room.type} - {room.memberCount} members</span>
              </button>
            </li>
          ))}
        </ul>

        <form className="room-create-form" onSubmit={handleCreateRoom}>
          <h3>Create Room</h3>

          <label htmlFor="createRoomName">Name</label>
          <input id="createRoomName" value={createRoomName} onChange={(event) => setCreateRoomName(event.target.value)} placeholder="general" />

          <label htmlFor="createRoomDescription">Description</label>
          <input
            id="createRoomDescription"
            value={createRoomDescription}
            onChange={(event) => setCreateRoomDescription(event.target.value)}
            placeholder="Room purpose"
          />

          <label htmlFor="createRoomType">Type</label>
          <select id="createRoomType" value={createRoomType} onChange={(event) => setCreateRoomType(Number(event.target.value) as RoomTypeValue)}>
            <option value={1}>Public</option>
            <option value={2}>Private</option>
            <option value={3}>Direct</option>
          </select>

          <label htmlFor="createRoomMembers">Member IDs (optional, comma-separated)</label>
          <input
            id="createRoomMembers"
            value={createRoomMembers}
            onChange={(event) => setCreateRoomMembers(event.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />

          <button type="submit" disabled={isCreatingRoom}>
            {isCreatingRoom ? 'Creating...' : 'Create'}
          </button>
        </form>
      </aside>

      <section className="panel chat-main">
        <header className="chat-main-header">
          <div>
            <h1>{selectedRoom?.name ?? 'Select a room'}</h1>
            {selectedRoom ? (
              <p>
                {roomTypeLabel} room - {selectedRoom.memberCount} members
              </p>
            ) : null}
          </div>
          <div className="chat-main-actions">
            <span className={`connection-badge ${hubState}`} role="status" aria-live="polite">
              {hubState}
            </span>
            <button type="button" onClick={() => void handleJoinRoom()} disabled={!selectedRoomId}>
              Join
            </button>
            <button type="button" onClick={() => void handleLeaveRoom()} disabled={!selectedRoomId}>
              Leave
            </button>
          </div>
        </header>

        <form className="chat-search" onSubmit={handleSearch}>
          <label htmlFor="chat-search-input" className="sr-only">
            Search messages
          </label>
          <input
            id="chat-search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search messages in this room"
            disabled={!selectedRoomId}
          />
          <button type="submit" disabled={!selectedRoomId || isRunningSearch}>
            {isRunningSearch ? 'Searching...' : 'Search'}
          </button>
          {isSearchMode ? (
            <button type="button" onClick={handleClearSearch}>
              Clear Search
            </button>
          ) : null}
        </form>

        {error ? (
          <p className="error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
        {isLoadingRoomState ? <p>Loading room state...</p> : null}
        {activeTypingUsers.length > 0 ? (
          <p className="typing-indicator" role="status" aria-live="polite">
            {activeTypingUsers.join(', ')} typing...
          </p>
        ) : null}

        {!isSearchMode && canLoadOlder ? (
          <button type="button" onClick={() => void handleLoadOlder()} disabled={isLoadingOlder} className="load-older-button">
            {isLoadingOlder ? 'Loading older...' : `Load Older (before ${oldestMessageId})`}
          </button>
        ) : null}

        <div className="message-list">
          {visibleMessages.map((message) => {
            const isOwnMessage = currentUser?.id === message.senderId;
            const isEditing = editingMessageId === message.id;
            const readByUsers = (messageReadBy[message.id] ?? []).map((userId) => (userId === currentUser?.id ? 'You' : userId));

            return (
              <article key={message.id} className="message-item">
                <header>
                  <strong>{isOwnMessage ? 'You' : message.senderId}</strong>
                  <span>{new Date(message.createdAtUtc).toLocaleString()}</span>
                </header>

                {isEditing ? (
                  <div className="message-edit-row">
                    <input value={editingContent} onChange={(event) => setEditingContent(event.target.value)} />
                    <button type="button" onClick={() => void handleSaveEdit(message.id)}>
                      Save
                    </button>
                    <button type="button" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className={message.isDeleted ? 'message-deleted' : ''}>{message.content}</p>
                )}

                {!isEditing && readByUsers.length > 0 ? <small className="message-read-by">Read by: {readByUsers.join(', ')}</small> : null}

                {!isEditing && !isOwnMessage && !message.isDeleted ? (
                  <div className="message-actions">
                    <button type="button" onClick={() => void handleMarkAsRead(message.id)}>
                      Mark Read
                    </button>
                  </div>
                ) : null}

                {!isEditing && isOwnMessage && !message.isDeleted ? (
                  <div className="message-actions">
                    <button type="button" onClick={() => handleStartEdit(message)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => void handleDelete(message.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}

          {visibleMessages.length === 0 && !isLoadingRoomState ? <p>No messages to display.</p> : null}
        </div>

        <form className="chat-compose" onSubmit={handleSendMessage}>
          <label htmlFor="chat-compose-input" className="sr-only">
            Write a message
          </label>
          <input
            id="chat-compose-input"
            value={composeText}
            onChange={(event) => handleTypingChange(event.target.value)}
            placeholder="Write a message"
            disabled={!selectedRoomId}
          />
          <button type="submit" disabled={!selectedRoomId || isSendingMessage}>
            {isSendingMessage ? 'Sending...' : 'Send'}
          </button>
        </form>

        <section className="realtime-events">
          <h3>Realtime Events</h3>
          <ul aria-live="polite" aria-atomic="false">
            {realtimeEvents.map((eventLine, index) => (
              <li key={`${eventLine}-${index}`}>{eventLine}</li>
            ))}
            {realtimeEvents.length === 0 ? <li>No events yet.</li> : null}
          </ul>
        </section>
      </section>
    </section>
  );
}
