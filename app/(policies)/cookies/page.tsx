import Header from "@/components/Header-new";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function CookiesPolicyPage() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
        {/* Desktop Banner (1440px) */}
        <div className="hidden xl:block relative h-60 w-full">
          <Image
            src="/svgs/heros/banner.svg"
            alt="Cookies Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-4xl lg:text-5xl text-brand-text-primary font-bold text-center">
              Cookies Policy
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
            alt="Cookies Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-3xl font-bold text-center text-brand-text-primary">
              Cookies Policy
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
            alt="Cookies Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-2xl font-bold text-center text-brand-text-primary">
              Cookies Policy
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
            alt="Cookies Policy Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
            <h1 className="text-2xl font-bold text-center text-brand-text-primary">
              Cookies Policy
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
              This Cookies Policy explains how Smipay uses cookies and similar
              technologies to enhance your browsing and app experience.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              What Are Cookies?
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              Cookies are small text files stored on your device to remember
              your preferences, track usage behavior, and improve performance.
              They help us deliver a smoother, more personalized experience.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Types of Cookies We Use
            </h2>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              1. Essential Cookies
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              These are required for Smipay to function properly. They help
              with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Secure login</li>
              <li>Page navigation</li>
              <li>Transaction processing</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Without them, the app or website may not work correctly.
            </p>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              2. Performance Cookies
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Used to understand how users interact with Smipay, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>App performance</li>
              <li>Error reports</li>
              <li>Usage statistics</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              These help us improve speed and usability.
            </p>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              3. Functional Cookies
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              Help us remember your settings such as:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Language preferences</li>
              <li>Saved login details</li>
              <li>Dashboard preferences</li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              4. Analytics and Tracking Cookies
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              Used to analyze user behavior and improve our design and features.
              These may include third-party analytics tools.
            </p>

            <h3 className="text-lg md:text-xl font-semibold text-brand-text-primary mt-6 mb-3">
              5. Marketing Cookies
            </h3>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              These cookies help tailor advertisements or promotions to your
              interests.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Why We Use Cookies
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              We use cookies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Keep you logged in</li>
              <li>Improve app navigation</li>
              <li>Personalize your dashboard</li>
              <li>Monitor performance and issues</li>
              <li>Enhance security</li>
              <li>Track user activity for analysis and improvement</li>
              <li>Provide relevant promotions</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Managing Your Cookie Settings
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-3">
              You can manage or disable cookies through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-brand-text-secondary">
              <li>Your device settings</li>
              <li>Your web browser settings</li>
              <li>Cookie consent banner (if enabled)</li>
            </ul>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mt-3">
              Note: Disabling certain cookies may affect app functionality.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Third-Party Cookies
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              Some cookies come from third parties we work with (e.g.,
              analytics, payment partners). These partners may collect data
              according to their own privacy policies. Smipay does not control
              third-party cookies.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary mt-8 mb-4">
              Updates to This Cookies Policy
            </h2>
            <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
              We may update this policy occasionally to reflect changes in
              technology, law, or our services. Updated versions will be posted
              on the app or website.
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
