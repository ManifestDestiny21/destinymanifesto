export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#7a7974]/15 bg-[#fbfbf9] p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
