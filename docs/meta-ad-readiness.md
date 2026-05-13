# Meta Ad Readiness

Milestone 12 prepares Raph's Market V0 for paid Meta traffic without adding Meta Conversions API or payment flows.

## URL Parameters

Use this convention for Meta ad destination URLs:

```text
utm_source=meta
utm_medium=paid_social
utm_campaign=
utm_content=
utm_term=
meta_campaign_id=
meta_adset_id=
meta_ad_id=
```

Example:

```text
https://example.com/l/preview-pass?utm_source=meta&utm_medium=paid_social&utm_campaign=preview-pass-test&utm_content=deck-angle-a&meta_campaign_id={{campaign.id}}&meta_adset_id={{adset.id}}&meta_ad_id={{ad.id}}
```

## Meta Pixel

Set `NEXT_PUBLIC_META_PIXEL_ID` to enable browser Pixel events.

Mapped events:

- `paid_intent_clicked` -> `PaidIntentClicked`
- `sold_out_modal_opened` -> `SoldOutModalOpened`
- `waitlist_submitted` -> standard `Lead`

If `NEXT_PUBLIC_META_PIXEL_ID` is missing, the helper no-ops and the app should not crash.

## Turnstile

Set these variables to enable Cloudflare Turnstile:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

When `TURNSTILE_SECRET_KEY` is missing, server verification no-ops. This keeps local development and unconfigured previews usable. When configured, `/api/waitlist` requires a valid Turnstile token before saving a lead.

## Consent

The waitlist form requires explicit marketing consent. Consent is not prechecked, no SMS consent is requested, and `privacy_version` is included with each waitlist submission.
