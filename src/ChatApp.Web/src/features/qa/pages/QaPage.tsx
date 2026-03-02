
import { useEffect, useMemo, useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import type { JSX } from 'react';
import { getStoredTokens } from '../../auth/api/tokenStorage';
import type { ApiResult, AuthResponseDto, MessageDto } from '../../../shared/api/contracts';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type HubName = 'chat' | 'notifications';
type HubConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type SessionId = 'A' | 'B' | 'C';

type ApiResponseInfo = {
  status: number;
  durationMs: number;
  body: string;
};

type HubInvokeResult = {
  ok: boolean;
  durationMs: number;
  result: string;
};

type QaLogType = 'api-request' | 'api-response' | 'api-error' | 'hub-invoke' | 'hub-error' | 'hub-event' | 'hub-state' | 'scenario';

type QaLogEntry = {
  id: number;
  timestamp: string;
  type: QaLogType;
  scope: 'api' | 'hub' | 'event' | 'session' | 'scenario';
  title: string;
  details: string;
};

type SessionEventEntry = {
  id: number;
  timestamp: string;
  title: string;
  details: string;
};

type SessionState = {
  id: SessionId;
  emailOrUsername: string;
  password: string;
  accessToken: string | null;
  refreshToken: string | null;
  userLabel: string;
  isLoggingIn: boolean;
  hubState: HubConnectionStatus;
  error: string;
  events: SessionEventEntry[];
};

type LoadTestResult = {
  total: number;
  success: number;
  failed: number;
  status429: number;
  averageMs: number;
  p95Ms: number;
  startedAt: string;
  finishedAt: string;
};

type RetryAttempt = {
  attempt: number;
  status: number | null;
  durationMs: number;
  backoffMs: number;
  note: string;
};

const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const chatHubUrl = import.meta.env.VITE_HUB_CHAT_URL ?? `${defaultApiBaseUrl}/hubs/chat`;
const notificationHubUrl = import.meta.env.VITE_HUB_NOTIFICATION_URL ?? `${defaultApiBaseUrl}/hubs/notifications`;
const logLimit = 500;
const sessionEventLimit = 80;
const sessionIds: SessionId[] = ['A', 'B', 'C'];
const sensitiveKeyPattern = /(authorization|password|secret|cookie|token)/i;
const bearerPattern = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const jwtPattern = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

const hubMethodOptions: Record<HubName, string[]> = {
  chat: ['JoinRoom', 'LeaveRoom', 'SendTypingIndicator', 'MarkMessageAsRead'],
  notifications: ['JoinNotifications'],
};

const chatHubEvents = ['ReceiveMessage', 'UserStatusChanged', 'UserJoinedRoom', 'UserLeftRoom', 'UserTyping', 'MessageRead'] as const;

function getHubUrl(hubName: HubName): string {
  return hubName === 'chat' ? chatHubUrl : notificationHubUrl;
}

function mapHubConnectionStatus(state: HubConnectionState): HubConnectionStatus {
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

function redactSensitiveText(value: string): string {
  return value.replace(bearerPattern, 'Bearer [REDACTED]').replace(jwtPattern, '[REDACTED_JWT]');
}

function sanitizeForLogs(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogs(item, seen));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message),
    };
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);
    const sanitized: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      if (sensitiveKeyPattern.test(key)) {
        sanitized[key] = '[REDACTED]';
        return;
      }

      sanitized[key] = sanitizeForLogs(nestedValue, seen);
    });

    return sanitized;
  }

  return redactSensitiveText(String(value));
}

function pretty(value: unknown): string {
  const sanitized = sanitizeForLogs(value);
  if (typeof sanitized === 'string') {
    return sanitized;
  }

  try {
    return JSON.stringify(sanitized, null, 2);
  } catch {
    return redactSensitiveText(String(sanitized));
  }
}

function resolveRequestUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    throw new Error('URL is required.');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (!trimmed.startsWith('/')) {
    return `${defaultApiBaseUrl}/${trimmed}`;
  }

  return `${defaultApiBaseUrl}${trimmed}`;
}

function emptySession(id: SessionId): SessionState {
  return {
    id,
    emailOrUsername: '',
    password: '',
    accessToken: null,
    refreshToken: null,
    userLabel: 'not authenticated',
    isLoggingIn: false,
    hubState: 'disconnected',
    error: '',
    events: [],
  };
}

function createInitialSessions(): Record<SessionId, SessionState> {
  return {
    A: emptySession('A'),
    B: emptySession('B'),
    C: emptySession('C'),
  };
}

function calculateP95(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
}

function summarizeLoadResult(
  startedAtIso: string,
  durations: number[],
  statuses: number[],
  successFlags: boolean[],
): LoadTestResult {
  const total = durations.length;
  const success = successFlags.filter(Boolean).length;
  const failed = total - success;
  const status429 = statuses.filter((status) => status === 429).length;
  const averageMs = total === 0 ? 0 : Math.round(durations.reduce((sum, value) => sum + value, 0) / total);
  const p95Ms = Math.round(calculateP95(durations));

  return {
    total,
    success,
    failed,
    status429,
    averageMs,
    p95Ms,
    startedAt: startedAtIso,
    finishedAt: new Date().toISOString(),
  };
}

export function QaPage() {
  const [apiMethod, setApiMethod] = useState<HttpMethod>('GET');
  const [apiUrl, setApiUrl] = useState<string>('/api/auth/me');
  const [apiHeadersJson, setApiHeadersJson] = useState<string>('{}');
  const [apiBodyJson, setApiBodyJson] = useState<string>('');
  const [includeAuthHeader, setIncludeAuthHeader] = useState<boolean>(true);
  const [apiIsLoading, setApiIsLoading] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<ApiResponseInfo | null>(null);
  const [apiError, setApiError] = useState<string>('');

  const [selectedHub, setSelectedHub] = useState<HubName>('chat');
  const [selectedHubMethod, setSelectedHubMethod] = useState<string>(hubMethodOptions.chat[0]);
  const [hubArgsJson, setHubArgsJson] = useState<string>('[]');
  const [hubInvokeResult, setHubInvokeResult] = useState<HubInvokeResult | null>(null);
  const [hubError, setHubError] = useState<string>('');
  const [hubStatus, setHubStatus] = useState<Record<HubName, HubConnectionStatus>>({
    chat: 'disconnected',
    notifications: 'disconnected',
  });

  const [sessions, setSessions] = useState<Record<SessionId, SessionState>>(createInitialSessions());
  const [scenarioRoomId, setScenarioRoomId] = useState<string>('');
  const [scenarioMessage, setScenarioMessage] = useState<string>('Session A message');
  const [scenarioError, setScenarioError] = useState<string>('');
  const [scenarioResult, setScenarioResult] = useState<string>('');

  const [loadLabError, setLoadLabError] = useState<string>('');
  const [authBurstSessionId, setAuthBurstSessionId] = useState<SessionId>('A');
  const [authBurstCount, setAuthBurstCount] = useState<number>(20);
  const [authBurstConcurrency, setAuthBurstConcurrency] = useState<number>(5);
  const [authBurstRunning, setAuthBurstRunning] = useState<boolean>(false);
  const [authBurstResult, setAuthBurstResult] = useState<LoadTestResult | null>(null);

  const [apiLoadSessionId, setApiLoadSessionId] = useState<SessionId>('A');
  const [apiLoadMethod, setApiLoadMethod] = useState<HttpMethod>('GET');
  const [apiLoadUrl, setApiLoadUrl] = useState<string>('/api/auth/me');
  const [apiLoadBodyJson, setApiLoadBodyJson] = useState<string>('');
  const [apiLoadTotalRequests, setApiLoadTotalRequests] = useState<number>(50);
  const [apiLoadConcurrency, setApiLoadConcurrency] = useState<number>(10);
  const [apiLoadRunning, setApiLoadRunning] = useState<boolean>(false);
  const [apiLoadResult, setApiLoadResult] = useState<LoadTestResult | null>(null);

  const [hubFloodSessionId, setHubFloodSessionId] = useState<SessionId>('A');
  const [hubFloodMethod, setHubFloodMethod] = useState<string>('SendTypingIndicator');
  const [hubFloodArgsJson, setHubFloodArgsJson] = useState<string>('[]');
  const [hubFloodTotalInvokes, setHubFloodTotalInvokes] = useState<number>(120);
  const [hubFloodConcurrency, setHubFloodConcurrency] = useState<number>(20);
  const [hubFloodRunning, setHubFloodRunning] = useState<boolean>(false);
  const [hubFloodResult, setHubFloodResult] = useState<LoadTestResult | null>(null);

  const [retrySessionId, setRetrySessionId] = useState<SessionId>('A');
  const [retryMethod, setRetryMethod] = useState<HttpMethod>('GET');
  const [retryUrl, setRetryUrl] = useState<string>('/api/auth/me');
  const [retryBodyJson, setRetryBodyJson] = useState<string>('');
  const [retryMaxRetries, setRetryMaxRetries] = useState<number>(3);
  const [retryBaseDelayMs, setRetryBaseDelayMs] = useState<number>(300);
  const [retryUseJitter, setRetryUseJitter] = useState<boolean>(true);
  const [retryRunning, setRetryRunning] = useState<boolean>(false);
  const [retryResultSummary, setRetryResultSummary] = useState<string>('');
  const [retryAttempts, setRetryAttempts] = useState<RetryAttempt[]>([]);

  const [qaLogs, setQaLogs] = useState<QaLogEntry[]>([]);
  const logIdRef = useRef<number>(1);
  const connectionsRef = useRef<Partial<Record<HubName, HubConnection>>>({});
  const sessionConnectionsRef = useRef<Partial<Record<SessionId, HubConnection>>>({});
  const sessionAuthRef = useRef<Record<SessionId, { accessToken: string | null; refreshToken: string | null }>>({
    A: { accessToken: null, refreshToken: null },
    B: { accessToken: null, refreshToken: null },
    C: { accessToken: null, refreshToken: null },
  });

  const pushLog = (entry: Omit<QaLogEntry, 'id' | 'timestamp'>): void => {
    const nextEntry: QaLogEntry = {
      ...entry,
      title: redactSensitiveText(entry.title),
      details: pretty(entry.details),
      id: logIdRef.current++,
      timestamp: new Date().toISOString(),
    };

    setQaLogs((current) => [nextEntry, ...current].slice(0, logLimit));
  };

  const updateSession = (sessionId: SessionId, mutate: (current: SessionState) => SessionState): void => {
    setSessions((current) => ({
      ...current,
      [sessionId]: mutate(current[sessionId]),
    }));
  };

  const pushSessionEvent = (sessionId: SessionId, title: string, details: unknown): void => {
    const nextEvent: SessionEventEntry = {
      id: logIdRef.current++,
      timestamp: new Date().toISOString(),
      title,
      details: pretty(details),
    };

    updateSession(sessionId, (current) => ({
      ...current,
      events: [nextEvent, ...current.events].slice(0, sessionEventLimit),
    }));

    pushLog({
      type: 'hub-event',
      scope: 'event',
      title: `Session ${sessionId}: ${title}`,
      details: nextEvent.details,
    });
  };

  const eventLogs = useMemo(() => qaLogs.filter((entry) => entry.scope === 'event'), [qaLogs]);

  const getSessionAccessToken = (sessionId: SessionId): string | null => {
    const sessionToken = sessionAuthRef.current[sessionId].accessToken;
    if (sessionToken) {
      return sessionToken;
    }

    return sessions[sessionId].accessToken;
  };

  const runConcurrentTasks = async (
    total: number,
    concurrency: number,
    worker: (index: number) => Promise<{ durationMs: number; status: number; ok: boolean }>,
  ): Promise<LoadTestResult> => {
    const startedAtIso = new Date().toISOString();
    const safeTotal = Math.max(1, Math.floor(total));
    const safeConcurrency = Math.max(1, Math.min(safeTotal, Math.floor(concurrency)));

    const durations: number[] = [];
    const statuses: number[] = [];
    const successFlags: boolean[] = [];
    let cursor = 0;

    const runner = async (): Promise<void> => {
      while (cursor < safeTotal) {
        const index = cursor;
        cursor += 1;

        try {
          const result = await worker(index);
          durations.push(result.durationMs);
          statuses.push(result.status);
          successFlags.push(result.ok);
        } catch (workerError) {
          const message = workerError instanceof Error ? workerError.message : 'Worker error';
          pushLog({
            type: 'api-error',
            scope: 'scenario',
            title: 'Load worker failed',
            details: message,
          });
          durations.push(0);
          statuses.push(0);
          successFlags.push(false);
        }
      }
    };

    await Promise.all(Array.from({ length: safeConcurrency }, () => runner()));
    return summarizeLoadResult(startedAtIso, durations, statuses, successFlags);
  };
  const ensureHubConnection = async (hubName: HubName): Promise<HubConnection> => {
    const existing = connectionsRef.current[hubName];
    if (existing) {
      return existing;
    }

    const nextConnection = new HubConnectionBuilder()
      .withUrl(getHubUrl(hubName), {
        accessTokenFactory: () => getStoredTokens()?.accessToken ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    const setState = (state: HubConnectionStatus): void => {
      setHubStatus((current) => ({ ...current, [hubName]: state }));
      pushLog({
        type: 'hub-state',
        scope: 'hub',
        title: `${hubName} hub ${state}`,
        details: `Hub state changed to ${state}`,
      });
    };

    nextConnection.onreconnecting(() => setState('reconnecting'));
    nextConnection.onreconnected(() => setState('connected'));
    nextConnection.onclose(() => setState('disconnected'));

    if (hubName === 'chat') {
      chatHubEvents.forEach((eventName) => {
        nextConnection.on(eventName, (...payload: unknown[]) => {
          pushLog({
            type: 'hub-event',
            scope: 'event',
            title: `${hubName}.${eventName}`,
            details: pretty(payload.length === 1 ? payload[0] : payload),
          });
        });
      });
    }

    connectionsRef.current[hubName] = nextConnection;
    return nextConnection;
  };

  const ensureSessionHubConnection = async (sessionId: SessionId): Promise<HubConnection> => {
    const existing = sessionConnectionsRef.current[sessionId];
    if (existing) {
      return existing;
    }

    const nextConnection = new HubConnectionBuilder()
      .withUrl(chatHubUrl, {
        accessTokenFactory: () => sessionAuthRef.current[sessionId].accessToken ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    const setState = (state: HubConnectionStatus): void => {
      updateSession(sessionId, (current) => ({ ...current, hubState: state }));
      pushLog({
        type: 'hub-state',
        scope: 'session',
        title: `Session ${sessionId} hub ${state}`,
        details: `Session ${sessionId} chat hub state changed to ${state}`,
      });
    };

    nextConnection.onreconnecting(() => setState('reconnecting'));
    nextConnection.onreconnected(() => setState('connected'));
    nextConnection.onclose(() => setState('disconnected'));

    chatHubEvents.forEach((eventName) => {
      nextConnection.on(eventName, (...payload: unknown[]) => {
        pushSessionEvent(sessionId, eventName, payload.length === 1 ? payload[0] : payload);
      });
    });

    sessionConnectionsRef.current[sessionId] = nextConnection;
    return nextConnection;
  };

  const handleConnectHub = async (hubName: HubName): Promise<void> => {
    setHubError('');

    try {
      const connection = await ensureHubConnection(hubName);
      if (connection.state === HubConnectionState.Connected || connection.state === HubConnectionState.Connecting || connection.state === HubConnectionState.Reconnecting) {
        setHubStatus((current) => ({ ...current, [hubName]: mapHubConnectionStatus(connection.state) }));
        return;
      }

      setHubStatus((current) => ({ ...current, [hubName]: 'connecting' }));
      const startedAt = performance.now();
      await connection.start();
      const durationMs = Math.round(performance.now() - startedAt);
      setHubStatus((current) => ({ ...current, [hubName]: 'connected' }));

      pushLog({
        type: 'hub-state',
        scope: 'hub',
        title: `${hubName} hub connected`,
        details: `Connected in ${durationMs}ms`,
      });
    } catch (connectionError) {
      const message = connectionError instanceof Error ? connectionError.message : 'Hub connection failed.';
      setHubError(message);
      setHubStatus((current) => ({ ...current, [hubName]: 'disconnected' }));
      pushLog({
        type: 'hub-error',
        scope: 'hub',
        title: `${hubName} connect failed`,
        details: message,
      });
    }
  };

  const handleDisconnectHub = async (hubName: HubName): Promise<void> => {
    const connection = connectionsRef.current[hubName];
    if (!connection || connection.state === HubConnectionState.Disconnected) {
      setHubStatus((current) => ({ ...current, [hubName]: 'disconnected' }));
      return;
    }

    await connection.stop();
    setHubStatus((current) => ({ ...current, [hubName]: 'disconnected' }));
  };

  const handleSessionConnectHub = async (sessionId: SessionId): Promise<HubConnection> => {
    updateSession(sessionId, (current) => ({ ...current, error: '' }));

    const accessToken = sessionAuthRef.current[sessionId].accessToken;
    if (!accessToken) {
      const errorText = 'Login required before hub connect.';
      updateSession(sessionId, (current) => ({ ...current, error: errorText }));
      throw new Error(errorText);
    }

    const connection = await ensureSessionHubConnection(sessionId);
    if (connection.state === HubConnectionState.Connected || connection.state === HubConnectionState.Connecting || connection.state === HubConnectionState.Reconnecting) {
      updateSession(sessionId, (current) => ({ ...current, hubState: mapHubConnectionStatus(connection.state) }));
      return connection;
    }

    updateSession(sessionId, (current) => ({ ...current, hubState: 'connecting' }));

    try {
      const startedAt = performance.now();
      await connection.start();
      const durationMs = Math.round(performance.now() - startedAt);
      updateSession(sessionId, (current) => ({ ...current, hubState: 'connected' }));
      pushLog({
        type: 'hub-state',
        scope: 'session',
        title: `Session ${sessionId} connected`,
        details: `Connected in ${durationMs}ms`,
      });
      return connection;
    } catch (connectionError) {
      const message = connectionError instanceof Error ? connectionError.message : 'Session hub connect failed.';
      updateSession(sessionId, (current) => ({ ...current, hubState: 'disconnected', error: message }));
      pushLog({
        type: 'hub-error',
        scope: 'session',
        title: `Session ${sessionId} connect failed`,
        details: message,
      });
      throw new Error(message);
    }
  };

  const handleSessionDisconnectHub = async (sessionId: SessionId): Promise<void> => {
    const connection = sessionConnectionsRef.current[sessionId];
    if (!connection || connection.state === HubConnectionState.Disconnected) {
      updateSession(sessionId, (current) => ({ ...current, hubState: 'disconnected' }));
      return;
    }

    await connection.stop();
    updateSession(sessionId, (current) => ({ ...current, hubState: 'disconnected' }));
  };
  const handleSessionLogin = async (sessionId: SessionId): Promise<void> => {
    const session = sessions[sessionId];
    if (!session.emailOrUsername.trim() || !session.password.trim()) {
      updateSession(sessionId, (current) => ({ ...current, error: 'Email/username and password are required.' }));
      return;
    }

    updateSession(sessionId, (current) => ({ ...current, isLoggingIn: true, error: '' }));

    try {
      const startedAt = performance.now();
      const response = await axios.post<ApiResult<AuthResponseDto>>(`${defaultApiBaseUrl}/api/auth/login`, {
        emailOrUsername: session.emailOrUsername.trim(),
        password: session.password,
      });

      if (!response.data.isSuccess || !response.data.value) {
        throw new Error(response.data.error ?? 'Session login failed.');
      }

      const value = response.data.value;
      const durationMs = Math.round(performance.now() - startedAt);
      sessionAuthRef.current[sessionId] = {
        accessToken: value.accessToken,
        refreshToken: value.refreshToken,
      };

      updateSession(sessionId, (current) => ({
        ...current,
        accessToken: value.accessToken,
        refreshToken: value.refreshToken,
        userLabel: `${value.displayName} (@${value.username})`,
        isLoggingIn: false,
        error: '',
      }));

      pushLog({
        type: 'api-response',
        scope: 'session',
        title: `Session ${sessionId} login success`,
        details: `user=${value.username}, duration=${durationMs}ms`,
      });
    } catch (loginError) {
      const message =
        loginError instanceof AxiosError
          ? loginError.message
          : loginError instanceof Error
            ? loginError.message
            : 'Session login failed.';

      updateSession(sessionId, (current) => ({
        ...current,
        isLoggingIn: false,
        error: message,
      }));

      pushLog({
        type: 'api-error',
        scope: 'session',
        title: `Session ${sessionId} login failed`,
        details: message,
      });
    }
  };

  const handleSessionReset = async (sessionId: SessionId): Promise<void> => {
    await handleSessionDisconnectHub(sessionId);
    sessionAuthRef.current[sessionId] = {
      accessToken: null,
      refreshToken: null,
    };
    updateSession(sessionId, () => emptySession(sessionId));
  };

  const getConnectedSessionHub = async (sessionId: SessionId): Promise<HubConnection> => {
    const connection = await handleSessionConnectHub(sessionId);
    if (connection.state !== HubConnectionState.Connected) {
      throw new Error(`Session ${sessionId} is not connected.`);
    }
    return connection;
  };

  const handleScenarioMessageTyping = async (): Promise<void> => {
    setScenarioError('');
    setScenarioResult('');

    const roomId = scenarioRoomId.trim();
    if (!roomId) {
      setScenarioError('Room ID is required for scenarios.');
      return;
    }

    const tokenA = sessionAuthRef.current.A.accessToken;
    if (!tokenA) {
      setScenarioError('Session A must be logged in.');
      return;
    }

    try {
      const connectionB = await getConnectedSessionHub('B');

      const startedAt = performance.now();
      const sendResponse = await axios.post<ApiResult<MessageDto>>(
        `${defaultApiBaseUrl}/api/messages`,
        {
          chatRoomId: roomId,
          content: scenarioMessage.trim() || 'Session A message',
          type: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenA}`,
          },
        },
      );

      if (!sendResponse.data.isSuccess || !sendResponse.data.value) {
        throw new Error(sendResponse.data.error ?? 'Session A message send failed.');
      }

      await connectionB.invoke('SendTypingIndicator', roomId);
      const durationMs = Math.round(performance.now() - startedAt);
      const messageId = sendResponse.data.value.id;
      const resultText = `Scenario completed in ${durationMs}ms (messageId=${messageId}).`;

      setScenarioResult(resultText);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'Scenario: A sends message, B typing',
        details: pretty({ roomId, messageId, durationMs }),
      });
    } catch (scenarioActionError) {
      const message = scenarioActionError instanceof Error ? scenarioActionError.message : 'Scenario failed.';
      setScenarioError(message);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'Scenario failed',
        details: message,
      });
    }
  };

  const handleScenarioJoinLeave = async (): Promise<void> => {
    setScenarioError('');
    setScenarioResult('');

    const roomId = scenarioRoomId.trim();
    if (!roomId) {
      setScenarioError('Room ID is required for scenarios.');
      return;
    }

    try {
      const connectionA = await getConnectedSessionHub('A');
      const connectionB = await getConnectedSessionHub('B');

      const startedAt = performance.now();
      await connectionA.invoke('JoinRoom', roomId);
      await connectionB.invoke('LeaveRoom', roomId);
      const durationMs = Math.round(performance.now() - startedAt);
      const resultText = `Scenario completed in ${durationMs}ms.`;

      setScenarioResult(resultText);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'Scenario: A joins room, B leaves room',
        details: pretty({ roomId, durationMs }),
      });
    } catch (scenarioActionError) {
      const message = scenarioActionError instanceof Error ? scenarioActionError.message : 'Scenario failed.';
      setScenarioError(message);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'Scenario failed',
        details: message,
      });
    }
  };

  const handleRunAuthBurstTest = async (): Promise<void> => {
    setLoadLabError('');
    setAuthBurstResult(null);

    const session = sessions[authBurstSessionId];
    if (!session.emailOrUsername.trim() || !session.password.trim()) {
      setLoadLabError(`Session ${authBurstSessionId} credentials are required for auth burst test.`);
      return;
    }

    setAuthBurstRunning(true);

    try {
      const result = await runConcurrentTasks(authBurstCount, authBurstConcurrency, async () => {
        const startedAt = performance.now();
        const response = await fetch(`${defaultApiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailOrUsername: session.emailOrUsername.trim(),
            password: session.password,
          }),
        });

        let ok = response.ok;
        try {
          const payload = (await response.json()) as { isSuccess?: boolean };
          ok = response.ok && payload.isSuccess !== false;
        } catch {
          ok = response.ok;
        }

        return {
          durationMs: Math.round(performance.now() - startedAt),
          status: response.status,
          ok,
        };
      });

      setAuthBurstResult(result);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'Auth burst test finished',
        details: pretty({ session: authBurstSessionId, ...result }),
      });
    } catch (burstError) {
      const message = burstError instanceof Error ? burstError.message : 'Auth burst test failed.';
      setLoadLabError(message);
    } finally {
      setAuthBurstRunning(false);
    }
  };

  const handleRunApiLoadTest = async (): Promise<void> => {
    setLoadLabError('');
    setApiLoadResult(null);

    setApiLoadRunning(true);

    try {
      const resolvedUrl = resolveRequestUrl(apiLoadUrl);
      const token = getSessionAccessToken(apiLoadSessionId) ?? getStoredTokens()?.accessToken ?? null;
      const parsedBody =
        apiLoadMethod !== 'GET' && apiLoadBodyJson.trim()
          ? JSON.parse(apiLoadBodyJson)
          : undefined;

      const result = await runConcurrentTasks(apiLoadTotalRequests, apiLoadConcurrency, async () => {
        const startedAt = performance.now();
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        if (parsedBody !== undefined) {
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(resolvedUrl, {
          method: apiLoadMethod,
          headers,
          body: parsedBody !== undefined ? JSON.stringify(parsedBody) : undefined,
        });

        return {
          durationMs: Math.round(performance.now() - startedAt),
          status: response.status,
          ok: response.status >= 200 && response.status < 400,
        };
      });

      setApiLoadResult(result);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'API load test finished',
        details: pretty({ session: apiLoadSessionId, method: apiLoadMethod, url: resolvedUrl, ...result }),
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'API load test failed.';
      setLoadLabError(message);
    } finally {
      setApiLoadRunning(false);
    }
  };

  const handleRunHubFloodTest = async (): Promise<void> => {
    setLoadLabError('');
    setHubFloodResult(null);
    setHubFloodRunning(true);

    try {
      let parsedArgs: unknown = [];
      if (hubFloodArgsJson.trim()) {
        parsedArgs = JSON.parse(hubFloodArgsJson);
      }
      const args = Array.isArray(parsedArgs) ? parsedArgs : [parsedArgs];
      const connection = await getConnectedSessionHub(hubFloodSessionId);

      const result = await runConcurrentTasks(hubFloodTotalInvokes, hubFloodConcurrency, async () => {
        const startedAt = performance.now();
        try {
          await connection.invoke(hubFloodMethod, ...args);
          return {
            durationMs: Math.round(performance.now() - startedAt),
            status: 200,
            ok: true,
          };
        } catch (invokeError) {
          const message = invokeError instanceof Error ? invokeError.message.toLowerCase() : '';
          const status = message.includes('rate limit') || message.includes('429') ? 429 : 500;
          return {
            durationMs: Math.round(performance.now() - startedAt),
            status,
            ok: false,
          };
        }
      });

      setHubFloodResult(result);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'Hub flood test finished',
        details: pretty({ session: hubFloodSessionId, method: hubFloodMethod, args, ...result }),
      });
    } catch (floodError) {
      const message = floodError instanceof Error ? floodError.message : 'Hub flood test failed.';
      setLoadLabError(message);
    } finally {
      setHubFloodRunning(false);
    }
  };

  const handleRunRetryBackoffTest = async (): Promise<void> => {
    setLoadLabError('');
    setRetryResultSummary('');
    setRetryAttempts([]);
    setRetryRunning(true);

    const token = getSessionAccessToken(retrySessionId) ?? getStoredTokens()?.accessToken ?? null;

    try {
      const resolvedUrl = resolveRequestUrl(retryUrl);
      const parsedBody =
        retryMethod !== 'GET' && retryBodyJson.trim()
          ? JSON.parse(retryBodyJson)
          : undefined;

      const maxAttempts = Math.max(1, Math.floor(retryMaxRetries) + 1);
      const attempts: RetryAttempt[] = [];

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const startedAt = performance.now();
        try {
          const headers: Record<string, string> = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          if (parsedBody !== undefined) {
            headers['Content-Type'] = 'application/json';
          }

          const response = await fetch(resolvedUrl, {
            method: retryMethod,
            headers,
            body: parsedBody !== undefined ? JSON.stringify(parsedBody) : undefined,
          });

          const durationMs = Math.round(performance.now() - startedAt);
          const isSuccess = response.status >= 200 && response.status < 300;
          const canRetry = attempt < maxAttempts && (response.status === 429 || response.status >= 500);
          const backoffMs = canRetry
            ? Math.round(retryBaseDelayMs * 2 ** (attempt - 1) * (retryUseJitter ? 0.75 + Math.random() * 0.5 : 1))
            : 0;

          attempts.push({
            attempt,
            status: response.status,
            durationMs,
            backoffMs,
            note: isSuccess ? 'success' : canRetry ? 'retrying' : 'failed',
          });

          if (isSuccess) {
            setRetryResultSummary(`Completed successfully on attempt ${attempt}.`);
            break;
          }

          if (!canRetry) {
            setRetryResultSummary(`Stopped after attempt ${attempt} with status ${response.status}.`);
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        } catch (requestError) {
          const durationMs = Math.round(performance.now() - startedAt);
          const canRetry = attempt < maxAttempts;
          const backoffMs = canRetry
            ? Math.round(retryBaseDelayMs * 2 ** (attempt - 1) * (retryUseJitter ? 0.75 + Math.random() * 0.5 : 1))
            : 0;

          attempts.push({
            attempt,
            status: null,
            durationMs,
            backoffMs,
            note: canRetry ? 'network-error, retrying' : 'network-error, stopped',
          });

          if (!canRetry) {
            setRetryResultSummary(`Stopped after attempt ${attempt} due to network error.`);
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }

      setRetryAttempts(attempts);
      pushLog({
        type: 'scenario',
        scope: 'scenario',
        title: 'Retry/backoff test finished',
        details: pretty({
          method: retryMethod,
          url: retryUrl,
          attempts,
        }),
      });
    } catch (retryError) {
      const message = retryError instanceof Error ? retryError.message : 'Retry/backoff test failed.';
      setLoadLabError(message);
    } finally {
      setRetryRunning(false);
    }
  };

  useEffect(() => {
    setSelectedHubMethod(hubMethodOptions[selectedHub][0]);
  }, [selectedHub]);

  useEffect(() => {
    return () => {
      const connections = Object.values(connectionsRef.current).filter(Boolean) as HubConnection[];
      connections.forEach((connection) => {
        void connection.stop();
      });

      const sessionConnections = Object.values(sessionConnectionsRef.current).filter(Boolean) as HubConnection[];
      sessionConnections.forEach((connection) => {
        void connection.stop();
      });
    };
  }, []);

  const handleSendApiRequest = async (): Promise<void> => {
    setApiIsLoading(true);
    setApiError('');
    setApiResponse(null);

    try {
      const resolvedUrl = resolveRequestUrl(apiUrl);
      const customHeaders = JSON.parse(apiHeadersJson || '{}') as Record<string, string>;
      const headers: Record<string, string> = { ...customHeaders };

      const token = getStoredTokens()?.accessToken ?? null;
      if (includeAuthHeader && token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
      }

      let body: unknown = undefined;
      if (apiMethod !== 'GET' && apiBodyJson.trim()) {
        body = JSON.parse(apiBodyJson);
      }

      const startedAt = performance.now();

      pushLog({
        type: 'api-request',
        scope: 'api',
        title: `${apiMethod} ${resolvedUrl}`,
        details: pretty({ headers, body }),
      });

      const response = await axios.request({
        method: apiMethod,
        url: resolvedUrl,
        headers,
        data: body,
        validateStatus: () => true,
      });

      const durationMs = Math.round(performance.now() - startedAt);
      const responseBody = pretty(response.data);

      setApiResponse({
        status: response.status,
        durationMs,
        body: responseBody,
      });

      pushLog({
        type: 'api-response',
        scope: 'api',
        title: `${apiMethod} ${resolvedUrl} -> ${response.status}`,
        details: pretty({ durationMs, body: response.data }),
      });
    } catch (requestError) {
      const message =
        requestError instanceof AxiosError
          ? requestError.message
          : requestError instanceof Error
            ? requestError.message
            : 'API request failed.';

      setApiError(message);
      pushLog({
        type: 'api-error',
        scope: 'api',
        title: `${apiMethod} ${apiUrl} failed`,
        details: message,
      });
    } finally {
      setApiIsLoading(false);
    }
  };
  const handleInvokeHubMethod = async (): Promise<void> => {
    setHubError('');
    setHubInvokeResult(null);

    try {
      let parsedArgs: unknown = [];
      if (hubArgsJson.trim()) {
        parsedArgs = JSON.parse(hubArgsJson);
      }

      const args = Array.isArray(parsedArgs) ? parsedArgs : [parsedArgs];
      const connection = await ensureHubConnection(selectedHub);

      if (connection.state !== HubConnectionState.Connected) {
        await handleConnectHub(selectedHub);
      }

      const startedAt = performance.now();
      const result = await connection.invoke(selectedHubMethod, ...args);
      const durationMs = Math.round(performance.now() - startedAt);
      const resultText = result === undefined ? 'void' : pretty(result);

      setHubInvokeResult({
        ok: true,
        durationMs,
        result: resultText,
      });

      pushLog({
        type: 'hub-invoke',
        scope: 'hub',
        title: `${selectedHub}.${selectedHubMethod}`,
        details: pretty({ args, durationMs, result }),
      });
    } catch (invokeError) {
      const message = invokeError instanceof Error ? invokeError.message : 'Hub invoke failed.';
      setHubError(message);
      setHubInvokeResult({
        ok: false,
        durationMs: 0,
        result: message,
      });

      pushLog({
        type: 'hub-error',
        scope: 'hub',
        title: `${selectedHub}.${selectedHubMethod} failed`,
        details: message,
      });
    }
  };

  const handleExportLogs = (): void => {
    const payload = {
      exportedAt: new Date().toISOString(),
      total: qaLogs.length,
      logs: qaLogs,
      sessions: sessionIds.map((id) => ({
        id,
        userLabel: sessions[id].userLabel,
        hubState: sessions[id].hubState,
        events: sessions[id].events,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `qa-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const renderLoadResult = (result: LoadTestResult | null): JSX.Element | null => {
    if (!result) {
      return null;
    }

    return (
      <div className="qa-result">
        <p>
          Total: <strong>{result.total}</strong> | Success: <strong>{result.success}</strong> | Failed: <strong>{result.failed}</strong> | 429:{' '}
          <strong>{result.status429}</strong>
        </p>
        <p>
          Avg: <strong>{result.averageMs}ms</strong> | P95: <strong>{result.p95Ms}ms</strong>
        </p>
        <p>
          Started: <strong>{result.startedAt}</strong>
        </p>
        <p>
          Finished: <strong>{result.finishedAt}</strong>
        </p>
      </div>
    );
  };

  return (
    <section className="qa-layout">
      <section className="panel qa-panel">
        <h1>QA Console</h1>
        <p>Manual API, Hub and multi-session testing workspace.</p>

        <div className="qa-actions">
          <button type="button" onClick={handleExportLogs} disabled={qaLogs.length === 0}>
            Export Logs JSON
          </button>
          <button type="button" onClick={() => setQaLogs([])} disabled={qaLogs.length === 0}>
            Clear Logs
          </button>
        </div>
      </section>

      <section className="panel qa-panel">
        <h2>Session Manager (A/B/C)</h2>
        <p>Each session keeps independent auth token and chat hub state.</p>

        <div className="qa-grid qa-grid-scenarios">
          <label htmlFor="scenarioRoomId">Room ID</label>
          <input id="scenarioRoomId" value={scenarioRoomId} onChange={(event) => setScenarioRoomId(event.target.value)} placeholder="room-guid" />

          <label htmlFor="scenarioMessage">Scenario Message (A)</label>
          <input id="scenarioMessage" value={scenarioMessage} onChange={(event) => setScenarioMessage(event.target.value)} />

          <div className="qa-inline-actions">
            <button type="button" onClick={() => void handleScenarioMessageTyping()}>
              A sends message, B typing
            </button>
            <button type="button" onClick={() => void handleScenarioJoinLeave()}>
              A join room, B leave room
            </button>
          </div>
        </div>

        {scenarioError ? (
          <p className="error" role="alert" aria-live="assertive">
            {scenarioError}
          </p>
        ) : null}
        {scenarioResult ? <p>{scenarioResult}</p> : null}

        <div className="qa-session-grid">
          {sessionIds.map((sessionId) => {
            const session = sessions[sessionId];
            return (
              <article className="qa-session-card" key={sessionId}>
                <header>
                  <h3>Session {sessionId}</h3>
                  <span className={`connection-badge ${session.hubState}`}>{session.hubState}</span>
                </header>

                <p className="qa-session-user">{session.userLabel}</p>

                <label htmlFor={`session-${sessionId}-user`}>Email or Username</label>
                <input
                  id={`session-${sessionId}-user`}
                  value={session.emailOrUsername}
                  onChange={(event) => updateSession(sessionId, (current) => ({ ...current, emailOrUsername: event.target.value }))}
                  placeholder="user@example.com"
                />

                <label htmlFor={`session-${sessionId}-pass`}>Password</label>
                <input
                  id={`session-${sessionId}-pass`}
                  type="password"
                  value={session.password}
                  onChange={(event) => updateSession(sessionId, (current) => ({ ...current, password: event.target.value }))}
                  placeholder="password"
                />

                <div className="qa-inline-actions">
                  <button type="button" onClick={() => void handleSessionLogin(sessionId)} disabled={session.isLoggingIn}>
                    {session.isLoggingIn ? 'Logging in...' : 'Login'}
                  </button>
                  <button type="button" onClick={() => void handleSessionConnectHub(sessionId)}>
                    Connect Hub
                  </button>
                  <button type="button" onClick={() => void handleSessionDisconnectHub(sessionId)}>
                    Disconnect
                  </button>
                  <button type="button" onClick={() => void handleSessionReset(sessionId)}>
                    Reset
                  </button>
                </div>

                {session.error ? (
                  <p className="error" role="alert" aria-live="assertive">
                    {session.error}
                  </p>
                ) : null}

                <h4>Session Events</h4>
                <div className="qa-session-events">
                  {session.events.length === 0 ? <p>No events yet.</p> : null}
                  {session.events.map((entry) => (
                    <article key={entry.id} className="qa-log-item">
                      <header>
                        <strong>{entry.title}</strong>
                        <span>{entry.timestamp}</span>
                      </header>
                      <pre>{entry.details}</pre>
                    </article>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel qa-panel">
        <h2>Rate Limit, Load and Retry Lab</h2>
        <p>Run burst/concurrency tests and observe retry + backoff behavior.</p>

        {loadLabError ? (
          <p className="error" role="alert" aria-live="assertive">
            {loadLabError}
          </p>
        ) : null}

        <div className="qa-rate-grid">
          <article className="qa-rate-card">
            <h3>Auth Burst Test</h3>
            <label htmlFor="authBurstSession">Session</label>
            <select id="authBurstSession" value={authBurstSessionId} onChange={(event) => setAuthBurstSessionId(event.target.value as SessionId)}>
              {sessionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>

            <label htmlFor="authBurstCount">Requests</label>
            <input
              id="authBurstCount"
              type="number"
              min={1}
              value={authBurstCount}
              onChange={(event) => setAuthBurstCount(Math.max(1, Number(event.target.value) || 1))}
            />

            <label htmlFor="authBurstConcurrency">Concurrency</label>
            <input
              id="authBurstConcurrency"
              type="number"
              min={1}
              value={authBurstConcurrency}
              onChange={(event) => setAuthBurstConcurrency(Math.max(1, Number(event.target.value) || 1))}
            />

            <button type="button" onClick={() => void handleRunAuthBurstTest()} disabled={authBurstRunning}>
              {authBurstRunning ? 'Running...' : 'Run Auth Burst'}
            </button>
            {renderLoadResult(authBurstResult)}
          </article>

          <article className="qa-rate-card">
            <h3>API Concurrency Test</h3>
            <label htmlFor="apiLoadSession">Session Token</label>
            <select id="apiLoadSession" value={apiLoadSessionId} onChange={(event) => setApiLoadSessionId(event.target.value as SessionId)}>
              {sessionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>

            <label htmlFor="apiLoadMethod">Method</label>
            <select id="apiLoadMethod" value={apiLoadMethod} onChange={(event) => setApiLoadMethod(event.target.value as HttpMethod)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            <label htmlFor="apiLoadUrl">URL</label>
            <input id="apiLoadUrl" value={apiLoadUrl} onChange={(event) => setApiLoadUrl(event.target.value)} placeholder="/api/..." />

            <label htmlFor="apiLoadBody">Body (JSON)</label>
            <textarea id="apiLoadBody" value={apiLoadBodyJson} onChange={(event) => setApiLoadBodyJson(event.target.value)} className="qa-textarea" rows={4} />

            <label htmlFor="apiLoadTotal">Total Requests</label>
            <input
              id="apiLoadTotal"
              type="number"
              min={1}
              value={apiLoadTotalRequests}
              onChange={(event) => setApiLoadTotalRequests(Math.max(1, Number(event.target.value) || 1))}
            />

            <label htmlFor="apiLoadConcurrency">Concurrency</label>
            <input
              id="apiLoadConcurrency"
              type="number"
              min={1}
              value={apiLoadConcurrency}
              onChange={(event) => setApiLoadConcurrency(Math.max(1, Number(event.target.value) || 1))}
            />

            <button type="button" onClick={() => void handleRunApiLoadTest()} disabled={apiLoadRunning}>
              {apiLoadRunning ? 'Running...' : 'Run API Load'}
            </button>
            {renderLoadResult(apiLoadResult)}
          </article>

          <article className="qa-rate-card">
            <h3>Hub Flood Test</h3>
            <label htmlFor="hubFloodSession">Session</label>
            <select id="hubFloodSession" value={hubFloodSessionId} onChange={(event) => setHubFloodSessionId(event.target.value as SessionId)}>
              {sessionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>

            <label htmlFor="hubFloodMethod">Method</label>
            <select id="hubFloodMethod" value={hubFloodMethod} onChange={(event) => setHubFloodMethod(event.target.value)}>
              <option value="SendTypingIndicator">SendTypingIndicator</option>
              <option value="MarkMessageAsRead">MarkMessageAsRead</option>
              <option value="JoinRoom">JoinRoom</option>
              <option value="LeaveRoom">LeaveRoom</option>
            </select>

            <label htmlFor="hubFloodArgs">Args (JSON array)</label>
            <textarea id="hubFloodArgs" value={hubFloodArgsJson} onChange={(event) => setHubFloodArgsJson(event.target.value)} className="qa-textarea" rows={4} />

            <label htmlFor="hubFloodTotal">Total Invokes</label>
            <input
              id="hubFloodTotal"
              type="number"
              min={1}
              value={hubFloodTotalInvokes}
              onChange={(event) => setHubFloodTotalInvokes(Math.max(1, Number(event.target.value) || 1))}
            />

            <label htmlFor="hubFloodConcurrency">Concurrency</label>
            <input
              id="hubFloodConcurrency"
              type="number"
              min={1}
              value={hubFloodConcurrency}
              onChange={(event) => setHubFloodConcurrency(Math.max(1, Number(event.target.value) || 1))}
            />

            <button type="button" onClick={() => void handleRunHubFloodTest()} disabled={hubFloodRunning}>
              {hubFloodRunning ? 'Running...' : 'Run Hub Flood'}
            </button>
            {renderLoadResult(hubFloodResult)}
          </article>
        </div>

        <article className="qa-retry-card">
          <h3>Retry + Backoff Panel</h3>
          <div className="qa-grid qa-grid-retry">
            <label htmlFor="retrySession">Session Token</label>
            <select id="retrySession" value={retrySessionId} onChange={(event) => setRetrySessionId(event.target.value as SessionId)}>
              {sessionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>

            <label htmlFor="retryMethod">Method</label>
            <select id="retryMethod" value={retryMethod} onChange={(event) => setRetryMethod(event.target.value as HttpMethod)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            <label htmlFor="retryUrl">URL</label>
            <input id="retryUrl" value={retryUrl} onChange={(event) => setRetryUrl(event.target.value)} placeholder="/api/..." />

            <label htmlFor="retryBody">Body (JSON)</label>
            <textarea id="retryBody" value={retryBodyJson} onChange={(event) => setRetryBodyJson(event.target.value)} className="qa-textarea" rows={4} />

            <label htmlFor="retryMaxRetries">Max Retries</label>
            <input
              id="retryMaxRetries"
              type="number"
              min={0}
              value={retryMaxRetries}
              onChange={(event) => setRetryMaxRetries(Math.max(0, Number(event.target.value) || 0))}
            />

            <label htmlFor="retryBaseDelay">Base Delay (ms)</label>
            <input
              id="retryBaseDelay"
              type="number"
              min={50}
              value={retryBaseDelayMs}
              onChange={(event) => setRetryBaseDelayMs(Math.max(50, Number(event.target.value) || 50))}
            />

            <label className="qa-checkbox">
              <input type="checkbox" checked={retryUseJitter} onChange={(event) => setRetryUseJitter(event.target.checked)} />
              Use jitter
            </label>
          </div>

          <div className="qa-inline-actions">
            <button type="button" onClick={() => void handleRunRetryBackoffTest()} disabled={retryRunning}>
              {retryRunning ? 'Running...' : 'Run Retry Test'}
            </button>
          </div>

          {retryResultSummary ? <p>{retryResultSummary}</p> : null}
          {retryAttempts.length > 0 ? (
            <div className="qa-result">
              <p>
                Attempts: <strong>{retryAttempts.length}</strong>
              </p>
              <pre>
                {retryAttempts
                  .map(
                    (attempt) =>
                      `#${attempt.attempt} status=${attempt.status ?? 'network'} duration=${attempt.durationMs}ms backoff=${attempt.backoffMs}ms note=${attempt.note}`,
                  )
                  .join('\n')}
              </pre>
            </div>
          ) : null}
        </article>
      </section>

      <section className="panel qa-panel">
        <h2>API Playground</h2>

        <div className="qa-grid qa-grid-api">
          <label htmlFor="qaApiMethod">Method</label>
          <select id="qaApiMethod" value={apiMethod} onChange={(event) => setApiMethod(event.target.value as HttpMethod)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          <label htmlFor="qaApiUrl">URL</label>
          <input id="qaApiUrl" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder="/api/..." />

          <label htmlFor="qaApiHeaders">Headers (JSON)</label>
          <textarea
            id="qaApiHeaders"
            value={apiHeadersJson}
            onChange={(event) => setApiHeadersJson(event.target.value)}
            rows={5}
            className="qa-textarea"
          />

          <label htmlFor="qaApiBody">Body (JSON)</label>
          <textarea
            id="qaApiBody"
            value={apiBodyJson}
            onChange={(event) => setApiBodyJson(event.target.value)}
            rows={7}
            className="qa-textarea"
          />

          <label className="qa-checkbox">
            <input type="checkbox" checked={includeAuthHeader} onChange={(event) => setIncludeAuthHeader(event.target.checked)} />
            Include bearer token from current session
          </label>

          <div className="qa-inline-actions">
            <button type="button" onClick={() => void handleSendApiRequest()} disabled={apiIsLoading}>
              {apiIsLoading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>

        {apiError ? (
          <p className="error" role="alert" aria-live="assertive">
            {apiError}
          </p>
        ) : null}
        {apiResponse ? (
          <div className="qa-result">
            <p>
              Status: <strong>{apiResponse.status}</strong> | Duration: <strong>{apiResponse.durationMs}ms</strong>
            </p>
            <pre>{apiResponse.body}</pre>
          </div>
        ) : null}
      </section>

      <section className="panel qa-panel">
        <h2>Hub Playground</h2>

        <div className="qa-hub-status-row">
          <span className={`connection-badge ${hubStatus.chat}`}>chat: {hubStatus.chat}</span>
          <span className={`connection-badge ${hubStatus.notifications}`}>notifications: {hubStatus.notifications}</span>
          <button type="button" onClick={() => void handleConnectHub(selectedHub)}>
            Connect Selected Hub
          </button>
          <button type="button" onClick={() => void handleDisconnectHub(selectedHub)}>
            Disconnect Selected Hub
          </button>
        </div>

        <div className="qa-grid qa-grid-hub">
          <label htmlFor="qaHubName">Hub</label>
          <select id="qaHubName" value={selectedHub} onChange={(event) => setSelectedHub(event.target.value as HubName)}>
            <option value="chat">chat</option>
            <option value="notifications">notifications</option>
          </select>

          <label htmlFor="qaHubMethod">Method</label>
          <select id="qaHubMethod" value={selectedHubMethod} onChange={(event) => setSelectedHubMethod(event.target.value)}>
            {hubMethodOptions[selectedHub].map((methodName) => (
              <option key={methodName} value={methodName}>
                {methodName}
              </option>
            ))}
          </select>

          <label htmlFor="qaHubArgs">Arguments (JSON)</label>
          <textarea id="qaHubArgs" value={hubArgsJson} onChange={(event) => setHubArgsJson(event.target.value)} rows={6} className="qa-textarea" />

          <div className="qa-inline-actions">
            <button type="button" onClick={() => void handleInvokeHubMethod()}>
              Invoke
            </button>
          </div>
        </div>

        {hubError ? (
          <p className="error" role="alert" aria-live="assertive">
            {hubError}
          </p>
        ) : null}
        {hubInvokeResult ? (
          <div className="qa-result">
            <p>
              Result: <strong>{hubInvokeResult.ok ? 'success' : 'failed'}</strong> | Duration: <strong>{hubInvokeResult.durationMs}ms</strong>
            </p>
            <pre>{hubInvokeResult.result}</pre>
          </div>
        ) : null}
      </section>

      <section className="panel qa-panel">
        <h2>Event Monitor</h2>
        <p>Incoming hub events are listed with timestamp and payload.</p>

        <div className="qa-log-list">
          {eventLogs.length === 0 ? <p>No incoming hub events yet.</p> : null}
          {eventLogs.map((entry) => (
            <article key={entry.id} className="qa-log-item">
              <header>
                <strong>{entry.title}</strong>
                <span>{entry.timestamp}</span>
              </header>
              <pre>{entry.details}</pre>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
