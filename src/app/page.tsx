import { inboxThreads } from "../data/inbox";
import { buildReviewQueue, classifyThread, createFollowUpPacket, summarizeRadar } from "../lib/followup";
import { PacketActions } from "./PacketActions";

const stateLabels = {
  "deadline-risk": "Deadline risk",
  "stale-ask": "Stale ask",
  "needs-response": "Needs response",
  "owner-ambiguous": "Owner ambiguous",
  waiting: "Waiting",
  "no-action": "No action"
};

export default function Home() {
  const results = inboxThreads.map(classifyThread);
  const summary = summarizeRadar(results);
  const reviewQueue = buildReviewQueue(results);
  const topReview = reviewQueue[0];
  const packetPreview = createFollowUpPacket(results);
  const resultsByThreadId = new Map(results.map((result) => [result.thread.id, result]));
  const prioritizedActionResults = reviewQueue.flatMap((item) => {
    const result = resultsByThreadId.get(item.threadId);
    return result ? [result] : [];
  });
  const actionThreadIds = new Set(reviewQueue.map((item) => item.threadId));
  const referenceResults = results.filter((result) => !actionThreadIds.has(result.thread.id));
  const boardResults = [...prioritizedActionResults, ...referenceResults];

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Synthetic inbox operations workflow</p>
          <h1>
            Ops Follow-Up
            <br />
            Radar
          </h1>
          <p className="lede">
            A fixture-backed action board that classifies stale asks, owner ambiguity, deadline
            pressure, and waiting states without sending anything automatically.
          </p>
        </div>
        <div className="boundary">
          <span>Boundary</span>
          <strong>Dry-run only</strong>
          <p>Every next action is a preview for human approval, not an automated email send.</p>
        </div>
      </section>

      <section className="commandBar" aria-label="Reviewer command bar">
        <div>
          <span>Current packet</span>
          <strong>{topReview ? `${topReview.threadId} needs review` : "Fixture clear"}</strong>
        </div>
        <div>
          <span>Action queue</span>
          <strong>{reviewQueue.length} outbound</strong>
        </div>
        <a href="#review-queue">Review queue</a>
        <a href="#packet-preview">Inspect packet</a>
        <a
          download="ops-follow-up-radar-review-packet.md"
          href={`data:text/markdown;charset=utf-8,${encodeURIComponent(packetPreview)}`}
        >
          Download Markdown
        </a>
      </section>

      <section className="reviewStrip" aria-label="Reviewer quick path">
        <article>
          <span>Review first</span>
          <strong>{topReview?.threadId ?? "Clear"}</strong>
          <p>{topReview?.subject ?? "No inbox threads need review in this fixture set."}</p>
        </article>
        <article>
          <span>Urgency score</span>
          <strong>{topReview?.urgency ?? 0}</strong>
          <p>Ranked ahead of lower-risk review items.</p>
        </article>
        <article>
          <span>Queue size</span>
          <strong>{reviewQueue.length}</strong>
          <p>{summary.totalUrgency} total urgency points across synthetic inbox fixtures.</p>
        </article>
        <article>
          <span>Approval gate</span>
          <strong>No send</strong>
          <p>All recommendations remain blocked until a human approves the packet.</p>
        </article>
      </section>

      <section className="summary" aria-label="Follow-up summary">
        {Object.entries(stateLabels).map(([state, label]) => (
          <article key={state}>
            <span>{label}</span>
            <strong>{summary[state as keyof typeof stateLabels]}</strong>
          </article>
        ))}
      </section>

      <section className="workflow" id="review-queue" aria-label="Human review workflow">
        <div>
          <p className="eyebrow">Operator queue</p>
          <h2>Human review before any outbound action</h2>
          <p>
            The queue is sorted by urgency and carries source trails, review checks, and an
            explicit approval gate so the app behaves like decision support rather than mailbox
            automation.
          </p>
        </div>
        {reviewQueue.length > 0 ? (
          <ol>
            {reviewQueue.slice(0, 3).map((item) => (
              <li key={item.threadId}>
                <div>
                  <span className={`status ${item.state}`}>{stateLabels[item.state]}</span>
                  <strong>{item.threadId}</strong>
                  <p>{item.subject}</p>
                </div>
                <ul>
                  {item.reviewChecklist.slice(0, 2).map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <p className="emptyState">No actionable outbound review items are present in this fixture set.</p>
        )}
      </section>

      <section className="board" aria-label="Inbox follow-up radar">
        {boardResults.map((result) => (
          <article className="case" key={result.thread.id}>
            <div className="caseHeader">
              <div>
                <p>{result.thread.id}</p>
                <h2>{result.thread.subject}</h2>
              </div>
              <span className={`status ${result.state}`}>{stateLabels[result.state]}</span>
            </div>
            <div className="caseMeta">
              <span>{result.thread.sender}</span>
              <span>Owner: {result.thread.owner}</span>
              <span>Waiting on: {result.thread.waitingOn}</span>
              <span>Last inbound: {result.thread.lastInboundDaysAgo}d</span>
            </div>
            <p className="memo">{result.thread.excerpt}</p>
            <div className="evidence">
              <h3>Source-linked evidence</h3>
              <span className="sourceChip">{result.thread.source}</span>
              <ul>
                {result.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="guidance">
              <span>Urgency {result.urgency}</span>
              <p>{result.nextAction}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="packet" id="packet-preview" aria-label="Reviewer packet preview">
        <div>
          <p className="eyebrow">Reviewer packet preview</p>
          <h2>Copy-ready handoff without mailbox mutation</h2>
          <p>
            The packet keeps evidence and source links together, making the approval boundary
            inspectable before a human rewrites or sends anything.
          </p>
          <PacketActions packet={packetPreview} />
        </div>
        <pre>{packetPreview}</pre>
      </section>
    </main>
  );
}
