"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  UTILITIES_PURCHASES_DISABLED,
  isUtilityPurchasePath,
} from "@/lib/dashboard-utilities";

/** Redirects direct URL visits to utility purchase pages back to the dashboard home. */
export function UtilitiesPurchaseGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!UTILITIES_PURCHASES_DISABLED) return;
    if (!pathname || !isUtilityPurchasePath(pathname)) return;
    router.replace("/dashboard");
  }, [pathname, router]);

  return null;
}
