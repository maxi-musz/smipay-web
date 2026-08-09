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
  // Belt-and-braces with proxy.ts — layout also redirects so a stale build or
  // a matcher miss never serves the signup form while web registration is off.
  if (!WEB_REGISTRATION_ENABLED) {
    redirect(MOBILE_ONLY_PATH);
  }

  return <>{children}</>;
}
