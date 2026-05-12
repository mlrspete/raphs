import { AdminPlaceholderPage } from "@/components/admin/AdminPlaceholderPage";

export default function AdminOverviewPage() {
  return (
    <AdminPlaceholderPage
      description="A protected home for the V0 validation dashboard. Metrics, funnels, and latest activity will land here after the admin data views are built."
      eyebrow="Overview"
      items={["Demand summary", "Latest leads", "Recent intent events"]}
      title="Dashboard shell is ready."
    />
  );
}
