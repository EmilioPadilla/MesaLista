# iOS Fixed-Plan In-App Purchase (RevenueCat)

Apple guideline 3.1.1 requires the couple's **fixed plan** to be sold through
In-App Purchase on iOS. This wires that up with RevenueCat while leaving the web
and Android flows on Stripe, and the commission plan untouched.

## How it works

Apple IAP is anonymous at purchase time, so unlike the Stripe flow (which carries
signup data in session metadata) we stash the signup server-side first:

1. **prepare** — `POST /payments/plan/ios/prepare` validates the signup (email +
   slug free), hashes the password, and stores a `PendingPlanSignup` row keyed by
   a RevenueCat `app_user_id`. No discount (Apple prices are fixed tiers).
2. **purchase** — the app calls `Purchases.logIn(appUserId)` then
   `purchasePackage(...)` (native Apple sheet). See `mobile/src/lib/revenuecat.ts`.
3. **complete** — `POST /payments/plan/ios/complete` re-verifies the `fixed_plan`
   entitlement with RevenueCat's REST API (never trusting the client), provisions
   the account + gift list via the shared `provisionFixedPlanSignupFromMetadata`,
   deletes the pending row, and returns a Bearer token the app stores.
4. **webhook backstop** — `POST /payments/revenuecat/webhook` provisions the same
   way if the app dies between purchase and `complete`. Idempotent.

Relevant code: `server/controllers/paymentController.ts` (RevenueCat section),
`server/routes/paymentRoutes.ts`, `packages/shared/src/services/payment.*`,
`packages/shared/src/hooks/usePayment.ts`,
`mobile/src/features/signup/screens/SignupScreen.tsx` (`handleFixedPlanIap`).

## One-time setup (you must do these — I can't reach the dashboards)

### App Store Connect

1. **My Apps → MesaLista → (Monetization) In-App Purchases → +**
2. Type **Non-Consumable**. Reference name `Plan Fijo`, Product ID
   `mesalista_fixed_plan`. Price: the tier closest to **$2,000 MXN**
   (Apple takes 15–30%). Add a localized display name/description and a review
   screenshot. Save.
3. Under **Users and Access → Integrations (or Keys) → In-App Purchase**, create
   an **App Store Connect API key** so RevenueCat can read/verify purchases.

### RevenueCat

1. Create a project, add the **iOS app** (bundle id `com.mesalista.app`), upload
   the App Store Connect API key.
2. **Products** → add `mesalista_fixed_plan`.
3. **Entitlements** → create `fixed_plan`, attach the product.
4. **Offerings** → default offering → add a package containing the product.
5. **API keys** → copy the **public iOS SDK key** (`appl_...`) and the **secret
   key** (`sk_...`).
6. **Webhooks** → add `https://www.mesalista.com.mx/api/payments/revenuecat/webhook`,
   set an Authorization header value = your `REVENUECAT_WEBHOOK_SECRET`.

## Environment variables

**Server** (`.env` — see `.env.example`):

```
REVENUECAT_SECRET_API_KEY=sk_...            # RevenueCat secret key
REVENUECAT_WEBHOOK_SECRET=...               # matches the webhook Authorization header
REVENUECAT_ENTITLEMENT_ID=fixed_plan        # optional; defaults to fixed_plan
```

**Mobile** — public iOS SDK key at build time. For local dev builds add to `mobile/.env`:

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=fixed_plan
# EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default   # optional; else "current" offering
```

## Apply the DB migration

```
npx prisma migrate deploy      # production
# or, locally:
npx prisma migrate dev
```

(Migration: `prisma/migrations/20260722000000_add_pending_plan_signups`.)

## Testing (⚠️ NOT in Expo Go)

`react-native-purchases` is native, so it **cannot run in Expo Go**. On iOS the
signup falls back to Stripe when the native module or key is missing
(`isIapAvailable()` is false), so to exercise IAP you need a real build:

```
cd mobile
npx expo run:ios            # local dev build on a device/simulator, or
npm run build:ios:preview   # EAS build for TestFlight
```

Use a **StoreKit sandbox tester** (App Store Connect → Users and Access → Sandbox)
signed in on the device, or an Xcode **StoreKit configuration file**. Walk the
fixed-plan signup: you should see Apple's purchase sheet, then land on the success
screen with an active (open) gift list. Verify the `PendingPlanSignup` row is gone
and the user + gift list exist.

## Notes / limitations

- **Discount codes don't apply on iOS fixed plan** — Apple prices are fixed tiers.
  The discount field is hidden on iOS; codes still work on web + commission.
- Android fixed plan still uses Stripe here. If you later ship to Google Play,
  Play policy will require Google Play Billing for the digital plan too.
- The commission plan is free (no upfront charge) and is unaffected.
