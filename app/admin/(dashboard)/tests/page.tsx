import { AdminPlaceholderPage } from "@/components/admin/AdminPlaceholderPage";

export default function AdminTestsPage() {
  return (
    <AdminPlaceholderPage
      description="Seeded landing-page tests will be listed here later. This milestone only reserves the protected route and navigation entry."
      eyebrow="Landing Tests"
      items={["Preview Pass", "Monthly Pass", "Upgrade Access"]}
      title="Landing test admin placeholder"
    />
  );
}
