# Security & operational readiness matrix

| Gate | Status | Notes |
|---|---|---|
| URL protocol, redirects, DNS and size checks | Implemented in pilot | Domain allowlist; separate merchant and image lists |
| Client tracking token | Implemented | 32-byte random secret, SHA-256 hash in SQLite |
| Admin and worker secrets | Implemented | Two independent secrets, minimum 24 characters |
| API rate-limit | Implemented, single instance | Move to shared store for multi-instance production |
| Human claim and image-rights approval | Implemented | Operator must review source and approve |
| Original non-copyright soundtrack | Implemented | Pure synthesized audio |
| Video quality validation | Implemented | FFprobe 1080x1920/30fps, H.264, AAC |
| Merchant metadata reliability | Partial | OG/JSON-LD; dynamic pages may block |
| Encrypted transport / public domain | NOT DEPLOYED | Terminate HTTPS at trusted reverse proxy |
| Persistent database/media backups | NOT DEPLOYED | Mount private volume and tested backup restore |
| Production GitHub Actions worker credentials | NOT CONFIGURED | Environment and Secrets required |
| Payment collection/verification | MANUAL ONLY | No checkout, auto-charge or refunds yet |
| Operator SSO, audit logging, privacy terms | NOT READY | Security/legal tasks before real customers |
| Private commercial render repo | NOT READY | Move from public test repo before live customer data |
| Credential and DNS rebinding hardening | Review required | Test all redirects/DNS, prevent abuse and rebindings |
| Revision/credit ledger and subscription billing | NOT IMPLEMENTED | Growth/Scale are concierge offers |

### Production go/no-go
Do not expose this pilot to untrusted users on the public internet until HTTPS, rate limiting, backups, secret rotation, storage and independently reviewed security controls are complete. Do not accept real paid orders before compliant business terms and applicable UAE permissions are confirmed.
