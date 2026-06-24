'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createTournamentSchema, type CreateTournamentInput } from '@/lib/schemas/tournament';

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
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Tournament name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="sport" className="block text-sm font-medium text-gray-700">
          Sport
        </label>
        <input
          id="sport"
          type="text"
          {...register('sport')}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {errors.sport && <p className="mt-1 text-sm text-red-600">{errors.sport.message}</p>}
      </div>

      <div>
        <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
          Max participants
        </label>
        <input
          id="maxParticipants"
          type="number"
          {...register('maxParticipants', { valueAsNumber: true })}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {errors.maxParticipants && (
          <p className="mt-1 text-sm text-red-600">{errors.maxParticipants.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create Tournament'}
      </button>
    </form>
  );
}
