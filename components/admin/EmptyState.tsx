type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-ink/18 bg-white p-8 text-center">
      <p className="text-lg font-black text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-ink/58">{description}</p>
    </div>
  );
}
