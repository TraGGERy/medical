# DiagnoGenie Application Audit (May 18, 2026)

## Scope
- Static code audit of API routes, auth boundaries, webhook handling, and operational controls.
- Light operational checks via lint command.

## Executive Summary
The app has a solid baseline in many endpoints (Clerk auth checks are present and Stripe/Clerk webhooks verify signatures), but there are **high-impact privacy and abuse risks** that should be addressed before production hardening:

1. **IDOR/privacy bypass in biometrics endpoint** due to `sample_user` exception.
2. **No rate limiting / anti-automation controls** on expensive AI endpoints and sensitive data APIs.
3. **Unsafe file-processing pathway** can inflate prompt size/cost and ingest arbitrary file text with weak validation.
4. **Code quality debt** (lint failures, `any`, unused vars) increases risk of latent auth/data-handling bugs.

## Findings

### 1) Biometric data authorization bypass (High)
**Location:** `src/app/api/biometrics/[userId]/route.ts`

The route enforces ownership, but explicitly allows any authenticated user to request `sample_user` data:

- Access rule allows request when `userId === 'sample_user'`.
- Fallback reads `sample_user` data if no user data exists.

Even if this is “demo” data, it creates a pattern for exception-based authorization and can accidentally expose real data if the placeholder is ever replaced.

**Recommendation:**
- Remove special-case `sample_user` in production code.
- Gate demo data behind explicit non-production flag (e.g., `NODE_ENV !== 'production'`).
- Return empty dataset for unknown users instead of fallback to alternate account data.

### 2) Missing rate limiting and abuse protections (High)
**Locations:**
- `src/app/api/ai/analyze-symptoms/route.ts`
- `src/app/api/ai/full-diagnostic/route.ts`
- `src/app/api/export-data/route.ts`
- `src/app/api/delete-data/route.ts`

Sensitive and/or expensive endpoints are auth-protected but appear to lack per-user/IP throttling, anomaly detection, or cooldown controls.

**Risk:**
- Cost amplification against AI providers.
- Service degradation and accidental DoS.
- High-volume personal data export/delete automation after credential compromise.

**Recommendation:**
- Add per-user and per-IP rate limits (e.g., token bucket with stricter limits on AI routes).
- Add operation quotas and audit logs for export/delete actions.
- Add backoff and circuit-breaker handling for provider failures.

### 3) File upload validation is incomplete for AI diagnostic endpoint (Medium)
**Location:** `src/app/api/ai/full-diagnostic/route.ts`

The file processor checks size per file (10MB) and MIME labels, but:
- No explicit max file count.
- No strict allowlist + signature sniffing.
- Text content is embedded directly into prompt context (truncated to 1000 chars per file) without normalization/redaction.

**Risk:**
- Prompt-injection attempts via uploaded text.
- Runaway token/cost usage through many files.
- Ingestion of sensitive/irrelevant payloads.

**Recommendation:**
- Enforce file count cap and total payload cap.
- Use robust MIME + magic-byte validation.
- Add pre-prompt sanitizer/redactor pipeline and explicit prompt-injection guards.

### 4) Robust webhook verification present, but resiliency can be improved (Low)
**Locations:**
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/webhooks/clerk/route.ts`

Both routes verify signatures correctly before processing events (good). Remaining opportunities:
- Add idempotency tracking for event IDs to prevent replayed business effects.
- Persist failed event handling with retry/dead-letter workflow.

### 5) Lint/type issues reduce confidence for production safety (Medium)
**Locations:** multiple (see lint output)

`npm run lint` currently fails with explicit errors (`no-explicit-any`, invalid `<a>` usage for internal link) and many warnings.

**Risk:**
- Lower maintainability and harder-to-spot correctness/security issues.

**Recommendation:**
- Treat lint errors as release blockers.
- Reduce `any` usage in API/webhook handlers first.

## Priority Remediation Plan
1. **Immediate (0-2 days):**
   - Remove biometrics `sample_user` auth exception.
   - Add rate limits to AI + export/delete routes.
2. **Short term (3-7 days):**
   - Harden file upload validation and payload caps.
   - Add event idempotency table for webhook event IDs.
3. **Near term (1-2 weeks):**
   - Resolve lint errors and raise TS strictness in API layer.
   - Add structured audit logging for data lifecycle actions.

## Commands Executed
- `npm run -s lint`
- `sed -n ...` inspections on target API route files
