import { AdminPlaceholderPage } from "@/components/admin/AdminPlaceholderPage";

export default function AdminLeadsPage() {
  return (
    <AdminPlaceholderPage
      description="Waitlist lead review, attribution context, and preference summaries will be added in a later milestone."
      eyebrow="Leads"
      items={["Email leads", "Preferences", "Attribution"]}
      title="Lead workspace placeholder"
    />
  );
}
