"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Sprout,
  Trash2,
  Pencil,
} from "lucide-react";
import { adminKycApi } from "@/services/admin/kyc-api";
import type {
  TierPropertyDefinition,
  TierPropertyValueType,
} from "@/types/admin/kyc";
import {
  TIER_PROPERTY_CATEGORIES,
  TIER_PROPERTY_VALUE_TYPES,
} from "@/types/admin/kyc";

interface TierPropertiesPanelProps {
  properties: TierPropertyDefinition[];
  onChanged: () => void;
}

const emptyForm = {
  key: "",
  label: "",
  description: "",
  value_type: "NUMBER" as TierPropertyValueType,
  unit: "",
  category: "limits",
  sort_order: 0,
};

export function TierPropertiesPanel({
  properties,
  onChanged,
}: TierPropertiesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(false);
  };

  const startEdit = (property: TierPropertyDefinition) => {
    setIsOpen(true);
    setShowForm(true);
    setEditingId(property.id);
    setForm({
      key: property.key,
      label: property.label,
      description: property.description ?? "",
      value_type: property.value_type,
      unit: property.unit ?? "",
      category: property.category ?? "general",
      sort_order: property.sort_order,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        key: form.key.trim().toLowerCase(),
        label: form.label.trim(),
        description: form.description.trim() || undefined,
        value_type: form.value_type,
        unit: form.unit.trim() || undefined,
        category: form.category || undefined,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingId) {
        await adminKycApi.updateProperty(editingId, payload);
      } else {
        await adminKycApi.createProperty(payload);
      }
      resetForm();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setError(null);
    try {
      await adminKycApi.deleteProperty(id);
      if (editingId === id) resetForm();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete property");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      await adminKycApi.seedProperties();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed properties");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <section className="bg-dashboard-surface border border-dashboard-border/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-4 py-3 sm:px-5 border-b border-dashboard-border/40 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-dashboard-bg/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-dashboard-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-dashboard-muted" />
          )}
          <div>
            <h2 className="text-sm font-semibold text-dashboard-heading">
              Tier properties
            </h2>
            <p className="text-xs text-dashboard-muted mt-0.5">
              {properties.length} defined · limits, verifications, and feature flags
            </p>
          </div>
        </div>
        <span
          role="button"
          tabIndex={0}
          aria-disabled={seeding}
          onClick={(e) => {
            if (seeding) return;
            e.stopPropagation();
            handleSeed();
          }}
          onKeyDown={(e) => {
            if (seeding) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              handleSeed();
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg ${seeding ? "opacity-50 pointer-events-none" : ""}`}
        >
          {seeding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sprout className="h-3.5 w-3.5" />
          )}
          Seed defaults
        </span>
      </button>

      {isOpen && (
      <div className="p-4 sm:p-5 space-y-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!showForm && !editingId ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-dashboard-border/60 hover:bg-dashboard-bg"
          >
            <Plus className="h-3.5 w-3.5" />
            Add property
          </button>
        ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="key e.g. daily_transfer_limit"
            disabled={!!editingId}
            className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-bg"
          />
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Label"
            className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-bg"
          />
          <select
            value={form.value_type}
            onChange={(e) =>
              setForm({
                ...form,
                value_type: e.target.value as TierPropertyValueType,
              })
            }
            className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-bg"
          >
            {TIER_PROPERTY_VALUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-bg"
          >
            {TIER_PROPERTY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="Unit (optional) e.g. NGN"
            className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-bg"
          />
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: Number(e.target.value) })
            }
            placeholder="Sort order"
            className="px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-bg"
          />
        </div>

        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-lg border border-dashboard-border/60 bg-dashboard-bg"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.key.trim() || !form.label.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : editingId ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {editingId ? "Update property" : "Add property"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60"
            >
              Cancel edit
            </button>
          )}
          {!editingId && (
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-dashboard-border/60"
            >
              Cancel
            </button>
          )}
        </div>
        </>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-dashboard-muted border-b border-dashboard-border/40">
                <th className="py-2 pr-3">Key</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-dashboard-border/20 hover:bg-dashboard-bg/40"
                >
                  <td className="py-2.5 pr-3 font-mono text-[11px]">{p.key}</td>
                  <td className="py-2.5 pr-3">{p.label}</td>
                  <td className="py-2.5 pr-3">{p.value_type}</td>
                  <td className="py-2.5 pr-3">{p.category ?? "—"}</td>
                  <td className="py-2.5 pr-3">{p.unit ?? "—"}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="p-1.5 rounded hover:bg-dashboard-bg"
                        aria-label={`Edit ${p.label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleteId === p.id}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                        aria-label={`Delete ${p.label}`}
                      >
                        {deleteId === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-dashboard-muted">
                    No properties yet. Seed defaults or add your first property.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </section>
  );
}
