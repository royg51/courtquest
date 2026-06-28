import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { Heart, CheckCircle2, XCircle, Trophy, Users } from 'lucide-react';
import { isStripeConfigured, retrieveCheckoutSession } from '@/lib/payments';
import { getRecentDonations, getTopDonors } from '@/lib/donations';
import DonationForm from '@/components/donate/DonationForm';
import { DonationConfetti } from '@/components/donate/DonationConfetti';
import { AutoRedirect } from '@/components/donate/AutoRedirect';
import { pageMetadata } from '@/lib/seo';

// Lazy-loaded with no SSR: pulls in @supabase/supabase-js, which is only
// needed for the live-update subscription, not the initial render — without
// this it added ~60kB to every /donate page load even for visitors who never
// benefit from realtime updates.
const LiveDonationsRefresher = nextDynamic(
  () => import('@/components/donate/LiveDonationsRefresher').then((m) => m.LiveDonationsRefresher),
  { ssr: false }
);

export const metadata = pageMetadata({
  title: 'Donate',
  description: 'Support CourtQuest and help fund community sports tournaments.',
  path: '/donate',
});

// Without this, isStripeConfigured() would be evaluated once at build time
// and baked into static HTML — adding real keys later wouldn't show up
// without a full rebuild.
export const dynamic = 'force-dynamic';

const FAQ = [
  {
    question: 'Is my donation tax-deductible?',
    answer:
      'Yes — CourtQuest is a registered 501(c)(3) nonprofit, so your donation is tax-deductible to the extent allowed by law.',
  },
  {
    question: 'Where does my donation go?',
    answer:
      'Directly toward organizing tournaments and supporting the local causes each event raises funds for.',
  },
  {
    question: 'Is payment secure?',
    answer:
      'Yes — all payments are processed securely through Stripe. CourtQuest never sees or stores your card details.',
  },
  {
    question: 'Can I get a receipt?',
    answer: "Stripe automatically emails you a receipt once your donation completes.",
  },
];

// Looks the just-completed Checkout Session up directly from Stripe rather
// than our own DB — that's the webhook's job, and it can land a moment
// after this redirect. Retrieving from Stripe gives an immediate, accurate
// confirmation regardless of webhook timing.
async function getSuccessDetails(sessionId: string) {
  try {
    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status !== 'paid') return null;
    return {
      name: session.customer_details?.name ?? null,
      amountCents: session.amount_total ?? 0,
    };
  } catch {
    return null;
  }
}

export default async function DonatePage({
  searchParams,
}: {
  searchParams: { status?: string; session_id?: string };
}) {
  const configured = isStripeConfigured();
  const successDetails =
    configured && searchParams.status === 'success' && searchParams.session_id
      ? await getSuccessDetails(searchParams.session_id)
      : null;

  const [recentDonations, topDonors] = await Promise.all([
    getRecentDonations(),
    getTopDonors(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <LiveDonationsRefresher />
      {successDetails && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center dark:border-green-900 dark:bg-green-900/20">
          <DonationConfetti />
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-green-700 dark:bg-green-900/40 dark:text-green-400">
            Transaction Successful
          </p>
          <h1 className="mt-2 text-xl font-bold text-green-800 dark:text-green-300">
            Thank you{successDetails.name ? `, ${successDetails.name}` : ''}!
          </h1>
          <p className="mt-1 text-green-700 dark:text-green-400">
            Your donation of <span className="font-semibold">
              ${(successDetails.amountCents / 100).toFixed(2)}
            </span>{' '}
            means a lot to us.
          </p>
          <p className="mt-1 text-sm text-green-700/80 dark:text-green-400/80">
            Stripe will email you a receipt shortly.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-800 transition-colors hover:bg-green-50 dark:border-green-800 dark:bg-gray-900 dark:text-green-300 dark:hover:bg-gray-800"
          >
            Back to Home
          </Link>
          <AutoRedirect href="/" seconds={5} />
        </div>
      )}
      {searchParams.status === 'canceled' && (
        <div className="mb-8 flex items-start gap-3 rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Checkout was canceled — no payment was made. Feel free to try again below.</p>
        </div>
      )}

      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          <Heart className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand-700 dark:text-brand-400">Support CourtQuest</h1>
        <p className="mx-auto mt-2 max-w-md text-gray-600 dark:text-gray-400">
          Every dollar helps us organize more tournaments and raise more for the local causes our
          events support.
        </p>
      </div>

      <section className="mt-8 grid gap-4 rounded-lg border border-gray-200 bg-brand-50/30 p-6 text-center sm:grid-cols-3 dark:border-gray-800 dark:bg-brand-900/10">
        <div>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">$3,000+</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Raised so far</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">40+</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Participants reached</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">100%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Student-led</p>
        </div>
      </section>

      <section className="mt-10">
        {configured ? (
          <DonationForm />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Online donations aren&apos;t set up yet — check back soon, or reach out via the
            contact info in the footer.
          </div>
        )}
      </section>

      {(recentDonations.length > 0 || topDonors.length > 0) && (
        <section className="mt-12 grid gap-8 sm:grid-cols-2">
          {topDonors.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <Trophy className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Top Donors
              </h2>
              <ul className="space-y-2">
                {topDonors.map((donor, i) => (
                  <li
                    key={donor.donorName}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800"
                  >
                    <span className="text-gray-900 dark:text-gray-100">
                      <span className="mr-2 text-gray-400 dark:text-gray-500">#{i + 1}</span>
                      {donor.donorName}
                    </span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      ${(donor.totalCents / 100).toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recentDonations.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Recent Donations
              </h2>
              <ul className="space-y-2">
                {recentDonations.map((donation) => (
                  <li
                    key={donation.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800"
                  >
                    <span className="text-gray-900 dark:text-gray-100">
                      {donation.donorName ?? 'Anonymous'}
                    </span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      ${(donation.amountCents / 100).toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">FAQ</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.question}>
              <p className="font-medium text-gray-900 dark:text-gray-100">{item.question}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
