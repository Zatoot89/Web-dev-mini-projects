# Operator workflow and QA

## Intake
Open /admin.html with ADMIN_KEY. Never put keys into public source, screenshots or messaging. Confirm customer brand ownership, store/merchant URL, email and deliverable.

## Claims + media
Check rights note and supporting evidence. Each promised feature must match the exact product variant; remove unsupported warranty, medical, battery, discount or performance claims. Confirm photo quality, model/color accuracy and license to use. Do not substitute a different product. A listing URL alone grants no content rights.

If automatic URL inspection fails, have the customer enter details and submit owned photographs. Approval stores reviewed copy and an authorized photo on the private backend volume.

## Workflow
Approve → Dispatch → monitor Actions logs → Ready. The customer cannot download until verified payment is recorded via Deliver. This app does not verify bank transfers or automatically charge cards.

If CI dispatch fails, check GITHUB_TOKEN/REF and that workflow exists on default branch. If worker cannot reach backend, check HTTPS address and FACTORY_WORKER_KEY. If render fails, check browser dependencies, image encoding, audio and FFprobe log.

## Client service pilot
One initial video, one basic revision for Single Ad; new concept or product is separately charged. Do not promise instant delivery before repeated customer pilots. Handle refunds and complaints under written terms.

## Data and operational safeguards
Store remains private; backups and a 90-day media-retention policy should be implemented before production. Do not store real client media as public Actions artifacts. Rotate secrets after incidents; disable merchant domains that redirect or return unsafe metadata.
