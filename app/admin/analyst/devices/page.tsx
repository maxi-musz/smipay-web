"use client";

import { Smartphone } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { ChartCard, BreakdownTable } from "../_components/cards";
import { CategoryDonut } from "../_components/charts";
import { fmtInt } from "../_components/format";
import { METRIC_HELP } from "../_components/metric-glossary";
import { HelpTooltip } from "../_components/help-tooltip";

export default function AnalystDevicesPage() {
  const { range, setRange, data, loading, error, retry } = useAnalytics(
    "devices",
    (r) => analyticsApi.devices({ range: r }),
  );

  return (
    <SectionShell
      title="Devices & Platform"
      subtitle="Where activity happens"
      icon={Smartphone}
      section="devices"
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
      exports={
        data
          ? [
              { name: "by-platform", rows: data.by_platform },
              { name: "by-device-model", rows: data.by_device_model },
              { name: "by-location", rows: data.by_location },
            ]
          : []
      }
    >
      {data && (
        <>
          <p className="flex items-center gap-1.5 text-xs text-dashboard-muted">
            {data.note}
            <HelpTooltip text={METRIC_HELP.deviceActivityNote} />
          </p>
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="By platform" subtitle="iOS / Android / Web" tooltip={METRIC_HELP.deviceActivityNote}>
              <CategoryDonut
                data={data.by_platform.map((c) => ({ label: c.label, value: c.count }))}
              />
            </ChartCard>
            <ChartCard title="Top locations" subtitle="By activity">
              <BreakdownTable
                rows={data.by_location.map((c) => ({ label: c.label, value: c.count }))}
                valueHeader="Events"
                format={fmtInt}
              />
            </ChartCard>
            <ChartCard title="Top device models" className="lg:col-span-2">
              <BreakdownTable
                rows={data.by_device_model.map((c) => ({ label: c.label, value: c.count }))}
                valueHeader="Events"
                format={fmtInt}
              />
            </ChartCard>
          </div>
        </>
      )}
    </SectionShell>
  );
}
