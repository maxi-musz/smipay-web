"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/services/user-api";
import type { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Loader2, Trash2, XCircle, CheckCircle2 } from "lucide-react";

type ViewState = "idle" | "requesting" | "cancelling";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await userApi.getProfile();
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.message || "Unable to load your profile.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const requested = !!profile?.user.requested_account_deletion;

  const handleRequestDeletion = async () => {
    if (viewState !== "idle") return;
    try {
      setViewState("requesting");
      setError(null);
      setSuccessMessage(null);
      const res = await userApi.requestAccountDeletion(reason);
      setSuccessMessage(res?.message || "Your account deletion request has been received.");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                requested_account_deletion: true,
              },
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request account deletion.");
    } finally {
      setViewState("idle");
    }
  };

  const handleCancelDeletion = async () => {
    if (viewState !== "idle") return;
    try {
      setViewState("cancelling");
      setError(null);
      setSuccessMessage(null);
      const res = await userApi.cancelAccountDeletionRequest();
      setSuccessMessage(res?.message || "Your account deletion request has been cancelled.");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                requested_account_deletion: false,
              },
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel deletion request.");
    } finally {
      setViewState("idle");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-brand-bg-primary" />
          <p className="text-sm text-dashboard-muted">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center px-4">
        <div className="bg-dashboard-surface rounded-xl border border-red-200 px-4 py-5 max-w-md w-full text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-4">
            {error || "We could not load your account details. Please try again from your dashboard."}
          </p>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isBusy = viewState === "requesting" || viewState === "cancelling";

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <header className="bg-dashboard-surface border-b border-dashboard-border/60 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/settings-profile")}
            className="h-9 w-9 shrink-0 rounded-xl text-dashboard-muted hover:text-dashboard-heading hover:bg-dashboard-border/50 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-dashboard-heading tracking-tight">
              Delete Account
            </h1>
            <p className="text-xs sm:text-sm text-dashboard-muted mt-0.5 truncate">
              Permanently remove your Smipay account
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 max-w-xl mx-auto space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 sm:p-5 flex gap-3">
          <div className="mt-0.5">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm sm:text-base font-semibold text-red-800">
              This action is serious and permanent
            </h2>
            <ul className="list-disc pl-4 space-y-1.5 text-xs sm:text-sm text-red-900">
              <li>You will lose access to your Smipay account and transaction history.</li>
              <li>Your login details will no longer work once deletion is completed.</li>
              <li>
                For compliance reasons, limited records may be retained for anti‑fraud, audit, and regulatory
                purposes.
              </li>
            </ul>
            <p className="text-xs sm:text-sm text-red-900/80">
              After you request deletion, your account is queued for removal. You can change your mind and cancel
              the request any time within <strong>30 days</strong>, as long as your account has not already been
              permanently deleted.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {!requested ? (
          <section className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-dashboard-heading">
                Request account deletion
              </h2>
              <p className="text-xs sm:text-sm text-dashboard-muted mt-1">
                You can leave optional feedback to help us understand why you are leaving. This will not delay or
                prevent deletion.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="delete-reason"
                className="text-[11px] sm:text-xs font-medium text-dashboard-muted"
              >
                Reason for closing your account (optional)
              </label>
              <textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-dashboard-border/60 bg-dashboard-bg px-3 py-2 text-sm text-dashboard-heading placeholder:text-dashboard-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-bg-primary/60 focus:border-brand-bg-primary"
                placeholder="Tell us why you’re leaving Smipay (optional)…"
              />
              <p className="text-[11px] text-dashboard-muted text-right">
                {reason.length}/500
              </p>
            </div>

            <Button
              type="button"
              onClick={handleRequestDeletion}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {viewState === "requesting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting request…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Request account deletion
                </>
              )}
            </Button>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashboard-border/60 bg-dashboard-surface p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-semibold text-dashboard-heading">
                  Account deletion pending
                </h2>
                <p className="text-xs sm:text-sm text-dashboard-muted">
                  You have already requested that your Smipay account be deleted. We are processing this request and
                  you will be notified by email once deletion is complete.
                </p>
                <p className="text-xs sm:text-sm text-dashboard-muted">
                  If you change your mind within <strong>30 days</strong>, you can cancel this request below, as long
                  as your account has not yet been permanently deleted.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDeletion}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 border-dashboard-border/80 text-dashboard-heading hover:bg-dashboard-bg"
            >
              {viewState === "cancelling" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling request…
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  Cancel deletion request
                </>
              )}
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}

