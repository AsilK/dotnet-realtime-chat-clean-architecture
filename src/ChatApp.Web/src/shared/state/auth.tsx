import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type LoginRequest,
  type RegisterRequest,
} from '../../features/auth/api/authApi';
import { clearStoredTokens, getStoredTokens, persistTokens, type TokenPair } from '../../features/auth/api/tokenStorage';
import type { UserDto } from '../api/contracts';
import { setupAuthInterceptors } from '../api/authInterceptors';

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  currentUser: UserDto | null;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const tokensRef = useRef<TokenPair | null>(null);

  const setSession = useCallback((nextTokens: TokenPair | null, user: UserDto | null) => {
    tokensRef.current = nextTokens;
    setTokens(nextTokens);
    setCurrentUser(user);

    if (nextTokens) {
      persistTokens(nextTokens);
    } else {
      clearStoredTokens();
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null, null);
  }, [setSession]);

  useEffect(() => {
    const detach = setupAuthInterceptors({
      getAccessToken: () => tokensRef.current?.accessToken ?? null,
      getRefreshToken: () => tokensRef.current?.refreshToken ?? null,
      onTokensRefreshed: (refreshedTokens) => {
        tokensRef.current = refreshedTokens;
        setTokens(refreshedTokens);
        persistTokens(refreshedTokens);
      },
      onAuthFailure: clearSession,
    });

    return detach;
  }, [clearSession]);

  useEffect(() => {
    let isCancelled = false;

    const initializeSession = async (): Promise<void> => {
      const storedTokens = getStoredTokens();
      if (!storedTokens) {
        if (!isCancelled) {
          setIsInitializing(false);
        }

        return;
      }

      tokensRef.current = storedTokens;
      setTokens(storedTokens);

      try {
        const user = await getCurrentUser();
        if (!isCancelled) {
          setCurrentUser(user);
        }
      } catch {
        if (!isCancelled) {
          clearSession();
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    void initializeSession();

    return () => {
      isCancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async (request: LoginRequest): Promise<void> => {
      const response = await loginRequest(request);
      const nextTokens: TokenPair = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };

      tokensRef.current = nextTokens;
      setTokens(nextTokens);
      persistTokens(nextTokens);

      const user = await getCurrentUser();
      setCurrentUser(user);
    },
    [],
  );

  const register = useCallback(
    async (request: RegisterRequest): Promise<void> => {
      const response = await registerRequest(request);
      const nextTokens: TokenPair = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };

      tokensRef.current = nextTokens;
      setTokens(nextTokens);
      persistTokens(nextTokens);

      const user = await getCurrentUser();
      setCurrentUser(user);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    const activeRefreshToken = tokensRef.current?.refreshToken;

    try {
      if (activeRefreshToken) {
        await logoutRequest(activeRefreshToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(tokens?.accessToken),
      isInitializing,
      currentUser,
      login,
      register,
      logout,
    }),
    [tokens, isInitializing, currentUser, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
