# Individual transporter integration contract

Status: proposed, not implemented. The individual application UI makes no vendor API request.

## Existing backend

`POST /api/vendors` maps a normalized `vendor` object to `CreateVendorServiceInput`. `CompleteVendorOnboardingInput` requires business, owner, contact, registeredAddress, acceptedTerms and submittedBy. It also accepts optional vehicles, documents and bankDetails. Company name and contact email are required by the current model/validator. `INDIVIDUAL_OWNER_DRIVER` exists, but does not remove these requirements.

The present individual form allows optional email and uses a more detailed local vehicle catalogue. There is no dedicated individual application route accepting this form. Sending its flat fields to the company endpoint would not satisfy the current contract. The company form and its Supabase sign-in are unchanged at `/partner/company`.

## Required application API

Provide authenticated `POST /api/partner-applications/individual`, owner-scoped `GET/PATCH /api/partner-applications/individual/:id`, and an explicit submit operation. These are proposed paths, not live endpoints. Resolve user identity from a verified Supabase session; never trust a client user ID or verification status.

Draft input needs a schema version, idempotency key, applicant full name, verified mobile, optional email, service-city identifier, address, vehicle category code from `lib/local-services.ts`, optional manufacturer/model, registration number and payload capacity in kg. Address normalization must either collect a PIN/state or resolve those server-side; do not invent missing company fields.

Document input needs typed metadata for driving licence, RC, insurance, pollution certificate, PAN/Aadhaar: private storage object ID, issuing authority, document number where required, issue/expiry dates and applicant consent. Add an explicit pollution-document mapping/type and mappings for open/closed truck lengths. Metadata alone is not verification evidence. Provide authenticated uploads to private storage, file validation, ownership checks and signed downloads before accepting documents; full identity numbers must not be returned in public responses.

Payout input needs account holder, bank name, account number, IFSC and optional UPI, with protected storage and masked reads. Backend review owns document, payout and vendor activation statuses. No application becomes an active vendor automatically.

Return application ID, version, status, saved timestamp and field-level validation errors. Use optimistic concurrency for updates and idempotency for submission. Allow incomplete drafts but enforce required contact, vehicle, document, payout and terms fields on submission. Define how approved applications map into the existing vendor, vehicle, document and bank operations transactionally, including duplicate registration/mobile checks.

## Current local draft

Only browser-local saving is enabled. All fields can be left incomplete while drafting; populated email, phone, capacity and bank-format fields receive browser validation. Document numbers, bank account number and UPI ID are excluded from persistence. PAN/Aadhaar captures only document type, name and last four characters. No files are uploaded, no documents verified, and no registration is submitted. The UI states these limits and supports restore and clear.
