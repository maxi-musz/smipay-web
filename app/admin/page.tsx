"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { fetchAdminHomePath } from "@/lib/admin-home";

/** Sends staff to the correct admin home based on user type tags. */
export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    void fetchAdminHomePath().then((path) => {
      router.replace(path);
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dashboard-bg">
      <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
    </div>
  );
}
