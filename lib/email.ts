// Resend email helpers.
// All transactional emails sent from here.
// Uses React Email templates (to be added in templates/ directory).
//
// Implemented in stretch: Step 9 (Email notifications)

export async function sendRegistrationConfirmation(_opts: {
  to: string;
  name: string;
  tournamentName: string;
  tournamentSlug: string;
}) {
  // TODO: implement with Resend
  throw new Error('Not implemented');
}

export async function sendMatchReadyNotification(_opts: {
  to: string;
  name: string;
  matchDetails: { courtNumber?: number; scheduledAt?: string };
}) {
  // TODO: implement
  throw new Error('Not implemented');
}
