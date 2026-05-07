import Header from "@/components/Header-new";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function TermsOfServicePage() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
        {/* Desktop Banner (1440px) */}
        <div className="hidden xl:block relative h-60 w-full">
          <Image
            src="/svgs/heros/banner.svg"
            alt="Terms of Service Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-4xl lg:text-5xl text-brand-text-primary font-bold text-center">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-[#9CA3AF]">
              Last updated: Febuary 26, 2026
            </p>
          </div>
        </div>

        {/* Laptop Banner (1024px) */}
        <div className="hidden lg:block xl:hidden relative h-[171px] w-full">
          <Image
            src="/svgs/heros/small-laptop.svg"
            alt="Terms of Service Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-3xl font-bold text-center text-brand-text-primary">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-[#9CA3AF]">
              Last updated: Febuary 26, 2026
            </p>
          </div>
        </div>

        {/* Tablet Banner (768px) */}
        <div className="hidden md:block lg:hidden relative h-32 w-full">
          <Image
            src="/svgs/heros/tablet.svg"
            alt="Terms of Service Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-2xl font-bold text-center text-brand-text-primary">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-[#9CA3AF]">
              Last updated: Febuary 26, 2026
            </p>
          </div>
        </div>

        {/* Mobile Banner */}
        <div className="md:hidden relative h-[167px] w-full">
          <Image
            src="/svgs/heros/banner-mobile.svg"
            alt="Terms of Service Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-2xl font-bold text-center text-brand-text-primary">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-[#9CA3AF]">
              Last updated: Febuary 26, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="w-full bg-white py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              Welcome to Smipay. These Terms of Service (&quot;Terms&quot;)
              govern your access to and use of the Smipay mobile application,
              website, and related services (&quot;Services&quot;). By
              downloading, accessing, or using Smipay, you agree to be bound by
              these Terms. Please read them carefully. If you do not agree to
              any part of these Terms, you should not use Smipay.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              About Smipay
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              Smipay is a digital platform that allows users to make everyday
              payments such as airtime, data, electricity bills, cable
              subscriptions, education payments, travel and
              homes agencies payments. Smipay is operated by Best Technologies
              Ltd., registered in Nigeria.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Eligibility
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              To use Smipay, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Be at least 18 years old.</li>
              <li>
                Have the legal capacity to enter into a binding agreement.
              </li>
              <li>Provide accurate and up-to-date personal information.</li>
              <li>
                Comply with all Nigerian laws and regulatory requirements.
              </li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              If you create an account on behalf of a business, you confirm that
              you have the authority to do so.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Account Registration
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              When creating an account, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Provide accurate and complete information.</li>
              <li>Keep your login credentials private and secure.</li>
              <li>
                Notify Smipay immediately if you suspect unauthorized access or
                breach of your account.
              </li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Smipay will not be liable for any loss arising from unauthorized
              account access caused by your negligence.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Use of Services
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              You agree to use Smipay strictly for lawful purposes and in
              accordance with these Terms. You must not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Use the platform for fraudulent or illegal transactions.</li>
              <li>
                Interfere with the security or functionality of the Services.
              </li>
              <li>
                Attempt to access other users&apos; information without
                authorization.
              </li>
              <li>
                Use automated tools or bots to interact with the platform.
              </li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Smipay reserves the right to suspend or terminate your access if
              any suspicious, abusive, or prohibited activities are detected.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Fees and Charges
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Some services may attract transaction charges, processing fees, or
              third-party fees. These will be clearly displayed before you
              complete a transaction.
            </p>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              By proceeding with a transaction, you agree to the displayed fees.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-brand-text-secondary mt-3">
              <li>
                Smipay is not responsible for additional fees charged by your
                bank, network provider, or third-party platforms.
              </li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Payments and Transactions
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              All transactions processed through Smipay are final once
              completed.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-brand-text-secondary mt-3">
              <li>
                Smipay is not responsible for incorrect details provided by the
                user (e.g., wrong meter number, phone number, or card
                information).
              </li>
              <li>
                Transaction timelines may vary depending on network or service
                provider availability.
              </li>
              <li>
                In the event of delays, reversals, or pending payments caused by
                third-party issues, Smipay will assist in resolving the issue
                but does not guarantee instant resolution.
              </li>
            </ul>

            {/* <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Virtual Card Services
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              When using the Smipay virtual card:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>
                You are responsible for all transactions made through your card.
              </li>
              <li>You must keep your card details secure.</li>
              <li>
                Smipay may impose transaction limits or require additional
                verification to comply with regulations.
              </li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              International transactions may attract additional fees or exchange
              rates determined by the card issuer.
            </p> */}

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Service Availability
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Smipay aims to provide uninterrupted services but does not
              guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Continuous, error-free operation</li>
              <li>Immediate processing of all transactions</li>
              <li>Zero downtime or maintenance disruptions</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Smipay may suspend operations temporarily for system upgrades or
              security checks.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Privacy and Data Protection
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Your privacy is important to us. Smipay collects and processes
              your personal data in compliance with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>The Nigeria Data Protection Regulation (NDPR)</li>
              <li>Applicable financial and telecom regulations</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Please read our Privacy Policy for detailed information on how we
              use your data.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Intellectual Property
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              All content on Smipay--including the name, logo, design, graphics,
              text, and software--is owned by [Insert Company Name] and
              protected under Nigerian copyright and trademark laws.
            </p>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              You may not copy, reproduce, modify, or distribute any part of the
              platform without written permission.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Third-Party Services
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Some Smipay features depend on integrations with external
              providers. Smipay is not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Failures or delays from third-party systems</li>
              <li>
                Errors caused by network operators, banks, or utility providers
              </li>
              <li>
                Issues arising from external websites you access through the
                platform
              </li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Using Smipay means you agree to the terms of any third-party
              partners involved in your transactions.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Limitation of Liability
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Smipay will not be held liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Losses due to user errors</li>
              <li>
                Losses caused by network failures or third-party providers
              </li>
              <li>
                Unauthorized access resulting from your failure to secure your
                account
              </li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Smipay&apos;s total liability for any claim relating to the
              Services will not exceed the amount you paid for the transaction
              in question.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Indemnification
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              You agree to indemnify and hold Smipay harmless from any claims,
              damages, losses, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Misuse of the Services</li>
              <li>Violation of these Terms</li>
              <li>Violation of third-party rights</li>
              <li>Fraudulent activities conducted through your account</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Suspension, Termination and Account Closure
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Smipay may suspend or terminate your access if:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>You breach these Terms or any applicable law</li>
              <li>Fraudulent or high‑risk activity is detected on your account</li>
              <li>We are required to do so by law, a court order, or a regulator</li>
              <li>You misuse any part of the platform or attempt to compromise security</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              You may also close your Smipay account at any time. To close your
              account, you can use any in‑app account‑closure option (where
              available) or contact us via{" "}
              <strong>support@smipay.com</strong> from your registered email
              address. Once your account is closed, you will no longer be able to
              access Smipay services. We may retain certain records as required
              for legal, regulatory, accounting, or anti‑fraud purposes, in line
              with our{" "}
              <a href="/privacy" className="text-dashboard-accent hover:underline">
                Privacy Policy
              </a>
              .
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Changes to These Terms
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Smipay may update these Terms occasionally. When changes are made:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>A notification will be displayed on the app or website</li>
              <li>
                Continued use of the platform means you accept the updated Terms
              </li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Governing Law
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              These Terms are governed by the laws of the Federal Republic of
              Nigeria. Any disputes will be handled in Nigerian courts.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Contact Information
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              For questions or support, contact us at:
            </p>
            <ul className="list-none pl-0 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Email: support@smipay.com</li>
              <li>Phone: +234 816 876 7809</li>
              <li>Address: The Knowledge Hub, Oke Ado, Ibadan. Oyo, Nigeria</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
