import Image from "next/image";

export default function Testimonial() {
  const testimonials = [
    {
      id: 1,
      quote:
        "I use Smipay to pay all my utilities. The app is fast annd user-friendly. Highly recommended!",
      name: "Oluwapelumi Akindele",
      reviewPlace: "App-store review",
      avatar: "/imgs/reviewer-01.jpg",
    },
    {
      id: 2,
      quote:
        "Their save more, spend less feature helped me to save for my car without me noticing.",
      name: "Mayowa Bernard",
      reviewPlace: "App-store review",
      avatar: "/imgs/reviewer-02.png",
    },
    {
      id: 3,
      quote:
        "Smipay makes my bill payments seamless. It’s fast, reliable, and stress-free.",
      name: "Esther O'Funmi",
      reviewPlace: "Play-store review",
      avatar: "/imgs/reviewer-03.jpg",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 sm:py-16 md:py-24">
      {/* Heading and Description */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
        <h2 className="text-brand-text-primary text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 sm:mb-4">
          Users Who Love the Experience
        </h2>
        <p className="text-brand-text-secondary text-xs sm:text-sm md:text-base">
          See how the platform is helping users save time, money, and stress
          every <br className="hidden lg:block" /> day.
        </p>
      </div>

      {/* Unified responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className={`
              ${index === 2 ? "md:col-start-1 lg:col-start-auto" : ""}
            `}
          >
            <TestimonialCard
              quote={testimonial.quote}
              name={testimonial.name}
              reviewPlace={testimonial.reviewPlace}
              avatar={testimonial.avatar}
              isAlternate={index === 1} // Only second card has alternate position on mobile
            />
          </div>
        ))}
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  quote: string;
  name: string;
  reviewPlace: string;
  avatar: string;
  isAlternate: boolean;
}

function TestimonialCard({
  quote,
  name,
  reviewPlace,
  avatar,
  isAlternate,
}: TestimonialCardProps) {
  return (
    <div className="relative">
      {/* Avatar positioned over the card border */}
      <div
        className={`absolute z-10 w-12 h-12 -top-6 ${
          isAlternate ? "right-6 md:left-6" : "left-6"
        }`}
      >
        <div className="rounded-full overflow-hidden">
          <Image
            src={avatar}
            alt={name}
            width={80}
            height={80}
            className="object-cover w-12 h-12 rounded-full"
          />
        </div>
      </div>

      {/* Card content */}
      <div className="border border-gray-200 rounded-sm p-4 sm:p-6 pt-7 sm:pt-8 bg-white shadow-sm mb-6 sm:mb-8 lg:mb-0">
        {/* Quote */}
        <blockquote className="text-brand-text-secondary text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 md:mb-4">
          &quot;{quote}&quot;
        </blockquote>

        {/* Name and review place */}
        <div className="space-y-0.5 sm:space-y-1">
          <h4 className="text-brand-text-primary text-xs sm:text-sm font-medium">
            {name}
          </h4>
          <p className="text-brand-text-secondary text-[11px] sm:text-sm">{reviewPlace}</p>
        </div>
      </div>
    </div>
  );
}
