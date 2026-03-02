import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { MessageDto } from '../../../shared/api/contracts';

export type ChatHubConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type ChatHubHandlers = {
  onReceiveMessage: (message: MessageDto) => void;
  onUserStatusChanged: (userId: string, status: string) => void;
  onUserJoinedRoom: (userId: string, roomId: string) => void;
  onUserLeftRoom: (userId: string, roomId: string) => void;
  onUserTyping: (userId: string, roomId: string) => void;
  onMessageRead: (messageId: string, userId: string) => void;
  onStateChange: (state: ChatHubConnectionState) => void;
};

type ChatHubClientConfig = {
  getAccessToken: () => string | null;
  handlers: ChatHubHandlers;
};

export type ChatHubClient = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  sendTypingIndicator: (roomId: string) => Promise<void>;
  markMessageAsRead: (messageId: string, roomId?: string) => Promise<void>;
  getState: () => ChatHubConnectionState;
};

const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const chatHubUrl = import.meta.env.VITE_HUB_CHAT_URL ?? `${defaultApiBaseUrl}/hubs/chat`;

function mapConnectionState(state: HubConnectionState): ChatHubConnectionState {
  switch (state) {
    case HubConnectionState.Connected:
      return 'connected';
    case HubConnectionState.Connecting:
      return 'connecting';
    case HubConnectionState.Reconnecting:
      return 'reconnecting';
    default:
      return 'disconnected';
  }
}

export function createChatHubClient(config: ChatHubClientConfig): ChatHubClient {
  const connection: HubConnection = new HubConnectionBuilder()
    .withUrl(chatHubUrl, {
      accessTokenFactory: () => config.getAccessToken() ?? '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build();

  const syncState = (): void => {
    config.handlers.onStateChange(mapConnectionState(connection.state));
  };

  connection.on('ReceiveMessage', config.handlers.onReceiveMessage);
  connection.on('UserStatusChanged', config.handlers.onUserStatusChanged);
  connection.on('UserJoinedRoom', config.handlers.onUserJoinedRoom);
  connection.on('UserLeftRoom', config.handlers.onUserLeftRoom);
  connection.on('UserTyping', config.handlers.onUserTyping);
  connection.on('MessageRead', config.handlers.onMessageRead);

  connection.onreconnecting(() => {
    config.handlers.onStateChange('reconnecting');
  });

  connection.onreconnected(() => {
    config.handlers.onStateChange('connected');
  });

  connection.onclose(() => {
    config.handlers.onStateChange('disconnected');
  });

  const ensureStarted = async (): Promise<void> => {
    if (connection.state === HubConnectionState.Connected || connection.state === HubConnectionState.Connecting || connection.state === HubConnectionState.Reconnecting) {
      syncState();
      return;
    }

    config.handlers.onStateChange('connecting');
    await connection.start();
    config.handlers.onStateChange('connected');
  };

  const invokeIfConnected = async (methodName: string, ...args: unknown[]): Promise<void> => {
    if (connection.state !== HubConnectionState.Connected) {
      await ensureStarted();
    }

    await connection.invoke(methodName, ...args);
  };

  return {
    start: ensureStarted,
    stop: async () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        await connection.stop();
      }
      config.handlers.onStateChange('disconnected');
    },
    joinRoom: async (roomId: string) => {
      await invokeIfConnected('JoinRoom', roomId);
    },
    leaveRoom: async (roomId: string) => {
      await invokeIfConnected('LeaveRoom', roomId);
    },
    sendTypingIndicator: async (roomId: string) => {
      await invokeIfConnected('SendTypingIndicator', roomId);
    },
    markMessageAsRead: async (messageId: string, roomId?: string) => {
      if (roomId) {
        await invokeIfConnected('MarkMessageAsRead', messageId, roomId);
        return;
      }

      await invokeIfConnected('MarkMessageAsRead', messageId);
    },
    getState: () => mapConnectionState(connection.state),
  };
}
