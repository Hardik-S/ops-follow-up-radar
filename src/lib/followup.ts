export type InboxThread = {
  id: string;
  subject: string;
  source: string;
  owner: string;
  sender: string;
  lastInboundDaysAgo: number;
  lastOutboundDaysAgo: number;
  deadlineDaysAway: number | null;
  askType: "approval" | "handoff" | "document" | "decision" | "fyi";
  waitingOn: "me" | "them" | "unclear" | "none";
  hasExplicitOwner: boolean;
  hasUnansweredQuestion: boolean;
  excerpt: string;
};

export type FollowUpState = "stale-ask" | "owner-ambiguous" | "deadline-risk" | "waiting" | "no-action";

export type FollowUpResult = {
  thread: InboxThread;
  state: FollowUpState;
  urgency: number;
  evidence: string[];
  nextAction: string;
};

const nextActions: Record<FollowUpState, string> = {
  "stale-ask": "Draft a concise check-in that restates the open ask and proposes one concrete next step.",
  "owner-ambiguous": "Draft an owner-clarification note before any follow-up is sent.",
  "deadline-risk": "Draft a deadline-focused reply that names the due date and decision needed.",
  waiting: "Keep on the waiting list and set a reminder; do not chase unless the date slips.",
  "no-action": "No send action. Archive or leave as reference after human review."
};

export function classifyThread(thread: InboxThread): FollowUpResult {
  const evidence: string[] = [];
  let urgency = 0;

  if (!thread.hasExplicitOwner || thread.waitingOn === "unclear") {
    urgency += 22;
    evidence.push("Owner path is ambiguous.");
  }

  if (thread.hasUnansweredQuestion && thread.waitingOn === "me") {
    urgency += 26;
    evidence.push("Latest thread still contains an unanswered ask for me.");
  }

  if (thread.lastInboundDaysAgo >= 7 && thread.waitingOn === "me") {
    urgency += 24;
    evidence.push(`Inbound ask is stale at ${thread.lastInboundDaysAgo} days old.`);
  }

  if (thread.deadlineDaysAway !== null && thread.deadlineDaysAway <= 2) {
    urgency += 30;
    evidence.push(`Deadline is ${thread.deadlineDaysAway} day(s) away.`);
  }

  if (thread.waitingOn === "them") {
    urgency += 8;
    evidence.push("Thread is waiting on the counterparty, not an outbound send.");
  }

  if (evidence.length === 0) {
    evidence.push("No stale ask, owner gap, or deadline pressure found.");
  }

  const state = chooseState(thread);

  return {
    thread,
    state,
    urgency,
    evidence,
    nextAction: nextActions[state]
  };
}

export function summarizeRadar(results: FollowUpResult[]) {
  return results.reduce(
    (summary, result) => {
      summary[result.state] += 1;
      summary.totalUrgency += result.urgency;
      return summary;
    },
    {
      "stale-ask": 0,
      "owner-ambiguous": 0,
      "deadline-risk": 0,
      waiting: 0,
      "no-action": 0,
      totalUrgency: 0
    } satisfies Record<FollowUpState, number> & { totalUrgency: number }
  );
}

function chooseState(thread: InboxThread): FollowUpState {
  if (!thread.hasExplicitOwner || thread.waitingOn === "unclear") {
    return "owner-ambiguous";
  }

  if (thread.deadlineDaysAway !== null && thread.deadlineDaysAway <= 2 && thread.waitingOn === "me") {
    return "deadline-risk";
  }

  if (thread.lastInboundDaysAgo >= 7 && thread.hasUnansweredQuestion && thread.waitingOn === "me") {
    return "stale-ask";
  }

  if (thread.waitingOn === "them") {
    return "waiting";
  }

  return "no-action";
}
