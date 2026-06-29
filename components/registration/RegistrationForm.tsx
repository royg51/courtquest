// Full registration form for a tournament.
// Handles 1-player (singles) and 2-player (doubles) flows based on teamSize.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  registerTeamSchema,
  guestRegisterTeamSchema,
  type RegisterTeamInput,
  type GuestRegisterTeamInput,
} from '@/lib/schemas/team';
import { TextField } from '@/components/ui/TextField';
import { useRegisterTeam } from '@/hooks/useRegistration';

interface Props {
  tournamentId: string;
  tournamentSlug: string;
  teamSize: 1 | 2;
  requiresPayment: boolean;
  entryFeeCents: number;
  guestMode?: boolean;
  myPermanentTeams?: Array<{ id: string; name: string }>;
}

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCE_INTERMEDIATE', label: 'Advanced Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

// In guest mode the form carries the registrant's own contact fields under
// guestPrimary; the resolver type widens to the guest schema accordingly.
type FormValues = RegisterTeamInput & Partial<GuestRegisterTeamInput>;

export default function RegistrationForm({
  tournamentId,
  tournamentSlug,
  teamSize,
  requiresPayment,
  entryFeeCents,
  guestMode = false,
  myPermanentTeams = [],
}: Props) {
  const router = useRouter();
  const registerTeam = useRegisterTeam(tournamentId);
  const [partnerMode, setPartnerMode] = useState<'guest' | 'invite'>('guest');
  const [permanentTeamId, setPermanentTeamId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(guestMode ? guestRegisterTeamSchema : registerTeamSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      let payload: FormValues = teamSize === 2 ? data : { ...data, partner: undefined };
      if (permanentTeamId) {
        payload = { ...payload, permanentTeamId, partner: undefined };
      } else if (teamSize === 2 && payload.partner) {
        payload =
          partnerMode === 'invite'
            ? { ...payload, partner: { inviteEmail: payload.partner.inviteEmail } }
            : { ...payload, partner: { ...payload.partner, inviteEmail: undefined } };
      }
      await registerTeam.mutateAsync(payload as RegisterTeamInput | GuestRegisterTeamInput);
      toast.success(
        permanentTeamId || partnerMode === 'guest' || teamSize === 1
          ? "You're registered!"
          : "You're registered! Your partner will get an email to confirm their spot."
      );
      router.push(`/tournaments/${tournamentSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register');
    }
  };

  const guestErrors = errors as Record<string, { message?: string } | undefined> & {
    guestPrimary?: { guestName?: { message?: string }; guestEmail?: { message?: string } };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-md space-y-4 px-4 py-8" noValidate>
      {requiresPayment && (
        <div className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          Entry fee: ${(entryFeeCents / 100).toFixed(2)} — pay onsite or as arranged with the
          organizer.
        </div>
      )}

      {guestMode && (
        <fieldset className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-800">
          <legend className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Your details
          </legend>
          <TextField
            label="Your name"
            error={guestErrors.guestPrimary?.guestName?.message}
            {...register('guestPrimary.guestName')}
          />
          <TextField
            label="Your email (optional, for confirmation)"
            type="email"
            error={guestErrors.guestPrimary?.guestEmail?.message}
            {...register('guestPrimary.guestEmail')}
          />
        </fieldset>
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

      {teamSize === 2 && myPermanentTeams.length > 0 && (
        <div>
          <label htmlFor="permanentTeamId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Register as a saved team (optional)
          </label>
          <select
            id="permanentTeamId"
            value={permanentTeamId}
            onChange={(e) => setPermanentTeamId(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">Don&apos;t use a saved team</option>
            {myPermanentTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {teamSize === 2 && !permanentTeamId && (
        <fieldset className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-800">
          <legend className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">Partner</legend>

          {!guestMode && (
            <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={partnerMode === 'guest'}
                  onChange={() => setPartnerMode('guest')}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500/40"
                />
                Fill in their info
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={partnerMode === 'invite'}
                  onChange={() => setPartnerMode('invite')}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500/40"
                />
                Invite by email
              </label>
            </div>
          )}

          {partnerMode === 'invite' && !guestMode ? (
            <TextField
              label="Partner's email"
              type="email"
              error={errors.partner?.inviteEmail?.message}
              {...register('partner.inviteEmail')}
            />
          ) : (
            <>
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
            </>
          )}
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
