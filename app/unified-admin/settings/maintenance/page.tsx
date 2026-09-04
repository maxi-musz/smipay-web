import { redirect } from "next/navigation";

/**
 * Maintenance was folded into Settings → Security (the "Availability" sub-tabs)
 * on 2026-08-07, so the kill switches sit next to the rules for the same flow.
 * Kept as a redirect so existing bookmarks and links don't 404.
 */
export default function MaintenanceSettingsRedirect() {
  redirect("/unified-admin/settings/security");
}
