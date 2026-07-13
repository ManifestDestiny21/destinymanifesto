type FormSectionProps = {
  title: string;
  optional?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function FormSection({
  title,
  optional = false,
  defaultOpen = !optional,
  children,
}: FormSectionProps) {
  if (optional) {
    return (
      <details
        className="group rounded-xl border border-slate-200 bg-slate-50/50"
        open={defaultOpen}
      >
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            {title}
            <span className="text-xs font-normal text-slate-500">Optional</span>
            <span
              className="text-slate-400 transition group-open:rotate-180"
              aria-hidden
            >
              ▾
            </span>
          </span>
        </summary>
        <div className="space-y-4 border-t border-slate-200 bg-white px-4 py-4">{children}</div>
      </details>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}
