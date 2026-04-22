# Security Specification - FitAI SaaS

This document defines the security invariants and testing payloads for the FitAI application to ensure enterprise-grade security for commercialization.

## 1. Data Invariants

- **Identity Isolation**: A user can NEVER read or write another user's profile data (`/users/{userId}`).
- **Role & Plan Integrity**: The `role` and `planType` fields are **IMMUTABLE** for the user. Only Admins can modify these fields.
- **Relational Integrity**: Workouts and Progress records MUST contain the `userId` of the creator, which must match the authenticated user.
- **Resource Denial Prevention**: All String and Array fields must have strict size limits.
- **System Integrity**: `system/config` is publicly readable but restricted to Admins for any write operation.
- **Terminal State**: Once a subscription record or workout is "archived" (if implemented), it shouldn't be editable.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

These payloads are designed to test the robustness of the Firestore Rules. All must return `PERMISSION_DENIED`.

| ID | Target Path | Action | Malicious Intent |
|---|---|---|---|
| P1 | `/users/other-uid` | `write` | **Identity Spoofing**: Attempt to overwrite another user's profile. |
| P2 | `/users/my-uid` | `update` | **Privilege Escalation**: Attempt to change `role` to 'admin'. |
| P3 | `/users/my-uid` | `update` | **Financial Fraud**: Attempt to change `planType` to 'PREMIUM' without payment. |
| P4 | `/users/my-uid` | `update` | **Resource Poisoning**: Inject 1MB string into the `displayName` field. |
| P5 | `/workouts/any-id` | `create` | **Orphaned Write**: Create a workout with a `userId` that doesn't match the auth UID. |
| P6 | `/workouts/other-user-workout` | `read` | **Data Leak**: Attempt to read a private workout plan of another user. |
| P7 | `/system/config` | `write` | **System Sabotage**: Attempt to change the `latestVersion` as a non-admin. |
| P8 | `/users/my-uid` | `update` | **Immutable Bypass**: Attempt to change `createdAt` timestamp. |
| P9 | `/messages/new-msg` | `create` | **Sender Masking**: Attempt to send a message where `fromId` is not the current user. |
| P10 | `/trainers/other-trainer` | `write` | **Role Hijacking**: Attempt to modify a trainer's client list without owning the doc. |
| P11 | `/users/my-uid` | `update` | **Type Confusion**: Send a number into a field expected to be a string. |
| P12 | `/progress/my-id` | `create` | **Array Overflow**: Send 10,000 photos in a single progress report. |

## 3. Implementation Blueprint

The `firestore.rules` will implement:
- `isValidUserProfile()` helper.
- `isAdmin()` check using a hardcoded allowlist or an admin collection (using allowlist for now as requested).
- `incoming().diff(existing()).affectedKeys().hasOnly([...])` for protected fields.
- `request.auth.token.email_verified == true` for all write operations.
