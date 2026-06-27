import type { Metadata } from 'next';
import { Heart } from 'lucide-react';
import { isStripeConfigured } from '@/lib/payments';
import DonationForm from '@/components/donate/DonationForm';

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Support CourtQuest and help fund community sports tournaments.',
};

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

export default function DonatePage() {
  const configured = isStripeConfigured();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Heart className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand-700">Support CourtQuest</h1>
        <p className="mx-auto mt-2 max-w-md text-gray-600">
          Every dollar helps us organize more tournaments and raise more for the local causes our
          events support.
        </p>
      </div>

      <section className="mt-8 grid gap-4 rounded-lg border border-gray-200 bg-brand-50/30 p-6 text-center sm:grid-cols-3">
        <div>
          <p className="text-2xl font-bold text-brand-600">$3,000+</p>
          <p className="text-xs text-gray-600">Raised so far</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-600">40+</p>
          <p className="text-xs text-gray-600">Participants reached</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-600">100%</p>
          <p className="text-xs text-gray-600">Student-led</p>
        </div>
      </section>

      <section className="mt-10">
        {configured ? (
          <DonationForm />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Online donations aren&apos;t set up yet — check back soon, or reach out via the
            contact info in the footer.
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">FAQ</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.question}>
              <p className="font-medium text-gray-900">{item.question}</p>
              <p className="mt-1 text-sm text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
