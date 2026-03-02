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

type ApiResult<T> = {
  isSuccess: boolean;
  error: string | null;
  value: T | null;
};

type RegisterUserResult = {
  auth: AuthResponseDto;
  password: string;
};

type CreateRoomResult = {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  type: string;
  createdByUserId: string;
  memberCount: number;
};

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:5000';

async function requestApi<T>(method: string, path: string, body?: unknown, accessToken?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: ApiResult<T> | null = null;
  try {
    payload = (await response.json()) as ApiResult<T>;
  } catch {
    throw new Error(`Invalid JSON response for ${method} ${path}`);
  }

  if (!response.ok || !payload.isSuccess || payload.value === null) {
    throw new Error(payload.error ?? `${method} ${path} failed with status ${response.status}`);
  }

  return payload.value;
}

export async function registerUser(prefix: string): Promise<RegisterUserResult> {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `${prefix}-${seed}@example.com`;
  const username = `${prefix}-${seed}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const displayName = `${prefix}-${seed}`;
  const password = 'Test1234!';

  const auth = await requestApi<AuthResponseDto>('POST', '/api/auth/register', {
    email,
    username,
    displayName,
    password,
  });

  return { auth, password };
}

export async function createRoom(
  accessToken: string,
  roomName: string,
  description = 'Playwright room',
  memberIds?: string[],
): Promise<CreateRoomResult> {
  return requestApi<CreateRoomResult>('POST', '/api/chatrooms', {
    name: roomName,
    description,
    roomType: 1,
    memberIds,
  }, accessToken);
}
