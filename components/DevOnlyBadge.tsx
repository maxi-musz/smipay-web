/**
 * Marks UI that is shown only when {@link isDevAdminEmail} is true.
 */
export function DevOnlyBadge() {
  return (
    <span
      className="ml-1 inline-flex shrink-0 items-center justify-center h-3 min-w-3 rounded-[1px] border border-violet-500/60 bg-violet-100 px-[2px] text-[6px] font-bold uppercase leading-none text-violet-900"
      title="Dev-only visibility"
    >
      dev
    </span>
  );
}
