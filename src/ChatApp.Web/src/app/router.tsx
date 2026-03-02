import { lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { useAuth } from '../shared/state/auth';
import { isQaEnabled } from '../shared/config/runtime';
import { AppShell } from '../shared/ui/AppShell';

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const ChatPage = lazy(() => import('../features/chat/pages/ChatPage').then((module) => ({ default: module.ChatPage })));

const qaRoutes: RouteObject[] = isQaEnabled
  ? [
      {
        path: '/qa',
        lazy: async () => {
          const module = await import('../features/qa/pages/QaPage');
          return {
            Component: module.QaPage,
          };
        },
      },
    ]
  : [];

function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <section className="panel">Loading session...</section>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <section className="panel">Loading session...</section>;
  }

  return isAuthenticated ? <Navigate to="/chat" replace /> : <Outlet />;
}

export const appRouter = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/chat', element: <ChatPage /> },
          ...qaRoutes,
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/chat" replace /> },
]);
