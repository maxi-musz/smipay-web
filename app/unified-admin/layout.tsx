import AdminLayout from "./_components/AdminLayout";

export default function UnifiedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
