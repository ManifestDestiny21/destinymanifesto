type BrandLogoProps = {
  size?: "sm" | "lg";
};

export function BrandLogo({ size = "lg" }: BrandLogoProps) {
  const iconClass = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const titleClass =
    size === "lg" ? "text-3xl font-bold tracking-tight" : "text-xl font-semibold";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-192.png"
        alt="Destiny Manifesto"
        className={`${iconClass} rounded-2xl shadow-lg shadow-blue-500/25`}
        width={size === "lg" ? 56 : 40}
        height={size === "lg" ? 56 : 40}
      />
      <span className={titleClass}>Destiny Manifesto</span>
    </div>
  );
}
