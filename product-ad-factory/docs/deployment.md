# Pilot deployment guide: Railway or equivalent persistent-disk host

The MVP is not publicly deployed. Before live customer traffic, complete the readiness checklist and independent review.

1. Use a dedicated PRIVATE GitHub repository for production code and customer video rendering; migrate the product-ad-factory folder, maintain the same workflow name.
2. Deploy this product-ad-factory directory as the service root. The Dockerfile installs backend dependencies only; Remotion/FFmpeg run in GitHub Actions.
3. Add a mounted persistent volume at /data. Set DATA_DIR=/data, HOST=0.0.0.0, PORT to platform assigned service port; do not store SQLite in an ephemeral file system.
4. Generate two long independent random secrets ADMIN_KEY and WORKER_KEY. Never send them in chat or commit them in source.
5. Configure ALLOWED_MERCHANT_HOSTS and ALLOWED_ASSET_HOSTS for pilot clients only. Start with one verified merchant domain.
6. Enable public HTTPS domain and set FACTORY_PUBLIC_URL to it. Protect admin console behind authentication and, if possible, IP restrictions. Do not use public service for commercial customer data until privacy/retention/legal review.
7. In backend set GITHUB_REPO=owner/private-render-repo, GITHUB_REF=main, and GITHUB_TOKEN with Actions workflow write permission only.
8. Merge product-ad-factory.yml to the production repository default branch and create environment product-ad-pilot with secrets FACTORY_PUBLIC_URL and FACTORY_WORKER_KEY (equal to backend WORKER_KEY).
9. Use a fictional/demo merchant order to verify intake, image upload, claim review, dispatch, job rendering, secure return upload, ready state and payment-gated download. Do not enter a fake paid reference for a real client.
10. Configure backup/restore and private image retention. Monitor HTTP errors, GitHub Actions costs, failed render rate and 99th percentile time.

Notes: SQLite/volume is single-writer pilot architecture, not scale-out. Do not host on Vercel ephemeral file storage without migrating database and binary files to managed persistent services. Check Railway plan charges before enabling a public instance.
