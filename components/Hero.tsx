import { PartyPopper } from "lucide-react";
import Image from "next/image";
import AppStoreButtons from "./AppStoreButtons";

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 bg-white">
      <div className="mt-8 sm:mt-12 md:mt-20 grid grid-cols-1 items-center gap-6 sm:gap-8 md:gap-12 lg:grid-cols-2">
        <div className="space-y-3 sm:space-y-5 text-center lg:text-left flex flex-col items-center lg:items-start">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-brand-bg-primary px-4 sm:px-6 py-2 sm:py-3 text-white">
            <PartyPopper className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Financial revolution awaits you</span>
          </div>
          <h1 className="text-brand-text-primary text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[130%] sm:leading-[140%] tracking-[0%] font-semibold">
            The Smarter Way to Take Control of Your Money
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-brand-text-secondary max-w-xl">
            Experience seamless digital transactions, instant airtime & data
            top-ups, bill payments, all in one powerful
            platform.
          </p>
          <div className="pt-1 sm:pt-2">
            <AppStoreButtons />
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <div className="overflow-hidden w-full flex justify-center lg:justify-end">
            <Image
              src="/imgs/smipay-hero-image.png"
              alt="Hero placeholder"
              width={480}
              height={480}
              className="object-cover w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[480px] rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
