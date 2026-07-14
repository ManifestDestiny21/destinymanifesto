import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void | Promise<void>;
  type?: "button" | "submit";
  disabled?: boolean;
};

const variants = {
  primary:
    "bg-[#01696f] text-white hover:bg-[#0c4e54] shadow-sm",
  secondary:
    "border border-[#7a7974]/40 bg-[#fbfbf9] text-[#28251d] hover:border-[#01696f]/40",
  ghost: "text-[#01696f] hover:bg-[#01696f]/8",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const base = `inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className} ${disabled ? "pointer-events-none opacity-50" : ""}`;

  if (href) {
    return (
      <Link href={href} className={base} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={base} disabled={disabled}>
      {children}
    </button>
  );
}
