import Image from "next/image";

const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() ?? "";
const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ?? "";

export default function AppStoreButtons() {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center md:justify-start">
      <StoreButton
        href={appStoreUrl}
        iconSrc="/svgs/misc/appstore.svg"
        labelTop="Download on the"
        labelBottom="App Store"
        labelBottomClassName="tracking-wider"
        ariaLabel="Download SmiPay on the App Store"
      />
      <StoreButton
        href={playStoreUrl}
        iconSrc="/svgs/misc/playstore.svg"
        labelTop="GET IT ON"
        labelBottom="Google Play"
        ariaLabel="Get SmiPay on Google Play"
        comingSoonText="Coming Soon!"
      />
    </div>
  );
}

function StoreButton({
  href,
  iconSrc,
  labelTop,
  labelBottom,
  labelBottomClassName = "",
  ariaLabel,
  comingSoonText = "Coming Soon",
}: {
  href: string;
  iconSrc: string;
  labelTop: string;
  labelBottom: string;
  labelBottomClassName?: string;
  ariaLabel: string;
  comingSoonText?: string;
}) {
  const disabled = !href;
  const inner = (
    <>
      {disabled ? (
        <span
          className="absolute top-0 left-0 -translate-y-1/2 text-[8px] sm:text-[9px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap bg-[#f1fcf6] text-[#00d390]"
        >
          {comingSoonText}
        </span>
      ) : null}
      <Image
        src={iconSrc}
        alt=""
        width={20}
        height={20}
        className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${disabled ? "opacity-50" : ""}`}
        aria-hidden
      />
      <div className={`flex flex-col text-white ${disabled ? "opacity-50" : ""}`}>
        <span className="text-[8px] sm:text-[10px] md:text-xs leading-tight">
          {labelTop}
        </span>
        <span
          className={`text-xs sm:text-sm md:text-lg font-semibold leading-tight ${labelBottomClassName}`}
        >
          {labelBottom}
        </span>
      </div>
    </>
  );

  const className = `relative inline-flex h-10 sm:h-12 md:h-14 items-center gap-1.5 sm:gap-2 md:gap-3 rounded-lg bg-brand-black px-2.5 sm:px-3 md:px-4 shadow-sm ${
    disabled
      ? "cursor-not-allowed pointer-events-none"
      : "cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text-primary"
  }`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={className} role="presentation">
      {inner}
    </div>
  );
}
