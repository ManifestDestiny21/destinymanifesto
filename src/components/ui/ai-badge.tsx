export function AiBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#01696f]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#01696f] ${className}`}
    >
      AI-generated
    </span>
  );
}
