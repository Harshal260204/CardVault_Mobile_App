'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CreditCard, Check, Mail, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { api, persistAuth } from '@/lib/api';
import { axios, login } from '@/lib/api-client';
import { isWebAdminRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { loginSchema, type LoginFormValues } from '@/lib/validation';
import { useAuthStore } from '@/stores/auth-store';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      error?: { message?: string };
      message?: string;
    };
    return (
      data?.error?.message ??
      data?.message ??
      'Sign in failed. Check your credentials.'
    );
  }
  return 'Sign in failed. Please try again.';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'admin_only') {
      setFormError(
        'This portal is for managers and super admins only. Sales users should use the CardVault mobile app.',
      );
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const { user, tokens } = await login(api, values.email, values.password);
      if (!isWebAdminRole(user.role)) {
        setFormError(
          'Sales accounts must sign in via the CardVault mobile app.',
        );
        return;
      }
      persistAuth(
        tokens.accessToken,
        tokens.refreshToken,
        user,
        tokens.expiresIn,
      );
      setSession(user, tokens.accessToken, tokens.refreshToken);
      const from = searchParams.get('from');
      router.push(from?.startsWith('/admin') ? from : '/admin/dashboard');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-neutral-0 dark:bg-neutral-900">
      {/* Left Column - Desktop Only */}
      <div className="hidden md:flex md:w-[40%] bg-neutral-950 flex-col justify-between p-10 min-h-screen text-white">
        {/* Top: Logo */}
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-white" />
          <span className="text-xl font-semibold text-white">CardVault</span>
        </div>

        {/* Center: Branding & Features */}
        <div className="my-auto max-w-sm">
          <h1 className="text-3xl font-semibold text-white leading-tight">
            From business card to qualified lead.
          </h1>
          <p className="text-base text-white/60 mt-3">
            The admin console for CardVault — monitor leads, manage teams,
            export pipeline.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Check className="h-4 w-4 text-brand-400 shrink-0" />
              <span>Org-wide contact visibility</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Check className="h-4 w-4 text-brand-400 shrink-0" />
              <span>Lead qualification and export</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Check className="h-4 w-4 text-brand-400 shrink-0" />
              <span>Compliance audit trail</span>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Copyright */}
        <div className="text-xs text-white/30">© 2024 CardVault</div>
      </div>

      {/* Right Column / Mobile Container */}
      <div className="flex-1 md:w-[60%] flex items-center justify-center p-4 bg-neutral-0 dark:bg-neutral-900">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[400px] px-8"
        >
          {/* Mobile Logo: displayed at top only on mobile */}
          <div className="flex items-center gap-2 mb-8 md:hidden justify-center">
            <CreditCard className="h-6 w-6 text-brand-600" />
            <span className="text-xl font-semibold text-neutral-900 dark:text-white">
              CardVault
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary dark:text-neutral-50">
              Sign in to your account
            </h2>
            <p className="text-sm text-text-tertiary dark:text-neutral-400 mt-1">
              Enter your credentials below.
            </p>
          </div>

          {/* Conditional Error Banner */}
          {formError && (
            <div className="mt-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400 text-center font-medium animate-in fade-in slide-in-from-top-1 duration-150">
              {formError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Email input (mt-6) */}
            <div className="space-y-1 w-full">
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary dark:text-neutral-400"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="manager@cardvault.local"
                  autoComplete="email"
                  className={cn(
                    'flex h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 py-1.5 text-sm text-foreground',
                    'placeholder:text-text-tertiary/75 transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/20',
                    errors.email &&
                      'border-error focus-visible:ring-error/20 focus-visible:border-error',
                  )}
                  {...register('email')}
                />
              </div>
              {errors.email?.message ? (
                <p className="text-xs text-error mt-0.5">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            {/* Password input (mt-4) */}
            <div className="space-y-1 w-full">
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary dark:text-neutral-400"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'flex h-9 w-full rounded-md border border-border bg-surface pl-3 pr-10 py-1.5 text-sm text-foreground',
                    'placeholder:text-text-tertiary/75 transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/20',
                    errors.password &&
                      'border-error focus-visible:ring-error/20 focus-visible:border-error',
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password?.message ? (
                <p className="text-xs text-error mt-0.5">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {/* Sign in button (mt-6, full width, h-11, bg-brand-600 hover:bg-brand-700) */}
            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white mt-6 h-11"
              loading={isSubmitting}
            >
              Sign in
            </Button>

            {/* Demo Hint (mt-4) */}
            <p className="text-center text-xs text-text-tertiary dark:text-neutral-400 mt-4">
              Demo: admin@demo.com / password123
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
