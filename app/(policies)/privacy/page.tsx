import Header from "@/components/Header-new";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
        {/* Desktop Banner (1440px) */}
        <div className="hidden xl:block relative h-60 w-full">
          <Image
            src="/svgs/heros/banner.svg"
            alt="Privacy Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-4xl lg:text-5xl text-brand-text-primary font-bold text-center">
              Privacy Policy
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
            alt="Privacy Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-3xl font-bold text-center text-brand-text-primary">
              Privacy Policy
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
            alt="Privacy Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-2xl font-bold text-center text-brand-text-primary">
              Privacy Policy
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
            alt="Privacy Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-2xl font-bold text-center text-brand-text-primary">
              Privacy Policy
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
              Smipay (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is
              committed to protecting your personal information and respecting
              your privacy. This Privacy Policy explains how we collect, use,
              store, and protect your data when you use the Smipay mobile app,
              website, and related services (&quot;Services&quot;).
            </p>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              By using Smipay, you agree to the practices described in this
              Privacy Policy.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Information We Collect
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-4">
              We collect information in order to create and secure your account,
              process transactions, improve Smipay, meet legal obligations, and
              keep your experience safe. The categories below describe what we
              collect when you use the app or website.
            </p>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              1. Personal Information
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Full name and contact details (email address, phone number)</li>
              <li>Date of birth and residential / billing address where required</li>
              <li>
                Identity information for KYC/AML purposes (such as BVN, NIN, ID card
                details) where required by law or our partners
              </li>
              <li>Account login details (hashed passwords, security settings)</li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              2. Transaction Information
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Payment history</li>
              <li>Electricity meter details</li>
              <li>Airtime and data purchase details</li>
              <li>Cable subscription details</li>
              {/* <li>Virtual card transactions</li> */}
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              3. Device & Technical Information
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>IP address</li>
              <li>Device model</li>
              <li>Operating system</li>
              <li>App version and performance data</li>
              <li>Browser type (for web access)</li>
              <li>Mobile network provider</li>
              <li>
                Device identifiers and diagnostic information (such as device IDs or
                crash logs) used to secure your account, prevent fraud, and improve
                stability
              </li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              4. Contacts & Address Book (Mobile App)
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>
                With your explicit permission, the Smipay mobile app may access the contacts stored on your device.
              </li>
              <li>
                We use this only to help you find people you know on Smipay (for example, to send money, share referral codes, or invite friends).
              </li>
              <li>
                You can control this permission at any time through your device settings. If you turn it off, Smipay will no longer be able to read your contacts.
              </li>
              <li>
                We do not use your address book to spam your contacts, and we do not sell or rent your contact list to third parties.
              </li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              5. Cookies and Tracking Technologies
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              We use cookies, pixels, and analytics tools to understand usage
              patterns, maintain security, and improve our platform. These
              technologies may collect anonymized or pseudonymized identifiers.
              You can control cookies through your browser settings. See our
              Cookies Policy for more details.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Smipay uses your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Create and manage your account</li>
              <li>Process payments and provide services</li>
              <li>Verify your identity and comply with KYC/AML regulations</li>
              <li>Improve app performance and user experience</li>
              <li>Personalize your dashboard and recommendations</li>
              <li>Respond to customer support inquiries</li>
              <li>Prevent fraud, unauthorized activity, or misuse</li>
              <li>
                Communicate updates, product changes, and important service notices
              </li>
              <li>
                Where permitted, send you marketing messages about new features, rewards, or promotions you can benefit from (you can opt out at any time).
              </li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              Legal Basis for Processing
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              We only process your personal data where we have a valid legal basis to do so under the Nigeria Data Protection Regulation (NDPR) and any other applicable laws. Depending on the context, this may include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>
                <strong>Contractual necessity</strong> – to provide the Smipay services you sign up for (for example, processing transactions or maintaining your account).
              </li>
              <li>
                <strong>Legal obligations</strong> – to comply with KYC/AML regulations, tax, anti‑fraud, and other regulatory requirements.
              </li>
              <li>
                <strong>Legitimate interests</strong> – to secure our platform, prevent fraud, improve our products, and protect Smipay, our users, and the public, provided these interests are not overridden by your rights and freedoms.
              </li>
              <li>
                <strong>Your consent</strong> – for specific optional features such as accessing your contacts, sending certain marketing communications, or using cookies beyond what is strictly necessary. Where we rely on consent, you can withdraw it at any time.
              </li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              How We Share Your Information
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-4">
              We may share your information with:
            </p>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              1. Third-Party Service Providers
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              We rely on carefully selected partners to help us deliver Smipay. This may include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Payment processors</li>
              <li>Banks and financial institutions</li>
              <li>Utility providers (electricity, cable, telecoms)</li>
              <li>Identity verification services</li>
              <li>Analytics and security providers</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              These providers only receive the data needed to perform their
              duties. They are required to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Use your information only in line with our documented instructions</li>
              <li>Keep your information confidential and implement appropriate security safeguards</li>
              <li>Comply with applicable data‑protection laws and contractual obligations</li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              2. Regulatory Authorities
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              We may disclose information if required by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Law enforcement</li>
              <li>Courts</li>
              <li>Financial regulators</li>
              <li>Anti-fraud agencies</li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              3. Business Transfers
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              If Smipay undergoes a merger, acquisition, investment, restructuring, or sale of assets, your
              information may be transferred as part of that transaction. In such cases we will ensure that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Any new organisation takes on the same or equivalent privacy obligations</li>
              <li>You are informed of any material changes where required by law</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              How We Protect Your Information
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              We use a combination of technical and organisational measures to protect your data,
              including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Encryption of data in transit and at rest where appropriate</li>
              <li>Secure data storage and regular backups</li>
              <li>Firewalls and network security controls</li>
              <li>Multi-factor authentication for sensitive operations</li>
              <li>Strict access controls based on job role and need‑to‑know</li>
              <li>Logging and monitoring of critical systems to detect suspicious activity</li>
              <li>Staff training and internal policies on data protection and confidentiality</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              While we strive to protect your data, no system is completely
              secure. Users must also keep their login details confidential.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Account Deletion and Data Erasure
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              You can request that your Smipay account be closed and your
              personal data deleted:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>
                From within the app (where available) by navigating to{" "}
                <strong>Settings &gt; Account &gt; Delete account</strong>, or
              </li>
              <li>
                By sending an email from your registered email address to{" "}
                <strong>support@smipay.com</strong> with the subject line
                &quot;Account deletion request&quot;.
              </li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              We may ask you to verify your identity before processing deletion
              requests. Once confirmed, we will deactivate your account and
              permanently delete or anonymize personal data that we are not
              legally required to retain (for example, records needed for
              anti‑money‑laundering, tax, or regulatory purposes). Where we must
              retain limited information, we will restrict its use to compliance
              and audit purposes only.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Data Retention
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              We retain your information only as long as necessary for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Providing services</li>
              <li>Fulfilling legal obligations</li>
              <li>Resolving disputes</li>
              <li>Detecting fraud</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              For example, transaction records may be kept for several years to comply with
              financial‑services regulations, while certain technical logs may be retained for
              shorter periods for security and troubleshooting. After the relevant retention period
              expires, your data is securely deleted or irreversibly anonymized.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Your Rights
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Under the Nigeria Data Protection Regulation, you have the right
              to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Access your personal data</li>
              <li>Update or correct your information</li>
              <li>Request data deletion</li>
              <li>Withdraw consent</li>
              <li>Restrict processing</li>
              <li>Object to certain types of processing</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              To exercise any of these rights, please contact us via{" "}
              <strong>support@smipay.com</strong>. We will respond to verified
              requests within a reasonable period and in line with NDPR and any
              other applicable regulations.
            </p>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-2">
              We may need to verify your identity before acting on your request to protect your account.
              Where we cannot fully comply with a request (for example, because we must retain some
              records for legal reasons), we will explain this clearly.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              Smipay does not knowingly collect information from individuals
              under 18 years old. If we discover such data, it will be deleted
              immediately.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              International Transfers
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              If your data is transferred outside Nigeria (for example, where our service providers
              or cloud infrastructure are located in another country), Smipay ensures that
              appropriate safeguards are in place in accordance with NDPR requirements. These may
              include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary mt-2">
              <li>Contractual clauses that require equivalent data‑protection standards</li>
              <li>Transfers to countries that have been recognised as providing adequate protection</li>
              <li>Additional technical and organisational measures to keep your data secure</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Updates to This Policy
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              We may update this policy occasionally to reflect changes in our services, legal
              requirements, or how we handle your data. When we make material changes, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary mt-2">
              <li>Update the &quot;Last updated&quot; date at the top of this page</li>
              <li>Post the revised policy in the app and/or on our website</li>
              <li>
                Where appropriate, notify you via in‑app message, email, or other prominent notice
              </li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Continued use of Smipay after such changes become effective means you accept the
              updated policy.
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
