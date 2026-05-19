import type { MemberOrderSummary } from "@/lib/domain/members/summaries";

type MemberOrderHistoryProps = {
  orders: MemberOrderSummary[];
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    currency,
    style: "currency",
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function MemberOrderHistory({ orders }: MemberOrderHistoryProps) {
  const totalDaypasses = orders.reduce((sum, order) => sum + order.daypassQuantity, 0);
  const recentOrder = orders[0] ?? null;

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange">Orders</p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-ink">Purchase summary</h2>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.12em] text-ink/58">
          {totalDaypasses} Daypass{totalDaypasses === 1 ? "" : "es"}
        </p>
      </div>

      {recentOrder ? (
        <p className="mt-4 text-sm font-semibold leading-6 text-ink/68">
          Recent order: {formatMoney(recentOrder.totalCents, recentOrder.currency)} on{" "}
          {formatDate(recentOrder.createdAt)}.
        </p>
      ) : (
        <p className="mt-4 text-sm font-semibold leading-6 text-ink/68">
          No purchases yet. Daypass orders will appear here after checkout.
        </p>
      )}

      {orders.length > 0 ? (
        <div className="mt-5 divide-y divide-border">
          {orders.slice(0, 5).map((order) => (
            <div className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center" key={order.id}>
              <div>
                <p className="text-sm font-black leading-6 text-ink">{formatMoney(order.totalCents, order.currency)}</p>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/46">
                  {formatDate(order.createdAt)} - {formatStatus(order.status)}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink/62">
                {order.daypassQuantity > 0
                  ? `${order.daypassQuantity} Daypass${order.daypassQuantity === 1 ? "" : "es"}`
                  : `${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
