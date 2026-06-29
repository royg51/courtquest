'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createTournamentSchema, type CreateTournamentInput } from '@/lib/schemas/tournament';
import { SPORTS, FORMATS, ENTRY_TYPES } from '@/lib/sports';
import { TextField } from '@/components/ui/TextField';

// One form for both create and edit. Create POSTs to /api/tournaments; edit
// PUTs to /api/tournaments/[id]. Both validate against the same create schema
// (an edit should still produce a fully-valid tournament), so the only
// differences are the prefilled values, the submit target, and the button
// label. Status transitions (Open/Close registration) are handled by
// separate buttons on the manage page, not here.
export interface TournamentFormDefaults {
  name: string;
  description: string;
  sport: string;
  format: string;
  entryType: string;
  maxParticipants: number;
  numberOfCourts: number;
  entryFeeDollars: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  registrationDeadline: string;
  venue: string;
  address: string;
  allowGuestRegistration: boolean;
  swissRounds: number;
}

interface Props {
  mode: 'create' | 'edit';
  tournamentId?: string;
  defaults?: Partial<TournamentFormDefaults>;
}

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
const selectClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

export default function TournamentForm({ mode, tournamentId, defaults }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTournamentInput>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      sport: defaults?.sport ?? 'Pickleball',
      format: defaults?.format ?? 'SINGLE_ELIM',
      entryType: defaults?.entryType ?? 'SOLO',
      name: defaults?.name,
      description: defaults?.description,
      maxParticipants: defaults?.maxParticipants,
      numberOfCourts: defaults?.numberOfCourts ?? 1,
      entryFeeDollars: defaults?.entryFeeDollars,
      // react-hook-form date inputs want strings; Zod coerces to Date on submit.
      startDate: defaults?.startDate as unknown as Date | undefined,
      endDate: defaults?.endDate as unknown as Date | undefined,
      registrationDeadline: defaults?.registrationDeadline as unknown as Date | undefined,
      venue: defaults?.venue,
      address: defaults?.address,
      allowGuestRegistration: defaults?.allowGuestRegistration ?? false,
      swissRounds: defaults?.swissRounds,
    },
  });

  const format = watch('format');

  const onSubmit = async (data: CreateTournamentInput) => {
    setSubmitting(true);
    try {
      const url = mode === 'create' ? '/api/tournaments' : `/api/tournaments/${tournamentId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? `Failed to ${mode} tournament`);
        return;
      }

      const { tournament } = await res.json();
      toast.success(mode === 'create' ? 'Tournament created' : 'Changes saved');
      router.push(
        mode === 'create'
          ? `/organizer/tournaments/${tournament.id}`
          : `/organizer/tournaments/${tournamentId}`
      );
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <TextField label="Tournament name" error={errors.name?.message} {...register('name')} />

      <div>
        <label htmlFor="description" className={labelClass}>
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={3}
          className={selectClass}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sport" className={labelClass}>
            Sport
          </label>
          <select id="sport" className={selectClass} {...register('sport')}>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="format" className={labelClass}>
            Format
          </label>
          <select id="format" className={selectClass} {...register('format')}>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value} disabled={!f.implemented}>
                {f.label}
                {f.implemented ? '' : ' (coming soon)'}
              </option>
            ))}
          </select>
        </div>

        {format === 'SWISS' && (
          <TextField
            label="Number of Swiss rounds"
            type="number"
            min="1"
            max="20"
            error={errors.swissRounds?.message}
            {...register('swissRounds', { valueAsNumber: true })}
          />
        )}

        <div>
          <label htmlFor="entryType" className={labelClass}>
            Entry type
          </label>
          <select id="entryType" className={selectClass} {...register('entryType')}>
            {ENTRY_TYPES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <TextField
          label="Max participants"
          type="number"
          min="2"
          error={errors.maxParticipants?.message}
          {...register('maxParticipants', { valueAsNumber: true })}
        />

        <TextField
          label="Number of courts"
          type="number"
          min="1"
          error={errors.numberOfCourts?.message}
          {...register('numberOfCourts', { valueAsNumber: true })}
        />

        <TextField
          label="Entry fee ($, blank = free)"
          type="number"
          min="0"
          step="1"
          error={errors.entryFeeDollars?.message}
          {...register('entryFeeDollars', { valueAsNumber: true })}
        />

        <TextField
          label="Start date"
          type="date"
          error={errors.startDate?.message}
          {...register('startDate')}
        />

        <TextField
          label="End date"
          type="date"
          error={errors.endDate?.message}
          {...register('endDate')}
        />

        <TextField
          label="Registration deadline"
          type="date"
          error={errors.registrationDeadline?.message}
          {...register('registrationDeadline')}
        />
      </div>

      <TextField label="Venue (optional)" error={errors.venue?.message} {...register('venue')} />
      <TextField label="Address (optional)" error={errors.address?.message} {...register('address')} />

      <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          {...register('allowGuestRegistration')}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/40 dark:border-gray-700"
        />
        <span>
          Allow guest registration
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            Players can register without creating an account.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
      >
        {submitting
          ? mode === 'create'
            ? 'Creating…'
            : 'Saving…'
          : mode === 'create'
            ? 'Create Tournament'
            : 'Save Changes'}
      </button>
    </form>
  );
}
