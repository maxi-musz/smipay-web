import SmileAiSectionNav from "./_components/SmileAiSectionNav";

export const metadata = {
  title: "SmileAI · SmiPay Admin",
};

export default function SmileAiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen">
      <SmileAiSectionNav />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
