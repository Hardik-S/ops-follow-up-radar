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

export type FollowUpState =
  | "stale-ask"
  | "needs-response"
  | "owner-ambiguous"
  | "deadline-risk"
  | "waiting"
  | "no-action";

export type FollowUpResult = {
  thread: InboxThread;
  state: FollowUpState;
  urgency: number;
  evidence: string[];
  nextAction: string;
};

export type ReviewQueueItem = {
  threadId: string;
  subject: string;
  state: FollowUpState;
  urgency: number;
  sourceTrail: string[];
  reviewChecklist: string[];
  humanApprovalRequired: true;
};

const nextActions: Record<FollowUpState, string> = {
  "stale-ask": "Draft a concise check-in that restates the open ask and proposes one concrete next step.",
  "needs-response": "Draft a focused reply to answer the open ask before it becomes stale.",
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

  if (thread.deadlineDaysAway !== null && thread.deadlineDaysAway <= 2 && thread.waitingOn === "me") {
    urgency += 30;
    evidence.push(formatDeadlineEvidence(thread.deadlineDaysAway));
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
      "needs-response": 0,
      "owner-ambiguous": 0,
      "deadline-risk": 0,
      waiting: 0,
      "no-action": 0,
      totalUrgency: 0
    } satisfies Record<FollowUpState, number> & { totalUrgency: number }
  );
}

export function buildReviewQueue(results: FollowUpResult[]): ReviewQueueItem[] {
  return [...results]
    .filter((result) => result.state !== "no-action")
    .sort((left, right) => right.urgency - left.urgency || left.thread.id.localeCompare(right.thread.id))
    .map((result) => ({
      threadId: result.thread.id,
      subject: result.thread.subject,
      state: result.state,
      urgency: result.urgency,
      sourceTrail: [result.thread.source],
      reviewChecklist: buildReviewChecklist(result),
      humanApprovalRequired: true
    }));
}

export function createFollowUpPacket(results: FollowUpResult[]): string {
  const lines = [
    "# Ops Follow-Up Radar Review Packet",
    "",
    "Dry-run only: no email was sent, scheduled, archived, or labeled.",
    "Synthetic fixture boundary: every source uses a synthetic:// inbox link.",
    ""
  ];

  if (results.length === 0) {
    return [
      ...lines,
      "No inbox threads were available for review.",
      "No outbound action is recommended."
    ].join("\n");
  }

  buildReviewQueue(results).forEach((item, index) => {
    const result = results.find((candidate) => candidate.thread.id === item.threadId);
    if (!result) {
      return;
    }

    lines.push(
      `## ${index + 1}. ${item.threadId} - ${item.subject}`,
      `State: ${result.state}`,
      `Urgency: ${result.urgency}`,
      `Source: ${result.thread.source}`,
      `Preview action: ${result.nextAction}`,
      "Evidence:"
    );
    result.evidence.forEach((evidence) => lines.push(`- ${evidence}`));
    lines.push("Human review checklist:");
    item.reviewChecklist.forEach((check) => lines.push(`- ${check}`));
    lines.push("");
  });

  return lines.join("\n").trimEnd();
}

function buildReviewChecklist(result: FollowUpResult): string[] {
  const checklist = ["Confirm the source thread is safe to use before drafting"];

  if (result.state === "deadline-risk") {
    checklist.push("Confirm the deadline before drafting");
  }

  if (result.state === "owner-ambiguous") {
    checklist.push("Resolve the owner before any follow-up is written");
  }

  if (result.state === "stale-ask") {
    checklist.push("Restate the open ask and choose one next step");
  }

  if (result.state === "needs-response") {
    checklist.push("Answer the open ask before it becomes stale");
  }

  if (result.state === "waiting") {
    checklist.push("Verify whether a reminder is better than a chase email");
  }

  if (result.state === "no-action") {
    checklist.push("Confirm no outbound response is needed");
  }

  checklist.push("Approve or rewrite the preview before anything leaves the outbox");
  return checklist;
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

  if (thread.hasUnansweredQuestion && thread.waitingOn === "me") {
    return "needs-response";
  }

  if (thread.waitingOn === "them") {
    return "waiting";
  }

  return "no-action";
}

function formatDeadlineEvidence(deadlineDaysAway: number): string {
  if (deadlineDaysAway < 0) {
    return `Deadline is overdue by ${Math.abs(deadlineDaysAway)} day${Math.abs(deadlineDaysAway) === 1 ? "" : "s"}.`;
  }

  if (deadlineDaysAway === 0) {
    return "Deadline is due today.";
  }

  return `Deadline is ${deadlineDaysAway} day${deadlineDaysAway === 1 ? "" : "s"} away.`;
}
