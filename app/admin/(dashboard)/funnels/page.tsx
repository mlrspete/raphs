import { AdminPlaceholderPage } from "@/components/admin/AdminPlaceholderPage";

export default function AdminFunnelsPage() {
  return (
    <AdminPlaceholderPage
      description="Conversion steps from page view to paid intent to waitlist capture will be visualised here later."
      eyebrow="Funnels"
      items={["Homepage funnel", "Landing page funnel", "Offer comparison"]}
      title="Funnel workspace placeholder"
    />
  );
}
