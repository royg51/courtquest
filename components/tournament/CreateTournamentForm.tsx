'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createTournamentSchema, type CreateTournamentInput } from '@/lib/schemas/tournament';
import { TextField } from '@/components/ui/TextField';

export default function CreateTournamentForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTournamentInput>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: { sport: 'Pickleball' },
  });

  const onSubmit = async (data: CreateTournamentInput) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to create tournament');
        return;
      }

      const { tournament } = await res.json();
      toast.success('Tournament created');
      router.push(`/tournaments/${tournament.slug}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-md space-y-4 px-4 py-8">
      <TextField label="Tournament name" error={errors.name?.message} {...register('name')} />

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={3}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          {...register('description')}
        />
        {errors.description && (
          <p
            id="description-error"
            role="alert"
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {errors.description.message}
          </p>
        )}
      </div>

      <TextField label="Sport" error={errors.sport?.message} {...register('sport')} />

      <TextField
        label="Max participants"
        type="number"
        error={errors.maxParticipants?.message}
        {...register('maxParticipants', { valueAsNumber: true })}
      />

      <TextField
        label="Entry fee in dollars (optional, leave blank for free)"
        type="number"
        min="0"
        step="1"
        error={errors.entryFeeDollars?.message}
        {...register('entryFeeDollars', { valueAsNumber: true })}
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create Tournament'}
      </button>
    </form>
  );
}
