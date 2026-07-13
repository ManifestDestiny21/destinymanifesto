export function Disclaimer({
  children,
  variant = "info",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "info" | "legal" | "error";
  className?: string;
}) {
  const styles = {
    info: "border-[#01696f]/20 bg-[#01696f]/5 text-[#28251d]",
    legal: "border-[#964219]/25 bg-[#964219]/8 text-[#28251d]",
    error: "border-[#a12c7b]/25 bg-[#a12c7b]/8 text-[#28251d]",
  };

  return (
    <p className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${styles[variant]} ${className}`}>
      {children}
    </p>
  );
}
