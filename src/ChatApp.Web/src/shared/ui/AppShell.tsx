import { Link, NavLink, Outlet } from 'react-router-dom';
import { isQaEnabled } from '../config/runtime';
import { useAuth } from '../state/auth';

export function AppShell() {
  const { isAuthenticated, currentUser, logout } = useAuth();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="topbar">
        <Link className="brand" to="/chat">
          ChatApp Web
        </Link>
        <nav className="nav-links">
          <NavLink to="/chat">Chat</NavLink>
          {isQaEnabled ? <NavLink to="/qa">QA</NavLink> : null}
        </nav>
        {currentUser ? (
          <span className="user-badge" title={currentUser.email}>
            {currentUser.displayName} (@{currentUser.username})
          </span>
        ) : null}
        {isAuthenticated ? (
          <button type="button" onClick={() => void logout()}>
            Sign Out
          </button>
        ) : null}
      </header>
      <main id="main-content" className="page-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
