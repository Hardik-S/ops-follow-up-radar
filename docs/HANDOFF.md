# Ops Follow-Up Radar Handoff

## Reviewer Path

1. Open the production URL and confirm the reviewer quick path is visible above the board.
2. Inspect the top queued thread, urgency score, source trail, checklist, and approval gate.
3. Compare the prioritized outbound review queue against the full radar board.
4. Use the packet action controls and inspect the committed packet example.
5. Verify that `synthetic://` values are fixture source trails, not live mailbox links.

## Fixture Provenance

All records in `src/data/inbox.ts` are invented examples. The app does not read Gmail, Outlook, Slack, CRM exports, calendars, labels, archives, sent mail, or personal inbox data.

The fixture set intentionally covers `deadline-risk`, `stale-ask`, `owner-ambiguous`, `waiting`, and `no-action` paths.

Waiting-on-counterparty threads are reference items, not outbound packet items. They should remain visible on the radar board so reviewers understand the lane, but they should not appear in the generated packet because their preview action is to monitor rather than chase.

When every classified thread is reference-only, the generated reviewer packet must still include an explicit no-outbound-action fallback. This keeps the copy/download controls from producing a header-only packet that could look truncated during review.

## Verification Contract

Run the complete local gate before publishing:

```powershell
npm ci
npm run verify
```

`npm run verify` runs Vitest, TypeScript with `--incremental false`, and `next build --webpack`. The webpack flag is intentional because related deep Windows automation worktrees have triggered Turbopack path-length failures.

For production, verify route text and response headers. Expected page text includes `Ops Follow-Up Radar`, `Dry-run only`, `Reviewer packet preview`, and `TH-2041`; expected headers include `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and `X-Content-Type-Options`.

## Non-Goals

- No automatic sending, scheduling, labeling, archiving, or external mailbox mutation.
- No live mailbox connector in the public demo.
- No private inbox export, personal data, or credentials.
- No model-driven classification until deterministic fixture behavior is stable and test-covered.
