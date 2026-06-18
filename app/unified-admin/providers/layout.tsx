import { ProvidersSectionNav } from "./_components/ProvidersSectionNav";

export default function ProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4">
      <ProvidersSectionNav />
      {children}
    </div>
  );
}
