import Link from "next/link";
import {
  Bot,
  CheckSquare,
  ChevronRight,
  Clock,
  FlaskConical,
  PlugZap,
  Power,
  Settings,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { SectionHeader, Card } from "../_components/Helpers";

const SECTIONS = [
  {
    href: "/unified-admin/smileai/settings/provider",
    icon: Bot,
    title: "Provider",
    desc: "Active LLM and embeddings models",
  },
  {
    href: "/unified-admin/smileai/settings/vector-store",
    icon: FlaskConical,
    title: "Vector store",
    desc: "Where knowledge base embeddings live",
  },
  {
    href: "/unified-admin/smileai/settings/limits",
    icon: Sliders,
    title: "Limits",
    desc: "Rate and cost caps, emergency switch",
  },
  {
    href: "/unified-admin/smileai/settings/safety",
    icon: ShieldAlert,
    title: "Safety",
    desc: "Never-disclose patterns, refusal copy",
  },
  {
    href: "/unified-admin/smileai/settings/services",
    icon: PlugZap,
    title: "Service availability",
    desc: "Turn services on/off — what Smiley says is live",
  },
  {
    href: "/unified-admin/smileai/settings/lifecycle",
    icon: Clock,
    title: "Lifecycle",
    desc: "Idle nudges, auto-close, stale cleanup",
  },
  {
    href: "/unified-admin/smileai/settings/mode",
    icon: Power,
    title: "Read/Write mode",
    desc: "Global Smile permissions (admin override of per-user)",
  },
  {
    href: "/unified-admin/smileai/approvals",
    icon: CheckSquare,
    title: "Pending approvals",
    desc: "Second-admin sign-off for sensitive actions and personas",
  },
];

export default function SettingsIndexPage() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <SectionHeader
        title="Settings"
        description="Configure providers, limits, and safety"
        icon={<Settings className="h-5 w-5" />}
      />
      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="p-4 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-dashboard-bg flex items-center justify-center text-dashboard-muted shrink-0">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dashboard-heading">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-dashboard-muted">
                      {s.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-dashboard-muted" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
