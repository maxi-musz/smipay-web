"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Save,
  Settings2,
} from "lucide-react";
import { adminKycApi } from "@/services/admin/kyc-api";
import type {
  KycTier,
  TierPropertyDefinition,
  TierPropertyValueType,
} from "@/types/admin/kyc";
import {
  FormattedAmountInput,
  formatAmountLabel,
} from "./FormattedAmountInput";

interface TierListPanelProps {
  tiers: KycTier[];
  properties: TierPropertyDefinition[];
  onChanged: () => void;
}

function defaultValueForType(type: TierPropertyValueType): unknown {
  switch (type) {
    case "NUMBER":
      return 0;
    case "BOOLEAN":
      return false;
    case "STRING":
      return "";
    case "VERIFICATION":
      return true;
    default:
      return null;
  }
}

const CATEGORY_ORDER = ["verification", "limits", "features", "general"] as const;

function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function groupPropertiesByCategory(
  items: TierPropertyDefinition[],
): Record<string, TierPropertyDefinition[]> {
  const groups: Record<string, TierPropertyDefinition[]> = {};
  for (const property of items) {
    const key = property.category ?? "general";
    if (!groups[key]) groups[key] = [];
    groups[key].push(property);
  }
  return groups;
}

function formatPropertyValue(
  type: TierPropertyValueType,
  value: unknown,
  unit?: string | null,
): string {
  if (type === "VERIFICATION") return "Required";
  if (type === "BOOLEAN") return value ? "Yes" : "No";
  if (type === "NUMBER") {
    if (value === null || value === "unlimited") return "Unlimited";
    const n = Number(value);
    if (Number.isNaN(n)) return "—";
    return formatAmountLabel(n, unit);
  }
  return String(value ?? "—");
}

function isUnlimitedValue(value: unknown): boolean {
  return value === null || value === "unlimited";
}

interface AssignmentDraft {
  selected: boolean;
  value: unknown;
  unlimited: boolean;
}

interface TierInfoDraft {
  tier: string;
  name: string;
  description: string;
  order: number;
  is_active: boolean;
}

function tierToInfoDraft(tier: KycTier): TierInfoDraft {
  return {
    tier: tier.tier,
    name: tier.name,
    description: tier.description ?? "",
    order: tier.order,
    is_active: tier.is_active,
  };
}

function serializeTierInfo(draft: TierInfoDraft): string {
  return JSON.stringify({
    tier: draft.tier.trim().toUpperCase(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    order: Number(draft.order),
    is_active: draft.is_active,
  });
}

function buildAssignmentDraft(
  tier: KycTier,
  activeProperties: TierPropertyDefinition[],
): Record<string, AssignmentDraft> {
  const draft: Record<string, AssignmentDraft> = {};
  for (const property of activeProperties) {
    const existing = tier.properties.find((p) => p.id === property.id);
    const unlimited =
      property.value_type === "NUMBER" &&
      existing != null &&
      isUnlimitedValue(existing.value);
    draft[property.id] = {
      selected: !!existing,
      unlimited,
      value: unlimited
        ? 0
        : (existing?.value ?? defaultValueForType(property.value_type)),
    };
  }
  return draft;
}

function normalizedAssignments(
  draft: Record<string, AssignmentDraft>,
  propertyDefinitions: TierPropertyDefinition[],
): string {
  const propsById = new Map(propertyDefinitions.map((p) => [p.id, p]));
  const entries = Object.entries(draft)
    .filter(([, v]) => v.selected)
    .map(([property_id, v]) => {
      const prop = propsById.get(property_id);
      const value =
        v.unlimited && prop?.value_type === "NUMBER" ? null : v.value;
      return [property_id, value] as const;
    })
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

export function TierListPanel({
  tiers,
  properties,
  onChanged,
}: TierListPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsExpandedId, setDetailsExpandedId] = useState<string | null>(null);
  const [tierInfoDraft, setTierInfoDraft] = useState<TierInfoDraft | null>(null);
  const [infoSaving, setInfoSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, Set<string>>
  >({});
  const [expandedChipTiers, setExpandedChipTiers] = useState<Set<string>>(
    new Set(),
  );
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    tier: "",
    name: "",
    description: "",
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState<
    Record<string, AssignmentDraft>
  >({});
  const [assignmentBaseline, setAssignmentBaseline] = useState("");
  const [tierInfoBaseline, setTierInfoBaseline] = useState("");
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextOrder = useMemo(() => {
    if (tiers.length === 0) return 1;
    return Math.max(...tiers.map((t) => t.order)) + 1;
  }, [tiers]);

  const activeProperties = properties.filter((p) => p.is_active);
  const groupedProperties = useMemo(
    () => groupPropertiesByCategory(activeProperties),
    [activeProperties],
  );

  const assignmentsDirty = useMemo(
    () =>
      normalizedAssignments(assignmentDraft, activeProperties) !==
      assignmentBaseline,
    [assignmentDraft, assignmentBaseline, activeProperties],
  );

  const tierInfoDirty = useMemo(() => {
    if (!tierInfoDraft) return false;
    return serializeTierInfo(tierInfoDraft) !== tierInfoBaseline;
  }, [tierInfoDraft, tierInfoBaseline]);

  const toggleCategory = (tierId: string, category: string) => {
    setExpandedCategories((prev) => {
      const tierSet = new Set(prev[tierId] ?? []);
      if (tierSet.has(category)) tierSet.delete(category);
      else tierSet.add(category);
      return { ...prev, [tierId]: tierSet };
    });
  };

  const toggleChipList = (tierId: string) => {
    setExpandedChipTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tierId)) next.delete(tierId);
      else next.add(tierId);
      return next;
    });
  };

  const openAssignments = (tier: KycTier) => {
    setDetailsExpandedId(null);
    setTierInfoDraft(null);
    setTierInfoBaseline("");
    setExpandedId(tier.id);
    setExpandedCategories((prev) => ({ ...prev, [tier.id]: new Set() }));
    const draft = buildAssignmentDraft(tier, activeProperties);
    setAssignmentDraft(draft);
    setAssignmentBaseline(normalizedAssignments(draft, activeProperties));
    setError(null);
  };

  const openTierDetails = (tier: KycTier) => {
    setExpandedId(null);
    setAssignmentBaseline("");
    setAssignmentDraft({});
    setDetailsExpandedId(tier.id);
    const infoDraft = tierToInfoDraft(tier);
    setTierInfoDraft(infoDraft);
    setTierInfoBaseline(serializeTierInfo(infoDraft));
    setError(null);
  };

  const closeTierDetails = () => {
    setDetailsExpandedId(null);
    setTierInfoDraft(null);
    setTierInfoBaseline("");
    setError(null);
  };

  const handleSaveTierInfo = async (tierId: string) => {
    if (!tierInfoDraft) return;
    setInfoSaving(true);
    setError(null);
    try {
      await adminKycApi.updateTier(tierId, {
        tier: tierInfoDraft.tier.trim().toUpperCase(),
        name: tierInfoDraft.name.trim(),
        description: tierInfoDraft.description.trim() || undefined,
        order: Number(tierInfoDraft.order),
        is_active: tierInfoDraft.is_active,
      });
      setTierInfoBaseline(serializeTierInfo(tierInfoDraft));
      closeTierDetails();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tier");
    } finally {
      setInfoSaving(false);
    }
  };

  const handleCreateTier = async () => {
    setCreateSaving(true);
    setError(null);
    try {
      await adminKycApi.createTier({
        tier: createForm.tier.trim().toUpperCase(),
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
      });
      setCreateForm({ tier: "", name: "", description: "" });
      setCreating(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tier");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleSaveAssignments = async (tierId: string) => {
    setAssignmentSaving(true);
    setError(null);
    try {
      const assignments = Object.entries(assignmentDraft)
        .filter(([, v]) => v.selected)
        .map(([property_id, v]) => ({
          property_id,
          value:
            v.unlimited && properties.find((p) => p.id === property_id)?.value_type === "NUMBER"
              ? null
              : v.value,
        }));

      await adminKycApi.setTierProperties(tierId, assignments);
      setAssignmentBaseline(normalizedAssignments(assignmentDraft, activeProperties));
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save tier properties",
      );
    } finally {
      setAssignmentSaving(false);
    }
  };

  return (
    <section className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl overflow-hidden">
      <div className="px-4 py-3 sm:px-5 border-b border-dashboard-border/40 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-dashboard-heading">
            Account tiers
          </h2>
          <p className="text-xs text-dashboard-muted mt-0.5">
            New tiers auto-receive order {nextOrder}. Assign properties per tier below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Create tier
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {creating && (
          <div className="rounded-lg border border-dashboard-border/50 bg-dashboard-bg/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-dashboard-heading">
              New tier (order will be {nextOrder})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={createForm.tier}
                onChange={(e) =>
                  setCreateForm({ ...createForm, tier: e.target.value.toUpperCase() })
                }
                placeholder="Code e.g. TIER_2"
                className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-surface"
              />
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Display name"
                className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-surface"
              />
              <input
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Description (optional)"
                className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-surface"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateTier}
                disabled={
                  createSaving ||
                  !createForm.tier.trim() ||
                  !createForm.name.trim()
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white disabled:opacity-50"
              >
                {createSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {tiers.map((tier) => {
            const isPropertiesExpanded = expandedId === tier.id;
            const isDetailsExpanded = detailsExpandedId === tier.id;
            return (
              <div
                key={tier.id}
                className="rounded-lg border border-dashboard-border/50 overflow-hidden"
              >
                <div className="px-4 py-3 bg-dashboard-bg/30 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-dashboard-muted">
                        Order {tier.order}
                      </span>
                      {!tier.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-dashboard-heading">
                      {tier.name}
                    </h3>
                    <p className="text-[11px] text-dashboard-muted font-mono">
                      {tier.tier}
                    </p>
                    {tier.description ? (
                      <p className="text-[11px] text-dashboard-muted mt-0.5 line-clamp-2">
                        {tier.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        isDetailsExpanded
                          ? closeTierDetails()
                          : openTierDetails(tier)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit details
                      {isDetailsExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        isPropertiesExpanded
                          ? setExpandedId(null)
                          : openAssignments(tier)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Configure properties
                      {isPropertiesExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {isDetailsExpanded && tierInfoDraft && (
                  <div className="px-4 py-4 border-t border-dashboard-border/30 space-y-3 bg-dashboard-bg/20">
                    <p className="text-xs font-semibold text-dashboard-heading">
                      Tier information
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-dashboard-muted uppercase tracking-wider mb-1">
                          Display name
                        </label>
                        <input
                          value={tierInfoDraft.name}
                          onChange={(e) =>
                            setTierInfoDraft({
                              ...tierInfoDraft,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-surface"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-dashboard-muted uppercase tracking-wider mb-1">
                          Tier code
                        </label>
                        <input
                          value={tierInfoDraft.tier}
                          onChange={(e) =>
                            setTierInfoDraft({
                              ...tierInfoDraft,
                              tier: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-surface font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-dashboard-muted uppercase tracking-wider mb-1">
                          Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={tierInfoDraft.order}
                          onChange={(e) =>
                            setTierInfoDraft({
                              ...tierInfoDraft,
                              order: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-surface"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-dashboard-muted uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <textarea
                        value={tierInfoDraft.description}
                        onChange={(e) =>
                          setTierInfoDraft({
                            ...tierInfoDraft,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-surface"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-dashboard-heading">
                      <input
                        type="checkbox"
                        checked={tierInfoDraft.is_active}
                        onChange={(e) =>
                          setTierInfoDraft({
                            ...tierInfoDraft,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      Active tier (visible to users)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveTierInfo(tier.id)}
                        disabled={
                          infoSaving ||
                          !tierInfoDirty ||
                          !tierInfoDraft.name.trim() ||
                          !tierInfoDraft.tier.trim()
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white disabled:opacity-50"
                      >
                        {infoSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save tier details
                      </button>
                      <button
                        type="button"
                        onClick={closeTierDetails}
                        className="px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {tier.properties.length > 0 && !isPropertiesExpanded && !isDetailsExpanded && (
                  <div className="px-4 py-2 border-t border-dashboard-border/30">
                    <button
                      type="button"
                      onClick={() => toggleChipList(tier.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] text-dashboard-muted hover:text-dashboard-heading"
                    >
                      {expandedChipTiers.has(tier.id) ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      {tier.properties.length} propert
                      {tier.properties.length === 1 ? "y" : "ies"} assigned
                    </button>
                    {expandedChipTiers.has(tier.id) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tier.properties.map((p) => (
                          <span
                            key={p.id}
                            className="text-[11px] px-2 py-1 rounded-full bg-dashboard-bg border border-dashboard-border/40"
                          >
                            {p.label}:{" "}
                            {formatPropertyValue(p.value_type, p.value, p.unit)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isPropertiesExpanded && (
                  <div className="px-4 py-4 border-t border-dashboard-border/30 space-y-2">
                    {activeProperties.length === 0 ? (
                      <p className="text-xs text-dashboard-muted">
                        Add tier properties in the catalog above first.
                      </p>
                    ) : (
                      [...CATEGORY_ORDER, ...Object.keys(groupedProperties).filter(
                        (c) => !CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number]),
                      )].filter((cat) => groupedProperties[cat]?.length).map((category) => {
                        const categoryProps = groupedProperties[category] ?? [];
                        const tierCategories = expandedCategories[tier.id] ?? new Set();
                        const categoryOpen = tierCategories.has(category);
                        const selectedInCategory = categoryProps.filter(
                          (p) => assignmentDraft[p.id]?.selected,
                        ).length;

                        return (
                          <div
                            key={category}
                            className="rounded-lg border border-dashboard-border/40 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleCategory(tier.id, category)}
                              className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left bg-dashboard-bg/40 hover:bg-dashboard-bg/60 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {categoryOpen ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-dashboard-muted" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-dashboard-muted" />
                                )}
                                <span className="text-xs font-semibold text-dashboard-heading">
                                  {categoryLabel(category)}
                                </span>
                                <span className="text-[10px] text-dashboard-muted">
                                  {categoryProps.length} · {selectedInCategory} selected
                                </span>
                              </div>
                            </button>

                            {categoryOpen && (
                              <div className="px-3 py-2 space-y-2 border-t border-dashboard-border/30">
                                {categoryProps.map((property) => {
                                  const draft = assignmentDraft[property.id] ?? {
                                    selected: false,
                                    unlimited: false,
                                    value: defaultValueForType(property.value_type),
                                  };

                                  return (
                                    <div
                                      key={property.id}
                                      className={`rounded-lg border px-3 py-2.5 transition-colors ${
                                        draft.selected
                                          ? "border-brand-bg-primary/25 bg-brand-bg-primary/[0.03]"
                                          : "border-dashboard-border/30 bg-dashboard-bg/20"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <label className="flex items-start gap-2.5 min-w-0 flex-1 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={draft.selected}
                                            onChange={(e) =>
                                              setAssignmentDraft({
                                                ...assignmentDraft,
                                                [property.id]: {
                                                  ...draft,
                                                  selected: e.target.checked,
                                                },
                                              })
                                            }
                                            className="mt-0.5 accent-brand-bg-primary"
                                          />
                                          <div className="min-w-0">
                                            <span className="text-xs font-medium text-dashboard-heading block">
                                              {property.label}
                                            </span>
                                            <span className="text-[10px] text-dashboard-muted font-mono block mt-0.5">
                                              {property.key} · {property.value_type}
                                              {property.unit ? ` · ${property.unit}` : ""}
                                            </span>
                                          </div>
                                        </label>

                                        {draft.selected &&
                                          property.value_type === "VERIFICATION" && (
                                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                              Required
                                            </span>
                                          )}

                                        {draft.selected &&
                                          property.value_type === "BOOLEAN" && (
                                            <select
                                              value={draft.value ? "true" : "false"}
                                              onChange={(e) =>
                                                setAssignmentDraft({
                                                  ...assignmentDraft,
                                                  [property.id]: {
                                                    ...draft,
                                                    value: e.target.value === "true",
                                                  },
                                                })
                                              }
                                              className="shrink-0 w-28 px-2 py-1.5 text-xs rounded-lg border border-dashboard-border/60 bg-white"
                                            >
                                              <option value="true">Enabled</option>
                                              <option value="false">Disabled</option>
                                            </select>
                                          )}
                                      </div>

                                      {draft.selected &&
                                        property.value_type === "NUMBER" && (
                                          <div className="mt-2.5 pl-7 flex flex-wrap items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dashboard-muted shrink-0 rounded-full border border-dashboard-border/50 bg-white px-2.5 py-1.5 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={draft.unlimited}
                                                onChange={(e) =>
                                                  setAssignmentDraft({
                                                    ...assignmentDraft,
                                                    [property.id]: {
                                                      ...draft,
                                                      unlimited: e.target.checked,
                                                    },
                                                  })
                                                }
                                                className="accent-brand-bg-primary"
                                              />
                                              Unlimited
                                            </label>
                                            {draft.unlimited ? (
                                              <span className="text-xs font-semibold text-dashboard-heading tabular-nums">
                                                No cap
                                              </span>
                                            ) : (
                                              <FormattedAmountInput
                                                value={Number(draft.value) || 0}
                                                onChange={(v) =>
                                                  setAssignmentDraft({
                                                    ...assignmentDraft,
                                                    [property.id]: {
                                                      ...draft,
                                                      value: v,
                                                    },
                                                  })
                                                }
                                                unit={property.unit}
                                              />
                                            )}
                                          </div>
                                        )}

                                      {draft.selected &&
                                        property.value_type === "STRING" && (
                                          <div className="mt-2.5 pl-7">
                                            <input
                                              type="text"
                                              value={String(draft.value ?? "")}
                                              onChange={(e) =>
                                                setAssignmentDraft({
                                                  ...assignmentDraft,
                                                  [property.id]: {
                                                    ...draft,
                                                    value: e.target.value,
                                                  },
                                                })
                                              }
                                              className="w-full px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-white"
                                            />
                                          </div>
                                        )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    <button
                      type="button"
                      onClick={() => handleSaveAssignments(tier.id)}
                      disabled={assignmentSaving || !assignmentsDirty}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {assignmentSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {assignmentsDirty ? "Save tier properties" : "No changes to save"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {tiers.length === 0 && (
            <p className="text-sm text-dashboard-muted text-center py-8">
              No tiers configured yet. Create your first tier to get started.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
