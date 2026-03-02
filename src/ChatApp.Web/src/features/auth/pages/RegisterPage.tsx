import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '../../../shared/state/auth';

const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email address.'),
    username: z.string().min(3, 'Username must be at least 3 characters.').max(32, 'Username must be at most 32 characters.'),
    displayName: z.string().min(2, 'Display name must be at least 2 characters.').max(64, 'Display name must be at most 64 characters.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must include an uppercase letter.')
      .regex(/[a-z]/, 'Password must include a lowercase letter.')
      .regex(/[0-9]/, 'Password must include a number.')
      .regex(/[^a-zA-Z0-9]/, 'Password must include a special character.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;
type RegisterFormErrors = Partial<Record<keyof RegisterForm, string>>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setServerError('');

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: RegisterFormErrors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof RegisterForm;
        fieldErrors[key] = issue.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await register({
        email: parsed.data.email,
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        password: parsed.data.password,
      });
      navigate('/chat');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h1>Register</h1>
      <p>Create your account to continue.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
        />
        {errors.email ? (
          <small id="register-email-error" className="error" role="alert">
            {errors.email}
          </small>
        ) : null}

        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? 'register-username-error' : undefined}
        />
        {errors.username ? (
          <small id="register-username-error" className="error" role="alert">
            {errors.username}
          </small>
        ) : null}

        <label htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          value={form.displayName}
          onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
          autoComplete="name"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? 'register-display-name-error' : undefined}
        />
        {errors.displayName ? (
          <small id="register-display-name-error" className="error" role="alert">
            {errors.displayName}
          </small>
        ) : null}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'register-password-error' : undefined}
        />
        {errors.password ? (
          <small id="register-password-error" className="error" role="alert">
            {errors.password}
          </small>
        ) : null}

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
        />
        {errors.confirmPassword ? (
          <small id="register-confirm-password-error" className="error" role="alert">
            {errors.confirmPassword}
          </small>
        ) : null}

        {serverError ? (
          <small className="error" role="alert">
            {serverError}
          </small>
        ) : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
