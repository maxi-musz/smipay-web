"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import StackingCards, {
  StackingCardItem,
} from "@/components/fancy/blocks/stacking-cards";

const cards = [
  {
    bgColor: "bg-[#F5F1FE]",
    badge: "Airtime & Data",
    title: "Always Stay Connected",
    description:
      "Top up airtime and data in seconds across all major networks. For you, friends, or family — fast, reliable, and always available.",
    image: "/imgs/stack-card-01.png",
  },
  {
    bgColor: "bg-[#FEF3EF]",
    badge: "Electricity",
    title: "Power Your Home Smoothly",
    description:
      "Pay electricity bills and get your token instantly. All major providers supported — no queues, no panic, just power when you need it.",
    image: "/imgs/stack-card-02.png",
  },
  {
    bgColor: "bg-[#F0F1F4]",
    badge: "Cable TV",
    title: "Entertainment Without Interruptions",
    description:
      "Renew your cable subscription in a few taps. Instant activation, no queues — just uninterrupted access to your favorite channels.",
    image: "/imgs/stack-card-03.png",
  },
  {
    bgColor: "bg-[#EDFFFF]",
    badge: "Education",
    title: "Learning Made Easy",
    description:
      "Pay WAEC, JAMB, school fees, and more in one place. Secure, fast, and paperwork-free — so students can focus on learning.",
    image: "/imgs/stack-card-04.png",
  },
  {
    bgColor: "bg-[#E9F2FE]",
    badge: "Travel Payments",
    title: "Pay for Trips with Ease",
    description:
      "Book and pay for flights, hotels, and travel services right from the app. Local or international — fast, secure, and fully tracked.",
    image: "/imgs/stack-card-05.png",
  },
  // {
  //   bgColor: "bg-[#F0F7F6]",
  //   badge: "Betting Wallet Funding",
  //   title: "Quick Betting Top-Ups",
  //   description:
  //     "Fund your betting accounts instantly from one place. No delays, no failed payments — just fast, reliable top-ups.",
  //   image: "/imgs/stack-card-06.png",
  // },
];

export default function StackCard() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 sm:py-16 md:py-24 pb-20 sm:pb-30">
      {/* Heading and Description */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
        <h2 className="text-brand-text-primary text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 sm:mb-4">
          All Your Financial Needs In One Place
        </h2>
        <p className="text-brand-text-secondary text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
          Access a comprehensive range of digital financial services designed to
          make your life easier and finances smarter.
        </p>
      </div>

      {/* Stacking Cards */}
      <div className="relative">
        <StackingCards totalCards={cards.length} scaleMultiplier={0}>
          {cards.map(({ bgColor, badge, description, image, title }, index) => {
            const isImageRight = index % 2 === 0;

            return (
              <StackingCardItem
                key={index}
                index={index}
                className="h-[480px] sm:h-[500px] md:h-[480px] lg:h-[460px] mb-4 sm:mb-6 md:mb-8"
              >
                <div
                  className={cn(
                    bgColor,
                    "h-full flex-col items-center py-4 sm:py-6 md:py-8 lg:py-10 flex w-full rounded-lg mx-auto relative overflow-hidden gap-2 sm:gap-4 md:gap-6 lg:gap-8",
                    isImageRight
                      ? "sm:flex-row-reverse px-3 sm:px-4 md:px-12 lg:px-20"
                      : "sm:flex-row px-3 sm:px-4 md:px-12 lg:px-20",
                  )}
                >
                  {/* Text Content */}
                  <div className="flex-1 flex flex-col justify-center z-10 space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 sm:px-0">
                    <div className="inline-flex items-center justify-center sm:justify-start w-fit px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-brand-bg-primary text-white text-xs sm:text-xs md:text-sm mb-1 sm:mb-3 md:mb-4 lg:mb-5">
                      {badge}
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-brand-text-primary">
                      {title}
                    </h3>
                    <p className="text-xs sm:text-xs md:text-sm leading-relaxed text-brand-text-secondary">
                      {description}
                    </p>
                  </div>

                  {/* Image */}
                  <div
                    className={cn(
                      "w-full sm:w-1/2 flex items-center mt-1 sm:mt-2 md:mt-6 sm:mt-0",
                      isImageRight
                        ? "justify-center sm:justify-start"
                        : "justify-center sm:justify-end",
                    )}
                  >
                    <div className="relative w-[180px] h-[180px] sm:w-[250px] sm:h-[250px] md:w-[320px] md:h-80 lg:w-[350px] lg:h-[350px]">
                      <Image
                        src={image}
                        alt={title}
                        className="object-contain rounded-sm"
                        fill
                        sizes="(max-width: 640px) 180px, (max-width: 768px) 250px, (max-width: 1024px) 320px, 350px"
                      />
                    </div>
                  </div>
                </div>
              </StackingCardItem>
            );
          })}
        </StackingCards>
      </div>
    </section>
  );
}
