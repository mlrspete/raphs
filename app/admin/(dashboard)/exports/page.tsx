import { AdminPlaceholderPage } from "@/components/admin/AdminPlaceholderPage";

export default function AdminExportsPage() {
  return (
    <AdminPlaceholderPage
      description="CSV exports for leads, landing tests, and selected events will be added after dashboard data views exist."
      eyebrow="Exports"
      items={["Lead CSV", "Event CSV", "Export history"]}
      title="Export placeholder"
    />
  );
}
