import Link from 'next/link'

import { getShellUser } from '@/app/features/userData/frame/api/shell'
import { PublicShell } from '@/app/features/userData/frame/components/PublicShell'

import { archivo } from '../fonts'
import { Footer } from '../sections/footer'

/**
 * The privacy policy (Carlos, 2026-10-02): a SAMPLE, written from what the
 * app actually stores and calls (database tables, EXTERNAL_SERVICES.md),
 * under the Philippine Data Privacy Act of 2012. Not reviewed by a lawyer
 * yet -- the banner says so. Keep it true to the code: when a table, a
 * service or a retention rule changes, change the section that names it.
 */

const UPDATED = '2 October 2026'

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  {
    id: 'who',
    title: 'Who we are',
    body: (
      <p>
        Papaldo Ka (“Papaldo”, “we”) is a practice stock market for learning to invest. It is built and run by David
        Jamandre in the Philippines. This policy explains what information Papaldo keeps about you, why, and the choices
        you have, in line with the Data Privacy Act of 2012 (Republic Act No. 10173).
      </p>
    ),
  },
  {
    id: 'collect',
    title: 'What we collect',
    body: (
      <>
        <p>Only what it takes to run your practice account:</p>
        <ul>
          <li>
            <strong>Your account:</strong> your email address and a password, or your name and email from Google if you
            sign in with Google. Passwords are handled by our sign-in provider and are never visible to us.
          </li>
          <li>
            <strong>Your profile:</strong> your username, and anything you choose to add: a photo, your occupation, a
            contact number, a website, and your current and ideal income. You can also make your profile private.
          </li>
          <li>
            <strong>Your risk quiz:</strong> your answers and the risk level they produce, each time you take it.
          </li>
          <li>
            <strong>Your practice portfolio:</strong> your simulated balance, holdings and orders.
          </li>
          <li>
            <strong>Community:</strong> the messages you post in the chat room, your friends list, and the name you give if
            you chat as a guest.
          </li>
          <li>
            <strong>Support:</strong> what you send us through the support form.
          </li>
          <li>
            <strong>Records the app keeps to stay secure and working:</strong> a log of changes to accounts and a log of the
            market-data requests made while you use the app, which notes which account made the request but never what you
            typed.
          </li>
        </ul>
        <p>
          We never ask for bank details, card numbers or government IDs. No real money ever moves through Papaldo.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use it',
    body: (
      <ul>
        <li>To run your account and your practice portfolio, and to show your risk level and suggestions.</li>
        <li>To show your profile, messages and friends to other members, as you set them.</li>
        <li>To answer you when you contact support.</li>
        <li>To keep Papaldo secure, fix problems, and understand which features are used.</li>
      </ul>
    ),
  },
  {
    id: 'share',
    title: 'Who we share it with',
    body: (
      <>
        <p>We don’t sell your information, and we don’t use it for advertising. We share it only with the services that run Papaldo:</p>
        <ul>
          <li>
            <strong>Supabase</strong> stores the database and handles sign-in.
          </li>
          <li>
            <strong>Vercel</strong> hosts the website.
          </li>
          <li>
            <strong>Google</strong>, only if you choose to sign in with Google.
          </li>
        </ul>
        <p>
          Market-data providers (Alpaca, Finnhub, ExchangeRate-API) receive the names of the stocks we look up, never who
          you are. Some images, such as company logos and the logos on How it’s built, load straight from their providers,
          which see your device’s IP address as any website would.
        </p>
        <p>We may also disclose information when the law requires it.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and browser storage',
    body: (
      <p>
        Papaldo uses only the cookies it needs to keep you signed in and to complete sign-in safely. Your display settings
        (theme, colours, currency, language) are saved in your browser. We use no advertising or tracking cookies.
      </p>
    ),
  },
  {
    id: 'keep',
    title: 'How long we keep it',
    body: (
      <p>
        We keep your account information for as long as your account exists. Request logs are deleted automatically after
        30 days. When you ask us to delete your account, we delete your information, except anything we must keep by law.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>Under the Data Privacy Act you can:</p>
        <ul>
          <li>be told what information we have about you, and how it is used;</li>
          <li>
            get a copy of it: download everything from <Link href="/tools/export">Tools → Export</Link>;
          </li>
          <li>correct it, from your profile page;</li>
          <li>object to how it is used, or ask us to delete it, by contacting us;</li>
          <li>
            complain to the National Privacy Commission at <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer">privacy.gov.ph</a>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    body: (
      <p>
        Information travels encrypted. Every table that holds your information is locked so that only you, and the people
        you choose to share with, can read it. The keys that could bypass that are never sent to your browser. No system is
        perfectly secure, so if we ever learn of a breach that affects you, we will tell you and the National Privacy
        Commission as the law requires.
      </p>
    ),
  },
  {
    id: 'age',
    title: 'Age',
    body: <p>Papaldo is meant for people aged 18 and over. We don’t knowingly keep information about anyone younger.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <p>When this policy changes, we update the date at the top. If a change is significant, we will tell you in the app.</p>,
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <p>
        For anything about your privacy, write through the <Link href="/support">support form</Link> or email{' '}
        <a href="mailto:hello@papaldo.ph">hello@papaldo.ph</a>.
      </p>
    ),
  },
]

export async function PrivacyPage() {
  const user = await getShellUser()
  return (
    <PublicShell user={user} landing>
      <main className={archivo.variable}>
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Last updated {UPDATED}</p>
          <h1 className="mt-3 font-display text-[2.35rem] leading-[1.04] font-semibold tracking-[-0.025em] font-stretch-[116%] sm:text-[3.1rem]">
            Privacy policy
          </h1>
          <p role="note" className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-pretty text-muted-foreground">
            This is a sample policy written for Papaldo’s current version. It has not been reviewed by a lawyer yet.
          </p>

          <nav aria-label="On this page" className="mt-10">
            <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-12 grid gap-12 text-pretty text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_li]:mt-2 [&_p+p]:mt-4 [&_p+ul]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul+p]:mt-4">
            {SECTIONS.map((section, index) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
                <h2 id={`${section.id}-title`} className="mb-4 font-display text-xl font-semibold text-foreground sm:text-2xl">
                  {index + 1}. {section.title}
                </h2>
                {section.body}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </PublicShell>
  )
}
