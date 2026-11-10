# Frameforge — Product Ad Factory (pilot v0.1)

**Product URL → preview → customer request → human verification → automated GitHub Actions Remotion video → independent payment confirmation → private download.**

This repository contains a **working operator-assisted commercial MVP**, not a finished SaaS. Rendering is automatic once an operator approves rights/claims and dispatches a job. The CI demonstration uses a fictional product and original illustrations; real ads require rights-cleared images.

## Features

- Responsive sales landing page: prices, product form, upload and order tracking.
- Product URL inspection: HTTPS, domain allowlists, OpenGraph and JSON-LD; manual fallback for pages that block robots.
- SQLite order records with hashed random tracking tokens; separate admin and worker credentials.
- Public order intake → pending review → human claim and rights approval → GitHub Actions render.
- Authenticated CI worker pulls only approved product data and owner-authorized image; no contact PII is sent to GitHub.
- Remotion 20-second, 1080x1920, 30fps video with generated original soundtrack.
- FFprobe QA for H.264 and AAC; render callbacks upload output privately; payment gated delivery.
- Protected operator console: http://127.0.0.1:3100/admin.html

## Quickstart

Node.js 22 or newer required.

~~~sh
cd product-ad-factory
npm install
npm test
cp .env.example .env
# Set two long random ADMIN_KEY and WORKER_KEY secrets, plus URL allowlists
node --env-file=.env app/server.mjs
~~~

Public customer UI: http://127.0.0.1:3100/
Admin review UI: http://127.0.0.1:3100/admin.html

Render a local fictional demo (FFmpeg required; Remotion installs its headless browser):

~~~sh
npm run render:demo
npm run verify:demo
~~~

Output: out/demo.mp4 and out/video-qa.json.

## Customer flow

1. Merchant provides an allowlisted product HTTPS URL and any available verified details; metadata preview is advisory only.
2. Merchant attests to product-asset rights and uploads image/owner-authorized asset URL; request is stored as pending_review.
3. Reviewer checks each claim, product image identity and rights evidence, then clicks approve in the admin console.
4. Reviewer dispatches approved job. On successful dispatch, backend marks rendering.
5. GitHub Actions retrieves approved data and image via HTTPS and WORKER_KEY. Remotion generates ad; FFprobe validates; worker securely uploads MP4 to backend.
6. Order becomes ready, NOT paid. Operator independently verifies invoice/payment and provides its reference, then marks delivered.
7. Customer checks status using their tracking token in the browser session and downloads MP4.

State path: pending_review → approved → rendering → ready → delivered. Rejected and failed are explicit alternate states.

## Production configuration (not completed)

The backend requires persistent disk and HTTPS. It is NOT suitable for Vercel's ephemeral local filesystem as configured. Use a private GitHub renderer repo before taking confidential client orders.

On backend, configure FACTORY_PUBLIC_URL, GITHUB_REPO, GITHUB_REF, a fine-grained GITHUB_TOKEN with Actions write access for the rendering repo, ADMIN_KEY, WORKER_KEY, ALLOWED_MERCHANT_HOSTS and ALLOWED_ASSET_HOSTS.

In GitHub environment product-ad-pilot, set secrets FACTORY_PUBLIC_URL and FACTORY_WORKER_KEY (same worker key as backend). For a live customer, the workflow file must first exist in the repository default branch for workflow_dispatch to work. In this PR only the public fictional sample CI runs.

For high-volume production add persistent private object storage, managed Postgres, billing gateway, admin SSO, rate limits across multiple instances, retention controls, backups and formal security review.

## Known limitations

- No payment gateway or automatic invoices. No money collected here; operator enters only a payment already verified externally.
- Growth and Scale are managed-service offers; no credit accounting, self-service subscriptions or multi-product batch fulfillment yet.
- A URL is not a license: no automatic rights clearance or claim approval. Merchant feeds, authorization APIs and approved images preferred over uncontrolled scraping.
- Merchant URLs sometimes block automated metadata reads. Manual brief+upload is the supported fallback.
- Web copy in the prototype should receive legal review, including privacy, refunds, customer terms and promotional claims.
- Pilot stores files locally on a single SQLite-backed server; protect the storage volume, back up, and set retention policy.
- Pilot uses one 9:16 template. The business roadmap adds sizes, variants and voiceover after paid traction.
- Public GitHub repository is for source and fictional CI only. Do not upload private customer data or real video output as public Actions artifacts.

See docs/business-launch.md, docs/operator-runbook.md and docs/security-readiness.md.
