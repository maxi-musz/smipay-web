"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ElectricityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/electricity/vtpass");
  }, [router]);

  return null;
}
