export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#28251d]">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm leading-relaxed text-[#7a7974]">{subtitle}</p>
      ) : null}
    </header>
  );
}
