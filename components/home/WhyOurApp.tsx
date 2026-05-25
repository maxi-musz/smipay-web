import Image from "next/image";
import { Smartphone, Timer, ShieldPlus, BadgePercent } from "lucide-react";

export default function WhyOurApp() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 sm:py-16 md:py-24">
      {/* Heading and Description */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
        <h2 className="text-brand-text-primary text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 sm:mb-4">
          Why Our App Makes Life Easier
        </h2>
        <p className="text-brand-text-secondary text-xs sm:text-sm md:text-base max-w-[600px] mx-auto">
          A simpler, faster, and more secure way to handle everyday payments and
          financial tasks.
        </p>
      </div>

      {/* Desktop Layout: 3 columns */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-8 items-center">
        {/* Left Column - 2 cards */}
        <div className="space-y-8">
          <FeatureCard
            icon={<Smartphone className="w-6 h-6" />}
            title="All Your Daily Payments in One Place"
            description="No need to jump between multiple apps or stand in queues. From airtime and electricity to cable, school payments, and online shopping, everything happens in one platform. This saves time, reduces stress, and gives users a central place to manage their money and everyday transactions."
          />
          <FeatureCard
            icon={<Timer className="w-6 h-6" />}
            title="Instant Payments"
            description="The app processes transactions quickly, giving users immediate results. Electricity tokens drop fast, cable subscriptions activate at once, and airtime or data top-up reflects immediately. When users need speed — especially in urgent moments — the app delivers."
          />
        </div>

        {/* Center Column - Phone Mockup */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-bg-primary rounded-full blur-3xl opacity-20 scale-75"></div>
            <Image
              src="/svgs/misc/smipay-mockup.svg"
              alt="Smipay App"
              width={400}
              height={400}
              className="relative z-10 object-cover"
            />
          </div>
        </div>

        {/* Right Column - 2 cards */}
        <div className="space-y-8">
          <FeatureCard
            icon={<ShieldPlus className="w-6 h-6" />}
            title="Safe and Transparent"
            description="Users can track every kobo spent, review past transactions, and monitor all activity in real time. Strong security and protection systems keep personal and financial information safe, reducing the risk of fraud and giving users full peace of mind."
          />
          <FeatureCard
            icon={<BadgePercent className="w-6 h-6" />}
            title="Pay Less, Stress Less"
            description="No transport cost, no agent fees, no hidden deductions. Users get better control of their spending, pay bills with intention, and avoid the typical inconvenience of queueing at agents. The app helps them handle everyday payments with ease and affordability."
          />
        </div>
      </div>

      {/* Tablet Layout: 2 columns */}
      <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-8">
        {/* First Row - 2 cards */}
        <FeatureCard
          icon={<Smartphone className="w-6 h-6" />}
          title="All Your Daily Payments in One Place"
          description="No need to jump between multiple apps or stand in queues. From airtime and electricity to cable, school payments, and online shopping, everything happens in one platform. This saves time, reduces stress, and gives users a central place to manage their money and everyday transactions."
        />
        <FeatureCard
          icon={<Timer className="w-6 h-6" />}
          title="Instant Payments"
          description="The app processes transactions quickly, giving users immediate results. Electricity tokens drop fast, cable subscriptions activate at once, and airtime or data top-up reflects immediately. When users need speed — especially in urgent moments — the app delivers."
        />

        {/* Second Row - Phone Mockup (spans 2 columns) */}
        <div className="col-span-2 flex justify-center py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-bg-primary rounded-full blur-3xl opacity-20 scale-75"></div>
            <Image
              src="/svgs/misc/smipay-mockup.svg"
              alt="Smipay App"
              width={350}
              height={350}
              className="relative z-10 object-cover"
            />
          </div>
        </div>

        {/* Third Row - 2 cards */}
        <FeatureCard
          icon={<ShieldPlus className="w-6 h-6" />}
          title="Safe and Transparent"
          description="Users can track every kobo spent, review past transactions, and monitor all activity in real time. Strong security and protection systems keep personal and financial information safe, reducing the risk of fraud and giving users full peace of mind."
        />
        <FeatureCard
          icon={<BadgePercent className="w-6 h-6" />}
          title="Pay Less, Stress Less"
          description="No transport cost, no agent fees, no hidden deductions. Users get better control of their spending, pay bills with intention, and avoid the typical inconvenience of queueing at agents. The app helps them handle everyday payments with ease and affordability."
        />
      </div>

      {/* Mobile Layout: Stacked */}
      <div className="md:hidden space-y-6">
        {/* First 2 cards */}
        <FeatureCard
          icon={<Smartphone className="w-5 h-5" />}
          title="All Your Daily Payments in One Place"
          description="No need to jump between multiple apps or stand in queues. From airtime and electricity to cable, school payments, and online shopping, everything happens in one platform. This saves time, reduces stress, and gives users a central place to manage their money and everyday transactions."
        />
        <FeatureCard
          icon={<Timer className="w-5 h-5" />}
          title="Instant Payments"
          description="The app processes transactions quickly, giving users immediate results. Electricity tokens drop fast, cable subscriptions activate at once, and airtime or data top-up reflects immediately. When users need speed — especially in urgent moments — the app delivers."
        />

        {/* Phone Mockup */}
        <div className="flex justify-center py-4 sm:py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-bg-primary rounded-full blur-3xl opacity-20 scale-75"></div>
            <Image
              src="/svgs/misc/smipay-mockup.svg"
              alt="Smipay App"
              width={300}
              height={300}
              className="relative z-10 object-cover w-[220px] h-[220px] sm:w-[300px] sm:h-[300px]"
            />
          </div>
        </div>

        {/* Last 2 cards */}
        <FeatureCard
          icon={<ShieldPlus className="w-5 h-5" />}
          title="Safe and Transparent"
          description="Users can track every kobo spent, review past transactions, and monitor all activity in real time. Strong security and protection systems keep personal and financial information safe, reducing the risk of fraud and giving users full peace of mind."
        />
        <FeatureCard
          icon={<BadgePercent className="w-5 h-5" />}
          title="Pay Less, Stress Less"
          description="No transport cost, no agent fees, no hidden deductions. Users get better control of their spending, pay bills with intention, and avoid the typical inconvenience of queueing at agents. The app helps them handle everyday payments with ease and affordability."
        />
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-sm bg-brand-bg-primary text-white flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-brand-text-primary text-sm sm:text-base md:text-lg font-semibold">{title}</h3>
      <p className="text-brand-text-secondary text-xs sm:text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
