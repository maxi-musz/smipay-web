import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Smartphone, ShieldCheck, Zap } from "lucide-react";
import AppStoreButtons from "@/components/AppStoreButtons";

export const metadata: Metadata = {
  title: "Get the SmiPay app",
  description:
    "SmiPay now runs entirely in the mobile app. Download it on iOS or Android to create an account, access your wallet, pay bills and top up airtime and data.",
};

const highlights = [
  {
    icon: Zap,
    title: "Faster payments",
    body: "Airtime, data, electricity, cable TV and education payments in a couple of taps.",
  },
  {
    icon: ShieldCheck,
    title: "Safer by default",
    body: "Device-level security, a transaction PIN and biometric sign-in protect your wallet.",
  },
  {
    icon: Smartphone,
    title: "Built for your phone",
    body: "Instant alerts the moment your wallet is credited or a payment goes through.",
  },
];

export default function DownloadAppPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="hover:opacity-90">
          <Image
            src="/smipay-logo.png"
            alt="SmiPay"
            width={140}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="mt-8 w-full rounded-2xl border border-dashboard-border/60 bg-white p-6 shadow-sm sm:mt-10 sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-bg-primary/10 px-3 py-1.5 text-xs font-medium text-brand-text-primary sm:text-sm">
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Available on mobile
          </span>

          <h1 className="mt-4 text-2xl font-semibold leading-snug text-brand-black sm:text-3xl md:text-4xl">
            Continue with the SmiPay mobile app
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-text-secondary sm:text-base">
            Creating an account and everyday banking are available in the
            SmiPay app only. Download it on iOS or Android to sign up, access
            your wallet, pay bills and view your transaction history. If you
            already have an account, sign in with the same email and password.
          </p>

          <div className="mt-6 sm:mt-8">
            <AppStoreButtons />
          </div>

          <dl className="mt-8 grid gap-5 border-t border-dashboard-border/60 pt-6 sm:mt-10 sm:grid-cols-3 sm:gap-6">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <dt className="flex items-center gap-2 text-sm font-medium text-brand-black">
                  <Icon className="h-4 w-4 text-brand-text-primary" />
                  {title}
                </dt>
                <dd className="mt-1.5 text-xs leading-relaxed text-brand-text-secondary sm:text-sm">
                  {body}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-6 text-center text-xs text-brand-text-secondary sm:text-sm">
          Already a staff member?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-brand-text-primary hover:underline"
          >
            Sign in here
          </Link>
          . Need help? Email{" "}
          <a
            href="mailto:support@smipay.com"
            className="font-medium text-brand-text-primary hover:underline"
          >
            support@smipay.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
