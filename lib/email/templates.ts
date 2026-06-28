// Plain-HTML email templates. No React Email package — these are simple
// enough (one shared layout + a handful of one-off bodies) that adding a
// rendering library wouldn't pay for itself.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function layout(opts: { preheader: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#15803d;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">CourtQuest</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#111827;font-size:15px;line-height:1.6;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
                CourtQuest — Tournament Management Platform
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:10px 20px;background-color:#15803d;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">${label}</a>`;
}

export function welcomeEmail(opts: { name: string }) {
  const subject = 'Welcome to CourtQuest';
  const html = layout({
    preheader: 'Your CourtQuest account is ready.',
    bodyHtml: `
      <p>Hi ${opts.name},</p>
      <p>Welcome to CourtQuest! Your account is ready — you can now browse tournaments and register to play.</p>
      ${button('Browse tournaments', `${APP_URL}/events`)}
    `,
  });
  return { subject, html };
}

export function registrationConfirmationEmail(opts: {
  name: string;
  tournamentName: string;
  tournamentSlug: string;
  teamName: string;
}) {
  const subject = `You're registered for ${opts.tournamentName}`;
  const html = layout({
    preheader: `Your registration for ${opts.tournamentName} is confirmed.`,
    bodyHtml: `
      <p>Hi ${opts.name},</p>
      <p>You're registered for <strong>${opts.tournamentName}</strong> as part of team "${opts.teamName}".</p>
      <p>We'll let you know when your bracket and match schedule are ready.</p>
      ${button('View tournament', `${APP_URL}/tournaments/${opts.tournamentSlug}`)}
    `,
  });
  return { subject, html };
}

export function donationThankYouEmail(opts: { name: string; amountCents: number }) {
  const amount = (opts.amountCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const subject = 'Thank you for your donation';
  const html = layout({
    preheader: `Thank you for your ${amount} donation to CourtQuest.`,
    bodyHtml: `
      <p>Hi ${opts.name},</p>
      <p>Thank you for your generous donation of <strong>${amount}</strong> to CourtQuest. Your support directly funds community tournaments.</p>
      ${button('See our impact', `${APP_URL}/donate`)}
    `,
  });
  return { subject, html };
}

export function matchReadyEmail(opts: {
  name: string;
  tournamentName: string;
  tournamentSlug: string;
  opponentName: string;
}) {
  const subject = `Your next match is set — ${opts.tournamentName}`;
  const html = layout({
    preheader: `You're playing ${opts.opponentName} next in ${opts.tournamentName}.`,
    bodyHtml: `
      <p>Hi ${opts.name},</p>
      <p>Your next match in <strong>${opts.tournamentName}</strong> is set — you're playing <strong>${opts.opponentName}</strong>.</p>
      ${button('View bracket', `${APP_URL}/tournaments/${opts.tournamentSlug}/bracket`)}
    `,
  });
  return { subject, html };
}
