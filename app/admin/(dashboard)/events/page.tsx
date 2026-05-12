import { AdminPlaceholderPage } from "@/components/admin/AdminPlaceholderPage";

export default function AdminEventsPage() {
  return (
    <AdminPlaceholderPage
      description="Business-critical raw events from Supabase event logs will be browsable here later."
      eyebrow="Events"
      items={["Paid intent", "Modal opens", "Waitlist activity"]}
      title="Event log placeholder"
    />
  );
}
