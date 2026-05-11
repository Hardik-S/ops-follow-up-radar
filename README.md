# Ops Follow-Up Radar

Ops Follow-Up Radar turns a synthetic inbox export into an operator-review workflow. It is deliberately fixture-first: the app demonstrates stale-ask detection, owner ambiguity, deadline risk, waiting states, source-linked evidence, a prioritized human review queue, and a copy-ready packet without touching a real mailbox or sending email.

## Portfolio Signal

This project shows product judgment around operational automation. The useful work is not "send more emails"; it is deciding which thread deserves attention, why it deserves attention, who owns it, and what a human should review before anything leaves the outbox.

Reviewer route map:

1. Open the app and read the reviewer quick path above the fold.
2. Inspect the top queued thread, urgency score, source trail, and checklist.
3. Compare the prioritized queue against the full radar board.
4. Copy or inspect the Markdown packet preview.
5. Approve, rewrite, or discard the suggested follow-up outside the app.

## Stack Rationale

- Next.js App Router keeps the product deployable on Vercel while leaving room for future server routes.
- TypeScript makes the inbox fixture shape, classifier output, reviewer queue, and packet output explicit.
- Vitest covers the classification rules so the dashboard is not just static mock data.
- Deterministic rules are used instead of GPT in this public slice so reviewers can audit every state transition without model variance or mailbox credentials.
- Synthetic fixtures keep the repository public and avoid personal inbox content.

## Local Setup

```powershell
npm ci
npm run verify
npm run dev
```

No environment variables are required. Local development runs at the URL printed by Next.js, usually `http://localhost:3000`.

## What The First Slice Does

- Loads five synthetic inbox threads from `src/data/inbox.ts`.
- Classifies each thread as `deadline-risk`, `stale-ask`, `owner-ambiguous`, `waiting`, or `no-action`.
- Shows a first-viewport reviewer quick path with the top queued thread, queue size, urgency score, and approval gate.
- Builds an urgency-ordered human review queue with source trails and checklist items.
- Shows source-linked evidence, owner/waiting state, urgency, and a dry-run next action in prioritized order.
- Generates a Markdown review packet preview that keeps evidence, source links, and no-send language together.
- Keeps the no-send boundary visible in the UI because any real email workflow needs explicit human approval.

## Decisions

- Real mailbox connectors were rejected for the first public slice because they would make privacy and account scope the main problem instead of the product workflow.
- The classifier is deterministic rather than model-driven so reviewers can inspect exactly why a thread landed in a state.
- `synthetic://` source links are used to model traceability without implying a live inbox integration.
- The app previews next actions only. It does not send, schedule, archive, label, or mutate any external mailbox.
- Next.js `dev` and `build` use webpack because Turbopack can panic on deep Windows automation worktree paths.

## Verification

- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm run verify`
- Production route check after deployment should return HTTP `200` and include `Ops Follow-Up Radar`, `Dry-run only`, `Reviewer packet preview`, and `TH-2041`.

## Deploy

Production URL: `https://ops-follow-up-radar.vercel.app`

Latest deployment evidence:

- Commit: `6ce53423fb007f7d8d686d9e3b6333db665e95e8`
- Vercel project: `ops-follow-up-radar` (`prj_r6ySKQo5TnSPjay7NpMADMKVnc7Q`)
- Production deployment: `https://ops-follow-up-radar-23iiom0gj-batb4016-9101s-projects.vercel.app`
- Production alias: `https://ops-follow-up-radar.vercel.app`
- Route check: HTTP `200` with `Ops Follow-Up Radar`, `Dry-run only`, `Review first`, `Reviewer packet preview`, and `TH-2041`

## Limitations

- Uses synthetic inbox fixtures only.
- Does not connect to Gmail, Outlook, Slack, or any real mailbox.
- Does not send, schedule, archive, label, or mutate external messages.
- Does not persist user state or support authentication.
- Uses deterministic rules rather than an AI model; the goal is inspectable workflow logic, not natural-language generation.
- The packet is a review aid, not proof that an email is safe or appropriate to send.

## Future Work

- Add a paste-in CSV fixture importer with redaction checks.
- Add optional Gmail/Outlook adapters behind an explicit local-only approval boundary.
- Add copy-to-clipboard actions and downloadable Markdown for the generated review packet.
- Add UI filters for state, owner, and waiting-on lane once fixture volume grows.
