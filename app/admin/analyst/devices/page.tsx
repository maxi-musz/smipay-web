"use client";

import { useCallback } from "react";
import { Smartphone } from "lucide-react";

import { analyticsApi } from "@/services/admin/analytics-api";
import { SectionShell } from "../_components/section";
import { useAnalytics } from "../_components/use-analytics";
import { ChartCard, BreakdownTable } from "../_components/cards";
import { CategoryDonut } from "../_components/charts";
import { fmtInt } from "../_components/format";

export default function AnalystDevicesPage() {
  const fetcher = useCallback(
    (range: string) => analyticsApi.devices({ range }),
    [],
  );
  const { range, setRange, data, loading, error, retry } = useAnalytics(fetcher);

  return (
    <SectionShell
      title="Devices & Platform"
      subtitle="Where activity happens"
      icon={Smartphone}
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      onRetry={retry}
    >
      {data && (
        <>
          <p className="text-xs text-dashboard-muted">{data.note}</p>
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="By platform" subtitle="iOS / Android / Web">
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
