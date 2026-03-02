import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import { useAuth } from '../../../shared/state/auth';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginForm = z.infer<typeof loginSchema>;
type LoginFormErrors = Partial<Record<keyof LoginForm, string>>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<LoginForm>({ emailOrUsername: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setServerError('');

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: LoginFormErrors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof LoginForm;
        fieldErrors[key] = issue.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await login(parsed.data);
      navigate('/chat');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h1>Login</h1>
      <p>Sign in with your account credentials.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="emailOrUsername">Email or Username</label>
        <input
          id="emailOrUsername"
          value={form.emailOrUsername}
          onChange={(event) => setForm((current) => ({ ...current, emailOrUsername: event.target.value }))}
          autoComplete="username"
          aria-invalid={Boolean(errors.emailOrUsername)}
          aria-describedby={errors.emailOrUsername ? 'emailOrUsername-error' : undefined}
        />
        {errors.emailOrUsername ? (
          <small id="emailOrUsername-error" className="error" role="alert">
            {errors.emailOrUsername}
          </small>
        ) : null}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
        />
        {errors.password ? (
          <small id="login-password-error" className="error" role="alert">
            {errors.password}
          </small>
        ) : null}

        {serverError ? (
          <small className="error" role="alert">
            {serverError}
          </small>
        ) : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p>
        Need an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}

