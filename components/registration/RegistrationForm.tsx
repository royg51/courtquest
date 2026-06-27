// Full registration form for a tournament.
// Handles 1-player (singles) and 2-player (doubles) flows based on teamSize.

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { registerTeamSchema, type RegisterTeamInput } from '@/lib/schemas/team';
import { TextField } from '@/components/ui/TextField';
import { useRegisterTeam } from '@/hooks/useRegistration';

interface Props {
  tournamentId: string;
  tournamentSlug: string;
  teamSize: 1 | 2;
  requiresPayment: boolean;
  entryFeeCents: number;
}

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCE_INTERMEDIATE', label: 'Advanced Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

export default function RegistrationForm({
  tournamentId,
  tournamentSlug,
  teamSize,
  requiresPayment,
  entryFeeCents,
}: Props) {
  const router = useRouter();
  const registerTeam = useRegisterTeam(tournamentId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterTeamInput>({ resolver: zodResolver(registerTeamSchema) });

  const onSubmit = async (data: RegisterTeamInput) => {
    try {
      await registerTeam.mutateAsync(teamSize === 2 ? data : { ...data, partner: undefined });
      toast.success("You're registered!");
      router.push(`/tournaments/${tournamentSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-md space-y-4 px-4 py-8" noValidate>
      {requiresPayment && (
        <div className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          Entry fee: ${(entryFeeCents / 100).toFixed(2)} — pay onsite or as arranged with the
          organizer.
        </div>
      )}

      <TextField label="Team name" error={errors.teamName?.message} {...register('teamName')} />

      <div>
        <label htmlFor="skillLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Skill level
        </label>
        <select
          id="skillLevel"
          defaultValue=""
          {...register('skillLevel')}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="" disabled>
            Select…
          </option>
          {SKILL_LEVELS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.skillLevel && (
          <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.skillLevel.message}
          </p>
        )}
      </div>

      {teamSize === 2 && (
        <fieldset className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-800">
          <legend className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">Partner</legend>
          <TextField
            label="Partner name"
            error={errors.partner?.guestName?.message}
            {...register('partner.guestName')}
          />
          <TextField
            label="Partner email (optional)"
            type="email"
            error={errors.partner?.guestEmail?.message}
            {...register('partner.guestEmail')}
          />
        </fieldset>
      )}

      <div>
        <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            {...register('waiverAccepted')}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/40 dark:border-gray-700"
          />
          I accept the liability waiver and tournament rules.
        </label>
        {errors.waiverAccepted && (
          <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.waiverAccepted.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={registerTeam.isPending}
        className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
      >
        {registerTeam.isPending ? 'Registering…' : 'Register'}
      </button>
    </form>
  );
}
