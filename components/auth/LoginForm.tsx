'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { TextField } from '@/components/ui/TextField';
import { GoogleButton } from '@/components/ui/GoogleButton';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);

    const result = await signIn('credentials', { ...data, redirect: false });

    if (result?.error) {
      setFormError('Incorrect email or password.');
      return;
    }

    toast.success('Welcome back!');
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Log in to manage your tournaments</p>
      </div>

      {formError && (
        <div
          className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Password"
          isPassword
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="text-right">
          <button
            type="button"
            onClick={() => toast.info('Password reset is coming soon.')}
            className="text-sm text-brand-700 hover:underline dark:text-brand-400"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500">OR</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <GoogleButton callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
          Sign up
        </Link>
      </p>
    </div>
  );
}
