# Ops Follow-Up Radar

Ops Follow-Up Radar is a small portfolio product that turns a synthetic inbox export into a prioritized follow-up board. It is deliberately fixture-first: the app demonstrates stale-ask detection, owner ambiguity, deadline risk, waiting states, source-linked evidence, and dry-run next actions without touching a real mailbox or sending email.

## Portfolio Signal

This project shows product judgment around operational automation. The useful work is not "send more emails"; it is deciding which thread deserves attention, why it deserves attention, who owns it, and what a human should review before anything leaves the outbox.

## Stack Rationale

- Next.js App Router keeps the product deployable on Vercel while leaving room for future server routes.
- TypeScript makes the inbox fixture shape and classifier output explicit.
- Vitest covers the classification rules so the dashboard is not just static mock data.
- Synthetic fixtures keep the repository public and avoid personal inbox content.

## Local Setup

```powershell
npm install
npm run test
npm run build
npm run dev
```

## What The First Slice Does

- Loads five synthetic inbox threads from `src/data/inbox.ts`.
- Classifies each thread as `deadline-risk`, `stale-ask`, `owner-ambiguous`, `waiting`, or `no-action`.
- Shows source-linked evidence, owner/waiting state, urgency, and a dry-run next action.
- Keeps the no-send boundary visible in the UI because any real email workflow needs explicit human approval.

## Decisions

- Real mailbox connectors were rejected for the first public slice because they would make privacy and account scope the main problem instead of the product workflow.
- The classifier is deterministic rather than model-driven so reviewers can inspect exactly why a thread landed in a state.
- `synthetic://` source links are used to model traceability without implying a live inbox integration.
- The app previews next actions only. It does not send, schedule, archive, label, or mutate any external mailbox.

## Verification

- `npm run test`
- `npm run build`
- Production route check after deployment should return HTTP `200` and include `Ops Follow-Up Radar` plus `Dry-run only`.

## Deploy

Expected production URL: `https://ops-follow-up-radar.vercel.app`

## Future Work

- Add a paste-in CSV fixture importer with redaction checks.
- Add optional Gmail/Outlook adapters behind an explicit local-only approval boundary.
- Export a Markdown follow-up review packet for a human operator.
