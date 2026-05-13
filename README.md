# Ops Follow-Up Radar

Ops Follow-Up Radar turns a synthetic inbox export into an operator-review workflow. It is deliberately fixture-first: the app demonstrates stale-ask detection, owner ambiguity, deadline risk, waiting states, source-linked evidence, a prioritized human review queue, and a copy-ready packet without touching a real mailbox or sending email.

## Portfolio Signal

This project shows product judgment around operational automation. The useful work is not "send more emails"; it is deciding which thread deserves attention, why it deserves attention, who owns it, and what a human should review before anything leaves the outbox.

Reviewer route map:

1. Open `/` and read `Reviewer quick path` plus the command bar above the fold.
2. Inspect `Human review workflow` for the top queued thread, urgency score, source trail, and checklist.
3. Compare the action-only queue against `Inbox follow-up radar`, which still shows no-action reference threads.
4. Use `Copy packet`, `Download Markdown`, or `Inspect packet` to review the Markdown packet preview.
5. Approve, rewrite, or discard the suggested follow-up outside the app. The app never sends email.

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
- Builds an urgency-ordered human review queue with source trails and checklist items, while keeping no-action reference threads out of the outbound review queue.
- Shows source-linked evidence, owner/waiting state, urgency, and a dry-run next action in prioritized order.
- Generates a Markdown review packet preview that keeps evidence, source links, and no-send language together; if every fixture is reference-only, the packet says there are no outbound review items instead of showing a blank reviewer body.
- Provides local-only packet actions: copy to clipboard, download Markdown, and jump to the packet preview.
- Keeps the no-send boundary visible in the UI because any real email workflow needs explicit human approval.

## File Map

- `src/data/inbox.ts`: synthetic inbox fixture rows and `synthetic://` provenance IDs.
- `src/lib/followup.ts`: deterministic classifier, review queue builder, and Markdown packet generator.
- `src/lib/followup.test.ts`: regression tests for state precedence, queue ordering, empty states, deadline copy, and packet boundaries.
- `src/app/page.tsx`: reviewer route, command bar, action queue, radar board, provenance chips, and packet preview.
- `src/app/PacketActions.tsx`: client-only copy/download controls that do not touch any mailbox.
- `src/app/styles.css`: responsive layout and operator-review styling.
- `docs/reviewer-packet.example.md`: committed example of the generated packet for source review.
- `.github/workflows/verify.yml`: GitHub Actions gate for `npm ci` and `npm run verify`.

## Decisions

- Real mailbox connectors were rejected for the first public slice because they would make privacy and account scope the main problem instead of the product workflow.
- The classifier is deterministic rather than model-driven so reviewers can inspect exactly why a thread landed in a state.
- `synthetic://` source links are used to model traceability without implying a live inbox integration.
- Synthetic sources are rendered as provenance chips instead of clickable links because they are local fixture identifiers, not resolvable mailbox URLs.
- The app previews next actions only. It does not send, schedule, archive, label, or mutate any external mailbox.
- Next.js `dev` and `build` use webpack because Turbopack can panic on deep Windows automation worktree paths.

## Verification

- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm run verify`
- GitHub Actions runs `npm ci` and `npm run verify` on pushes to `main`, pushes to `fixer/**`, and pull requests.
- Production route check after deployment should return HTTP `200` and include `Ops Follow-Up Radar`, `Dry-run only`, `Reviewer packet preview`, and `TH-2041`.
- Production header check should include `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and `X-Content-Type-Options`.

## Deploy

Production URL: `https://ops-follow-up-radar.vercel.app`

Latest deployment evidence:

- Product change commit: `0ea858cfe03874642ee6ecd5f3ba34bab28d8535`
- Vercel project: `ops-follow-up-radar` (`prj_r6ySKQo5TnSPjay7NpMADMKVnc7Q`)
- Production deployment: `https://ops-follow-up-radar-nhgraf7r7-batb4016-9101s-projects.vercel.app`
- Production inspect URL: `https://vercel.com/batb4016-9101s-projects/ops-follow-up-radar/DTYXWaVk38HKo39a1WqmrhdxkXn9`
- Production alias: `https://ops-follow-up-radar.vercel.app`
- Route check: HTTP `200` with `Ops Follow-Up Radar`, `Dry-run only`, `Copy packet`, `Download Markdown`, `Reviewer packet preview`, `TH-2041`, `TH-2205`, and `Needs response`.

Previous deployment evidence:

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
- Clipboard copy and Markdown download operate only on the generated packet text already visible in the browser.

## Handoff Artifacts

- `docs/HANDOFF.md`: reviewer path, fixture provenance, verification contract, and non-goals.
- `docs/reviewer-packet.example.md`: committed example of the generated Markdown packet.

## Future Work

1. Add a paste-in CSV fixture importer with redaction checks; verify with parser tests and a source-only redaction scan.
2. Add UI filters for state, owner, and waiting-on lane once fixture volume grows; verify with render or browser interaction checks.
3. Add optional Gmail/Outlook adapters only behind an explicit local-only approval boundary; keep all send actions disabled by default.
4. Add a raw message-trail fixture panel so reviewers can inspect the thread-to-decision transformation, not only derived booleans.
