import { redirect } from "next/navigation";

export default function SettingsIndexPage() {
  redirect("/unified-admin/settings/app-version");
}
