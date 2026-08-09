import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  MOBILE_ONLY_PATH,
  WEB_REGISTRATION_ENABLED,
} from "@/lib/web-access";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!WEB_REGISTRATION_ENABLED) {
    redirect(MOBILE_ONLY_PATH);
  }

  return <>{children}</>;
}
