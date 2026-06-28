// Resend transactional email helpers.
//
// Every send* function here swallows its own errors — a failed email must
// never block the action that triggered it (signup, registration, a
// donation, a match advancing). Failures are logged and reported to Sentry,
// not thrown.

import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import {
  welcomeEmail,
  registrationConfirmationEmail,
  donationThankYouEmail,
  matchReadyEmail,
  paymentConfirmationEmail,
  organizerNewRegistrationEmail,
  tournamentResultsEmail,
} from '@/lib/email/templates';

let _resend: Resend | null = null;

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? 'CourtQuest <noreply@courtquest.net>';

async function send(opts: { to: string; subject: string; html: string; tag: string }) {
  if (!isEmailConfigured()) {
    console.log(`[email] RESEND_API_KEY not set — skipping "${opts.tag}" to ${opts.to}`);
    return;
  }
  try {
    const result = await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (result.error) throw result.error;
  } catch (error) {
    console.error(`[email] failed to send "${opts.tag}" to ${opts.to}:`, error);
    Sentry.captureException(error, { tags: { email: opts.tag } });
  }
}

export async function sendWelcomeEmail(opts: { to: string; name: string }) {
  const { subject, html } = welcomeEmail({ name: opts.name });
  await send({ to: opts.to, subject, html, tag: 'welcome' });
}

export async function sendRegistrationConfirmation(opts: {
  to: string;
  name: string;
  tournamentName: string;
  tournamentSlug: string;
  teamName: string;
}) {
  const { subject, html } = registrationConfirmationEmail(opts);
  await send({ to: opts.to, subject, html, tag: 'registration-confirmation' });
}

export async function sendDonationThankYou(opts: {
  to: string;
  name: string;
  amountCents: number;
}) {
  const { subject, html } = donationThankYouEmail(opts);
  await send({ to: opts.to, subject, html, tag: 'donation-thank-you' });
}

export async function sendMatchReadyNotification(opts: {
  to: string;
  name: string;
  tournamentName: string;
  tournamentSlug: string;
  opponentName: string;
}) {
  const { subject, html } = matchReadyEmail(opts);
  await send({ to: opts.to, subject, html, tag: 'match-ready' });
}

export async function sendPaymentConfirmation(opts: {
  to: string;
  name: string;
  tournamentName: string;
  tournamentSlug: string;
  amountCents: number;
}) {
  const { subject, html } = paymentConfirmationEmail(opts);
  await send({ to: opts.to, subject, html, tag: 'payment-confirmation' });
}

export async function sendOrganizerNewRegistrationNotification(opts: {
  to: string;
  organizerName: string;
  tournamentName: string;
  tournamentId: string;
  teamName: string;
  playerName: string;
  paid: boolean;
}) {
  const { subject, html } = organizerNewRegistrationEmail(opts);
  await send({ to: opts.to, subject, html, tag: 'organizer-new-registration' });
}

export async function sendTournamentResults(opts: {
  to: string;
  name: string;
  tournamentName: string;
  tournamentSlug: string;
  championName: string;
}) {
  const { subject, html } = tournamentResultsEmail(opts);
  await send({ to: opts.to, subject, html, tag: 'tournament-results' });
}
