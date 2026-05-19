import Link from "next/link";

import { campaign001PublicContent, formatCampaignDateTime } from "@/lib/domain/campaigns/publicContent";

export function CampaignDrawProcessCard() {
  return (
    <section className="bg-cream py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="landing-card-eyebrow">Draw Process</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">What happens before the draw.</h2>
          <dl className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">Entries close</dt>
              <dd className="mt-2 text-sm font-bold leading-6 text-ink/68">
                {formatCampaignDateTime(campaign001PublicContent.timings.entries_close_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">Draw lock</dt>
              <dd className="mt-2 text-sm font-bold leading-6 text-ink/68">
                {formatCampaignDateTime(campaign001PublicContent.timings.draw_lock_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">Planned draw</dt>
              <dd className="mt-2 text-sm font-bold leading-6 text-ink/68">
                {formatCampaignDateTime(campaign001PublicContent.timings.draw_at)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {campaign001PublicContent.drawProcess.map((item) => (
              <p className="rounded-lg border border-ink/10 bg-cream p-4 text-sm font-bold leading-6 text-ink/68" key={item}>
                {item}
              </p>
            ))}
          </div>
          <Link className="mt-6 inline-flex text-sm font-black uppercase tracking-[0.1em] text-orange hover:text-orange-hover" href={campaign001PublicContent.rulesUrl}>
            Read full promo rules
          </Link>
        </article>
      </div>
    </section>
  );
}
