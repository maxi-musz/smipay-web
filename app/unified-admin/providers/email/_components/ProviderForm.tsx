"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Cloud,
  Copy,
  Info,
  Loader2,
  Mail,
  Send,
  Server,
  X,
  XCircle,
} from "lucide-react";
import type {
  EmailDriver,
  EmailProviderConfig,
  EmailProviderDefaults,
} from "@/types/admin/email-providers";

export const SES_REGIONS: { value: string; label: string }[] = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "af-south-1", label: "Africa (Cape Town)" },
  { value: "ca-central-1", label: "Canada (Central)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-west-2", label: "Europe (London)" },
  { value: "eu-west-3", label: "Europe (Paris)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
  { value: "eu-north-1", label: "Europe (Stockholm)" },
  { value: "eu-south-1", label: "Europe (Milan)" },
  { value: "me-south-1", label: "Middle East (Bahrain)" },
  { value: "il-central-1", label: "Israel (Tel Aviv)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-southeast-3", label: "Asia Pacific (Jakarta)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", label: "Asia Pacific (Seoul)" },
  { value: "ap-northeast-3", label: "Asia Pacific (Osaka)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
];

export const DRIVER_META: Record<
  EmailDriver,
  {
    label: string;
    description: string;
    defaultName: string;
    tracking: boolean;
    icon: typeof Mail;
    tile: string;
    baseUrl?: string;
  }
> = {
  ses: {
    label: "Amazon SES",
    description: "Send through AWS using your SES SMTP credentials.",
    defaultName: "Amazon SES",
    tracking: true,
    icon: Cloud,
    tile: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  resend: {
    label: "Resend",
    description: "Send with a Resend API key.",
    defaultName: "Resend",
    tracking: true,
    icon: Send,
    tile: "bg-violet-50 text-violet-700 ring-violet-200",
    baseUrl: "https://api.resend.com",
  },
  sendgrid: {
    label: "SendGrid",
    description: "Send with a Twilio SendGrid API key.",
    defaultName: "SendGrid",
    tracking: true,
    icon: Mail,
    tile: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    baseUrl: "https://api.sendgrid.com",
  },
  smtp: {
    label: "Custom SMTP",
    description: "Gmail or any other SMTP server.",
    defaultName: "SMTP",
    tracking: false,
    icon: Server,
    tile: "bg-teal-50 text-teal-700 ring-teal-200",
  },
};

const DRIVER_ORDER: EmailDriver[] = ["ses", "resend", "sendgrid", "smtp"];

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || "/api/v1";
const API_IS_LOCAL = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(API_ORIGIN);

const SNS_TOPIC_ARN = /^arn:aws[a-z-]*:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9_-]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sesSmtpHost(region: string) {
  return `email-smtp.${region}.amazonaws.com`;
}

export function webhookUrl(driver: EmailDriver) {
  return `${API_ORIGIN}${API_VERSION}/webhooks/${driver}`;
}

export type ProviderEditForm = {
  driver: EmailDriver | "";
  name: string;
  base_url: string;
  api_key: string;
  password: string;
  webhook_secret: string;
  from_email: string;
  from_name: string;
  reply_to: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  ses_region: string;
  ses_configuration_set: string;
  sns_topic_arn: string;
  notes: string;
};

export type ProviderFormErrors = Partial<
  Record<keyof ProviderEditForm, string>
>;

export function emptyProviderForm(): ProviderEditForm {
  return {
    driver: "",
    name: "",
    base_url: "",
    api_key: "",
    password: "",
    webhook_secret: "",
    from_email: "",
    from_name: "",
    reply_to: "",
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    ses_region: "",
    ses_configuration_set: "",
    sns_topic_arn: "",
    notes: "",
  };
}

export function withDriver(
  form: ProviderEditForm,
  driver: EmailDriver,
  takenNames: string[],
): ProviderEditForm {
  const meta = DRIVER_META[driver];
  const previousDefault = form.driver
    ? DRIVER_META[form.driver].defaultName
    : "";
  const keepName = form.name && !form.name.startsWith(previousDefault);
  return {
    ...form,
    driver,
    name: keepName ? form.name : uniqueName(meta.defaultName, takenNames),
    base_url: meta.baseUrl ?? "",
    smtp_port: form.smtp_port || "587",
  };
}

function uniqueName(base: string, taken: string[]) {
  const lower = new Set(taken.map((n) => n.toLowerCase()));
  if (!lower.has(base.toLowerCase())) return base;
  let i = 2;
  while (lower.has(`${base} ${i}`.toLowerCase())) i++;
  return `${base} ${i}`;
}

export function providerToEditForm(p: EmailProviderConfig): ProviderEditForm {
  const d = p.defaults ?? {};
  return {
    ...emptyProviderForm(),
    driver: p.driver as EmailDriver,
    name: p.name,
    base_url: p.base_url ?? "",
    from_email: d.from_email ?? "",
    from_name: d.from_name ?? "",
    reply_to: d.reply_to ?? "",
    smtp_host: d.smtp_host ?? "",
    smtp_port: String(d.smtp_port ?? 587),
    smtp_user: d.smtp_user ?? "",
    ses_region: d.ses_region ?? "",
    ses_configuration_set: d.ses_configuration_set ?? "",
    sns_topic_arn: d.sns_topic_arn ?? "",
    notes: p.notes ?? "",
  };
}

export function validateProviderForm(
  form: ProviderEditForm,
  isEdit: boolean,
): ProviderFormErrors {
  const e: ProviderFormErrors = {};
  const blank = (v: string) => !v.trim();
  if (!form.driver) return e;

  if (blank(form.name)) e.name = "Give this provider a name.";

  if (form.driver === "resend" || form.driver === "sendgrid") {
    if (!isEdit && blank(form.api_key)) e.api_key = "API key is required.";
  }
  if (form.driver === "smtp" && blank(form.smtp_host)) {
    e.smtp_host = "SMTP host is required.";
  }
  if (form.driver === "ses" && blank(form.ses_region)) {
    e.ses_region = "Pick the region your SES credentials belong to.";
  }
  if (form.driver === "smtp" || form.driver === "ses") {
    if (!/^\d+$/.test(form.smtp_port.trim()))
      e.smtp_port = "Enter a port number.";
    if (blank(form.smtp_user)) e.smtp_user = "SMTP username is required.";
    if (!isEdit && blank(form.password))
      e.password = "SMTP password is required.";
  }

  if (blank(form.from_email)) e.from_email = "Sender address is required.";
  else if (!EMAIL.test(form.from_email.trim()))
    e.from_email = "Enter a valid email.";
  if (form.reply_to.trim() && !EMAIL.test(form.reply_to.trim())) {
    e.reply_to = "Enter a valid email.";
  }
  if (
    form.sns_topic_arn.trim() &&
    !SNS_TOPIC_ARN.test(form.sns_topic_arn.trim())
  ) {
    e.sns_topic_arn = "This doesn't look like an SNS topic ARN.";
  }
  return e;
}

export function buildProviderPayload(form: ProviderEditForm) {
  const t = (v: string) => v.trim();
  const port = Number(form.smtp_port) || 587;

  const defaults: EmailProviderDefaults = {
    from_email: t(form.from_email),
    from_name: t(form.from_name),
    reply_to: t(form.reply_to),
  };
  let baseUrl = t(form.base_url);

  if (form.driver === "smtp") {
    Object.assign(defaults, {
      smtp_host: t(form.smtp_host),
      smtp_port: port,
      smtp_secure: port === 465,
      smtp_user: t(form.smtp_user),
    });
    baseUrl = t(form.smtp_host);
  }
  if (form.driver === "ses") {
    const host = sesSmtpHost(form.ses_region);
    Object.assign(defaults, {
      ses_region: form.ses_region,
      smtp_host: host,
      smtp_port: port,
      smtp_secure: port === 465 || port === 2465,
      smtp_user: t(form.smtp_user),
      ses_configuration_set: t(form.ses_configuration_set),
      sns_topic_arn: t(form.sns_topic_arn),
    });
    baseUrl = host;
  }

  const credentials: Record<string, string> = {};
  if (t(form.api_key)) credentials.api_key = t(form.api_key);
  if (t(form.password)) credentials.password = t(form.password);
  if (t(form.webhook_secret))
    credentials.webhook_secret = t(form.webhook_secret);

  return {
    name: t(form.name),
    base_url: baseUrl || undefined,
    credentials,
    defaults,
    notes: t(form.notes) || undefined,
  };
}

const inputBase =
  "w-full rounded-lg border bg-dashboard-surface px-3 py-2 text-sm text-dashboard-heading placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20";

function inputClass(invalid?: boolean) {
  return `${inputBase} ${
    invalid
      ? "border-red-300 focus:border-red-400"
      : "border-dashboard-border focus:border-brand-bg-primary/60"
  }`;
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-dashboard-heading"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-dashboard-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function DriverTile({
  driver,
  size = "md",
}: {
  driver: EmailDriver;
  size?: "sm" | "md";
}) {
  const meta = DRIVER_META[driver];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${meta.tile} ${
        size === "sm" ? "h-8 w-8" : "h-10 w-10"
      }`}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-dashboard-border bg-dashboard-bg">
      <code className="min-w-0 flex-1 truncate px-3 py-2 font-mono text-xs text-dashboard-heading">
        {value}
      </code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="inline-flex items-center gap-1 border-l border-dashboard-border px-3 text-xs font-medium text-dashboard-muted hover:bg-dashboard-surface hover:text-dashboard-heading"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function WebhookEndpoint({ driver }: { driver: EmailDriver }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-dashboard-heading">
        Webhook endpoint
      </p>
      <CopyField value={webhookUrl(driver)} />
      {API_IS_LOCAL ? (
        <p className="flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          This is a local address that{" "}
          {driver === "ses" ? "AWS" : DRIVER_META[driver].label} can&apos;t
          reach. Use your production API domain with the same path.
        </p>
      ) : null}
    </div>
  );
}

type StepKey = "service" | "connection" | "sender" | "tracking";

const STEP_FIELDS: Record<StepKey, (keyof ProviderEditForm)[]> = {
  service: [],
  connection: [
    "name",
    "ses_region",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "password",
    "api_key",
    "base_url",
  ],
  sender: ["from_email", "from_name", "reply_to", "notes"],
  tracking: ["sns_topic_arn", "ses_configuration_set", "webhook_secret"],
};

const STEP_LABEL: Record<StepKey, string> = {
  service: "Service",
  connection: "Connection",
  sender: "Sender",
  tracking: "Delivery tracking",
};

function stepDescription(step: StepKey, driver: EmailDriver | "") {
  switch (step) {
    case "service":
      return "Choose the service that will send your emails.";
    case "connection":
      if (driver === "ses")
        return "From SES → SMTP settings. These are SMTP credentials, not your AWS login.";
      if (driver === "smtp")
        return "The SMTP server and login used to send mail.";
      return `Paste the API key from your ${driver ? DRIVER_META[driver].label : ""} dashboard.`;
    case "sender":
      return "Who recipients see the email from.";
    case "tracking":
      return driver === "smtp"
        ? "What we can know after an email leaves this provider."
        : "Lets the provider tell us when an email is delivered, bounces or is marked as spam.";
  }
}

function stepSummary(
  step: StepKey,
  form: ProviderEditForm,
  isEdit: boolean,
): string {
  if (step !== "service" && !form.driver) return "";
  switch (step) {
    case "service":
      return form.driver ? DRIVER_META[form.driver].label : "Not chosen";
    case "connection":
      if (form.driver === "ses") return form.ses_region || "Region not set";
      if (form.driver === "smtp") return form.smtp_host || "Host not set";
      return form.api_key
        ? "API key added"
        : isEdit
          ? "API key saved"
          : "API key needed";
    case "sender":
      return form.from_email || "Sender not set";
    case "tracking":
      if (form.driver === "smtp") return "Not available";
      if (form.driver === "ses") return form.sns_topic_arn ? "On" : "Off";
      return form.webhook_secret
        ? "Secret added"
        : isEdit
          ? "Unchanged"
          : "Optional";
  }
}

function pickErrors(errors: ProviderFormErrors, step: StepKey) {
  const out: ProviderFormErrors = {};
  for (const key of STEP_FIELDS[step]) if (errors[key]) out[key] = errors[key];
  return out;
}

export function ProviderEditor({
  mode,
  title,
  form,
  setForm,
  takenNames,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  title: string;
  form: ProviderEditForm;
  setForm: (updater: (prev: ProviderEditForm) => ProviderEditForm) => void;
  takenNames: string[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isEdit = mode === "edit";
  const steps: StepKey[] = isEdit
    ? ["connection", "sender", "tracking"]
    : ["service", "connection", "sender", "tracking"];
  const [step, setStep] = useState<StepKey>(steps[0]);
  const [visited, setVisited] = useState<Set<StepKey>>(new Set());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  const allErrors = validateProviderForm(form, isEdit);
  const index = steps.indexOf(step);
  const isLast = index === steps.length - 1;
  const stepHasErrors = (k: StepKey) =>
    Object.keys(pickErrors(allErrors, k)).length > 0;
  const visibleErrors = visited.has(step) ? pickErrors(allErrors, step) : {};
  const canJumpTo = (k: StepKey) =>
    isEdit ||
    (!!form.driver &&
      steps.indexOf(k) <=
        Math.max(index, ...[...visited].map((v) => steps.indexOf(v) + 1)));

  const goNext = () => {
    setVisited((v) => new Set(v).add(step));
    if (stepHasErrors(step)) return;
    setStep(steps[index + 1]);
  };

  const submit = () => {
    const firstBad = steps.find(stepHasErrors);
    if (firstBad) {
      setVisited(new Set(steps));
      setStep(firstBad);
      return;
    }
    onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-[2px] sm:p-6"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[min(600px,92vh)] w-full max-w-3xl overflow-hidden rounded-2xl border border-dashboard-border/60 bg-dashboard-surface shadow-2xl"
      >
        <aside className="hidden w-56 shrink-0 flex-col border-r border-dashboard-border/60 bg-dashboard-bg px-4 py-5 sm:flex">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-dashboard-muted">
            {isEdit ? "Edit provider" : "New provider"}
          </p>
          <p
            className="mt-1 truncate px-2 text-sm font-semibold text-dashboard-heading"
            title={title}
          >
            {title}
          </p>
          <ol className="mt-5 space-y-1">
            {steps.map((k, i) => {
              const active = k === step;
              const done = !active && visited.has(k) && !stepHasErrors(k);
              const flagged = visited.has(k) && stepHasErrors(k);
              const enabled = canJumpTo(k);
              return (
                <li key={k}>
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => {
                      setVisited((v) => new Set(v).add(step));
                      setStep(k);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition ${
                      active
                        ? "bg-dashboard-surface shadow-sm ring-1 ring-dashboard-border/70"
                        : enabled
                          ? "hover:bg-dashboard-surface/70"
                          : "opacity-50"
                    }`}
                  >
                    <span
                      className={`mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                        flagged
                          ? "bg-red-100 text-red-700"
                          : done
                            ? "bg-emerald-100 text-emerald-700"
                            : active
                              ? "bg-brand-bg-primary text-white"
                              : "bg-dashboard-surface text-dashboard-muted ring-1 ring-dashboard-border"
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-sm ${active ? "font-semibold text-dashboard-heading" : "font-medium text-dashboard-heading/80"}`}
                      >
                        {STEP_LABEL[k]}
                      </span>
                      <span className="block truncate text-xs text-dashboard-muted">
                        {stepSummary(k, form, isEdit)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {form.driver ? (
            <div className="mt-auto flex items-center gap-2.5 rounded-lg border border-dashboard-border/60 bg-dashboard-surface px-2.5 py-2">
              <DriverTile driver={form.driver} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-dashboard-heading">
                  {DRIVER_META[form.driver].label}
                </p>
                <p className="truncate text-[11px] text-dashboard-muted">
                  {DRIVER_META[form.driver].tracking
                    ? "Full delivery tracking"
                    : "Sent status only"}
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-dashboard-border/60 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-medium text-dashboard-muted">
                Step {index + 1} of {steps.length}
                <span className="sm:hidden"> · {title}</span>
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-dashboard-heading">
                {STEP_LABEL[step]}
              </h2>
              <p className="mt-0.5 text-sm text-dashboard-muted">
                {stepDescription(step, form.driver)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => !saving && onClose()}
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashboard-border/60 text-dashboard-muted hover:bg-dashboard-bg hover:text-dashboard-heading"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="h-1 w-full bg-dashboard-bg sm:hidden">
            <div
              className="h-full bg-brand-bg-primary transition-all"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {step === "service" ? (
              <DriverPicker
                selected={form.driver}
                onPick={(driver) => {
                  setForm((f) => withDriver(f, driver, takenNames));
                  setVisited((v) => new Set(v).add("service"));
                  setStep("connection");
                }}
              />
            ) : step === "connection" ? (
              <ConnectionStep
                form={form}
                setForm={setForm}
                errors={visibleErrors}
                isEdit={isEdit}
              />
            ) : step === "sender" ? (
              <SenderStep
                form={form}
                setForm={setForm}
                errors={visibleErrors}
              />
            ) : (
              <TrackingStep
                form={form}
                setForm={setForm}
                errors={visibleErrors}
                isEdit={isEdit}
              />
            )}
          </div>

          <footer className="flex flex-col gap-3 border-t border-dashboard-border/60 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
            {error ? (
              <p className="flex min-w-0 items-start gap-1.5 text-sm text-red-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{error}</span>
              </p>
            ) : null}
            <div className="flex justify-end gap-2 sm:ml-auto">
              {!isEdit && index > 0 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setStep(steps[index - 1])}
                  className="rounded-lg border border-dashboard-border px-4 py-2 text-sm font-medium text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="rounded-lg border border-dashboard-border px-4 py-2 text-sm font-medium text-dashboard-heading hover:bg-dashboard-bg disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              {step === "service" ? null : isEdit || isLast ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={submit}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isEdit ? "Save changes" : "Add provider"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-lg bg-brand-bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-95"
                >
                  Continue
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

type StepProps = {
  form: ProviderEditForm;
  setForm: (updater: (prev: ProviderEditForm) => ProviderEditForm) => void;
  errors: ProviderFormErrors;
  isEdit?: boolean;
};

function makeBind({ form, setForm, errors }: StepProps) {
  return (key: keyof ProviderEditForm) => ({
    id: `provider-${key}`,
    value: form[key],
    "aria-invalid": errors[key] ? true : undefined,
    className: inputClass(!!errors[key]),
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });
}

function DriverPicker({
  selected,
  onPick,
}: {
  selected: EmailDriver | "";
  onPick: (driver: EmailDriver) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DRIVER_ORDER.map((driver) => {
        const meta = DRIVER_META[driver];
        const active = selected === driver;
        return (
          <button
            key={driver}
            type="button"
            onClick={() => onPick(driver)}
            className={`flex flex-col rounded-xl border bg-dashboard-surface p-4 text-left transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/20 ${
              active
                ? "border-brand-bg-primary/60 ring-2 ring-brand-bg-primary/10"
                : "border-dashboard-border hover:border-brand-bg-primary/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <DriverTile driver={driver} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dashboard-heading">
                  {meta.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-dashboard-muted">
                  {meta.description}
                </p>
              </div>
            </div>
            <p
              className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium ${meta.tracking ? "text-emerald-700" : "text-dashboard-muted"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${meta.tracking ? "bg-emerald-500" : "bg-slate-300"}`}
              />
              {meta.tracking
                ? "Tracks deliveries, bounces and complaints"
                : "Tracks sends only"}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function ConnectionStep(props: StepProps) {
  const { form, errors, isEdit } = props;
  const bind = makeBind(props);
  const driver = form.driver as EmailDriver;
  const meta = DRIVER_META[driver];
  const [showAdvanced, setShowAdvanced] = useState(false);
  const secretPlaceholder = (fresh: string) =>
    isEdit ? "Saved. Leave blank to keep it" : fresh;

  return (
    <div className="space-y-4">
      <Field
        id="provider-name"
        label="Display name"
        required
        error={errors.name}
        hint="Shown in the provider chain and message logs."
      >
        <input
          {...bind("name")}
          placeholder={meta.defaultName}
          autoComplete="off"
        />
      </Field>

      {driver === "ses" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
            <Field
              id="provider-ses_region"
              label="Region"
              required
              error={errors.ses_region}
              hint={
                form.ses_region ? (
                  <span className="font-mono">
                    {sesSmtpHost(form.ses_region)}
                  </span>
                ) : (
                  "Where the SMTP credentials were created."
                )
              }
            >
              <select {...bind("ses_region")}>
                <option value="">Select a region</option>
                {SES_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} · {r.value}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="provider-smtp_port"
              label="Port"
              required
              error={errors.smtp_port}
            >
              <select {...bind("smtp_port")}>
                <option value="587">587 · STARTTLS</option>
                <option value="465">465 · TLS</option>
                <option value="2587">2587 · STARTTLS</option>
                <option value="2465">2465 · TLS</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="provider-smtp_user"
              label="SMTP username"
              required
              error={errors.smtp_user}
            >
              <input
                {...bind("smtp_user")}
                placeholder="AKIA…"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field
              id="provider-password"
              label="SMTP password"
              required={!isEdit}
              error={errors.password}
            >
              <input
                {...bind("password")}
                type="password"
                autoComplete="new-password"
                placeholder={secretPlaceholder("SMTP password")}
              />
            </Field>
          </div>
        </>
      ) : driver === "smtp" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field
              id="provider-smtp_host"
              label="SMTP host"
              required
              error={errors.smtp_host}
            >
              <input
                {...bind("smtp_host")}
                placeholder="smtp.gmail.com"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field
              id="provider-smtp_port"
              label="Port"
              required
              error={errors.smtp_port}
            >
              <input
                {...bind("smtp_port")}
                inputMode="numeric"
                placeholder="587"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="provider-smtp_user"
              label="Username"
              required
              error={errors.smtp_user}
            >
              <input
                {...bind("smtp_user")}
                placeholder="you@gmail.com"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field
              id="provider-password"
              label="Password"
              required={!isEdit}
              error={errors.password}
              hint={isEdit ? undefined : "For Gmail, use an app password."}
            >
              <input
                {...bind("password")}
                type="password"
                autoComplete="new-password"
                placeholder={secretPlaceholder("Password or app password")}
              />
            </Field>
          </div>
        </>
      ) : (
        <>
          <Field
            id="provider-api_key"
            label="API key"
            required={!isEdit}
            error={errors.api_key}
          >
            <input
              {...bind("api_key")}
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              placeholder={secretPlaceholder(
                driver === "resend" ? "re_…" : "SG.…",
              )}
            />
          </Field>
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-dashboard-muted hover:text-dashboard-heading"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
              Advanced
            </button>
            {showAdvanced ? (
              <div className="mt-3">
                <Field
                  id="provider-base_url"
                  label="API base URL"
                  hint="Only change this if the provider gave you a different endpoint."
                >
                  <input
                    {...bind("base_url")}
                    placeholder={meta.baseUrl}
                    spellCheck={false}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function SenderStep(props: StepProps) {
  const { form, errors } = props;
  const bind = makeBind(props);
  return (
    <div className="space-y-4">
      <Field
        id="provider-from_email"
        label="From email"
        required
        error={errors.from_email}
        hint={
          form.driver === "ses"
            ? "Must be on a domain or address verified in SES, in the same region."
            : form.driver === "smtp"
              ? "Most SMTP servers only allow the account's own address."
              : "Must be on a domain verified with the provider."
        }
      >
        <input
          {...bind("from_email")}
          type="email"
          placeholder="noreply@smipay.ng"
          autoComplete="off"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="provider-from_name"
          label="From name"
          hint="Defaults to SmiPay."
        >
          <input
            {...bind("from_name")}
            placeholder="SmiPay"
            autoComplete="off"
          />
        </Field>
        <Field
          id="provider-reply_to"
          label="Reply-to"
          error={errors.reply_to}
          hint="Optional."
        >
          <input
            {...bind("reply_to")}
            type="email"
            placeholder="support@smipay.ng"
            autoComplete="off"
          />
        </Field>
      </div>
      <Field
        id="provider-notes"
        label="Internal notes"
        hint="Only visible to admins."
      >
        <textarea
          {...bind("notes")}
          rows={2}
          className={`${inputClass()} resize-none`}
        />
      </Field>
    </div>
  );
}

function TrackingStep(props: StepProps) {
  const { form, errors, isEdit } = props;
  const bind = makeBind(props);
  const driver = form.driver as EmailDriver;

  if (driver === "smtp") {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-dashboard-border/60 bg-dashboard-bg px-3 py-3 text-sm leading-relaxed text-dashboard-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        SMTP servers don&apos;t report what happens after they accept a message,
        so emails sent through this provider stay at &ldquo;Sent&rdquo;. Nothing
        to set up here.
      </p>
    );
  }

  if (driver === "ses") return <SesTracking {...props} />;

  return (
    <div className="space-y-4">
      <WebhookEndpoint driver={driver} />
      <Field
        id="provider-webhook_secret"
        label={driver === "resend" ? "Signing secret" : "Verification key"}
        hint={
          driver === "resend"
            ? "Resend → Webhooks → your endpoint. Starts with whsec_. Subscribe to delivered, bounced and complained."
            : "SendGrid → Mail settings → Event webhook. Subscribe to delivered, bounce and spam report."
        }
        error={errors.webhook_secret}
      >
        <input
          {...bind("webhook_secret")}
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          placeholder={
            isEdit
              ? "Saved. Leave blank to keep it"
              : driver === "resend"
                ? "whsec_…"
                : "Verification key"
          }
        />
      </Field>
    </div>
  );
}

function SesTracking(props: StepProps) {
  const { form, errors } = props;
  const bind = makeBind(props);
  const region = form.ses_region || "your SES region";
  const [guideOpen, setGuideOpen] = useState(false);
  const arnRegion = form.sns_topic_arn.split(":")[3];
  const regionMismatch =
    !errors.sns_topic_arn &&
    form.ses_region &&
    arnRegion &&
    arnRegion !== form.ses_region;

  return (
    <div className="space-y-4">
      <WebhookEndpoint driver="ses" />
      <Field
        id="provider-sns_topic_arn"
        label="SNS topic ARN"
        error={errors.sns_topic_arn}
        hint={
          regionMismatch
            ? `This topic is in ${arnRegion} but SES is set to ${form.ses_region}. They must match.`
            : "Only events from this topic are accepted. Leave blank to keep tracking off."
        }
      >
        <input
          {...bind("sns_topic_arn")}
          placeholder="arn:aws:sns:eu-west-1:123456789012:smipay-ses-events"
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <Field
        id="provider-ses_configuration_set"
        label="Configuration set"
        hint="Leave blank if it's already the default set on your domain."
      >
        <input
          {...bind("ses_configuration_set")}
          placeholder="smipay-tracking"
          spellCheck={false}
          autoComplete="off"
        />
      </Field>

      <div className="rounded-lg border border-dashboard-border/60">
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold text-dashboard-heading"
        >
          <span className="inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-dashboard-muted" />
            How to set this up in AWS
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${guideOpen ? "rotate-180" : ""}`}
          />
        </button>
        {guideOpen ? (
          <ol className="space-y-2.5 border-t border-dashboard-border/60 px-3 py-3 text-xs leading-relaxed text-dashboard-muted">
            {[
              <>
                In <b className="text-dashboard-heading">SNS</b> ({region}),
                create a <b className="text-dashboard-heading">Standard</b>{" "}
                topic and paste its ARN above.
              </>,
              <>
                Save this provider. Then add an{" "}
                <b className="text-dashboard-heading">HTTPS</b> subscription to
                the topic with the webhook endpoint above, raw message delivery
                off. It confirms itself.
              </>,
              <>
                In{" "}
                <b className="text-dashboard-heading">
                  SES → Configuration sets
                </b>
                , create a set with an{" "}
                <b className="text-dashboard-heading">Amazon SNS</b> destination
                on that topic. Tick Deliveries, Hard bounces, Complaints and
                Rejects.
              </>,
              <>
                Enter the set name above, or make it the default set on your
                verified domain.
              </>,
            ].map((text, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dashboard-bg text-[11px] font-semibold text-dashboard-heading ring-1 ring-dashboard-border">
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
