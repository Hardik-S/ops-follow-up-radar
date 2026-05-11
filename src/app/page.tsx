import { inboxThreads } from "../data/inbox";
import { classifyThread, summarizeRadar } from "../lib/followup";

const stateLabels = {
  "deadline-risk": "Deadline risk",
  "stale-ask": "Stale ask",
  "owner-ambiguous": "Owner ambiguous",
  waiting: "Waiting",
  "no-action": "No action"
};

export default function Home() {
  const results = inboxThreads.map(classifyThread);
  const summary = summarizeRadar(results);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Synthetic inbox operations workflow</p>
          <h1>Ops Follow-Up Radar</h1>
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

      <section className="summary" aria-label="Follow-up summary">
        {Object.entries(stateLabels).map(([state, label]) => (
          <article key={state}>
            <span>{label}</span>
            <strong>{summary[state as keyof typeof stateLabels]}</strong>
          </article>
        ))}
      </section>

      <section className="board" aria-label="Inbox follow-up radar">
        {results.map((result) => (
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
              <a href={result.thread.source}>{result.thread.source}</a>
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
    </main>
  );
}
