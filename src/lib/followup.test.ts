import { describe, expect, it } from "vitest";
import { inboxThreads } from "../data/inbox";
import { buildReviewQueue, classifyThread, createFollowUpPacket, summarizeRadar } from "./followup";

describe("classifyThread", () => {
  it("prioritizes deadline risk when an answer is due soon", () => {
    const urgent = inboxThreads.find((item) => item.id === "TH-2041");

    expect(urgent).toBeDefined();
    const result = classifyThread(urgent!);

    expect(result.state).toBe("deadline-risk");
    expect(result.evidence.join(" ")).toContain("Deadline is 1 day");
    expect(result.nextAction).toContain("deadline-focused");
  });

  it("separates owner ambiguity from normal waiting states", () => {
    const ambiguous = classifyThread(inboxThreads[1]);
    const waiting = classifyThread(inboxThreads[2]);

    expect(ambiguous.state).toBe("owner-ambiguous");
    expect(waiting.state).toBe("waiting");
  });

  it("summarizes every radar state for the dashboard", () => {
    const summary = summarizeRadar(inboxThreads.map(classifyThread));

    expect(summary["deadline-risk"]).toBe(1);
    expect(summary["owner-ambiguous"]).toBe(1);
    expect(summary["stale-ask"]).toBe(1);
    expect(summary.waiting).toBe(1);
    expect(summary["no-action"]).toBe(1);
    expect(summary.totalUrgency).toBeGreaterThan(0);
  });

  it("builds a human-review queue ordered by urgency with dry-run boundaries", () => {
    const queue = buildReviewQueue(inboxThreads.map(classifyThread));

    expect(queue.map((item) => item.threadId)).toEqual([
      "TH-2041",
      "TH-2186",
      "TH-2077"
    ]);
    expect(queue.every((item) => item.humanApprovalRequired)).toBe(true);
    expect(queue[0].reviewChecklist).toContain("Confirm the deadline before drafting");
    expect(queue[0].sourceTrail).toEqual(["synthetic://inbox/revenue-ops/TH-2041"]);
  });

  it("uses the nearest deadline before thread ID when review urgency ties", () => {
    const sharedThread = {
      ...inboxThreads[4],
      waitingOn: "me" as const,
      hasUnansweredQuestion: true,
      lastInboundDaysAgo: 2
    };
    const laterDeadline = classifyThread({
      ...sharedThread,
      id: "TH-ALPHA",
      deadlineDaysAway: 12
    });
    const nearerDeadline = classifyThread({
      ...sharedThread,
      id: "TH-ZULU",
      deadlineDaysAway: 5
    });

    expect(laterDeadline.urgency).toBe(nearerDeadline.urgency);
    expect(buildReviewQueue([laterDeadline, nearerDeadline]).map((item) => item.threadId)).toEqual([
      "TH-ZULU",
      "TH-ALPHA"
    ]);
  });

  it("keeps no-action reference threads out of the outbound review queue", () => {
    const queue = buildReviewQueue(inboxThreads.map(classifyThread));

    expect(queue.map((item) => item.threadId)).not.toContain("TH-2205");
    expect(queue.every((item) => item.state !== "no-action")).toBe(true);
  });

  it("keeps waiting threads out of outbound review packets", () => {
    const results = inboxThreads.map(classifyThread);
    const queue = buildReviewQueue(results);
    const packet = createFollowUpPacket(results);

    expect(queue.map((item) => item.threadId)).not.toContain("TH-2112");
    expect(packet).not.toContain("TH-2112");
    expect(packet).not.toContain("do not chase");
  });

  it("creates a reviewer packet with source evidence and no-send language", () => {
    const packet = createFollowUpPacket(inboxThreads.map(classifyThread));

    expect(packet).toContain("# Ops Follow-Up Radar Review Packet");
    expect(packet).toContain("Dry-run only: no email was sent, scheduled, archived, or labeled.");
    expect(packet).toContain("synthetic://inbox/revenue-ops/TH-2041");
    expect(packet).toContain("Owner path is ambiguous.");
    expect(packet).toContain("TH-2186");
    expect(packet).not.toContain("TH-2205");
  });

  it("creates an empty-state reviewer packet without inventing actions", () => {
    const packet = createFollowUpPacket([]);

    expect(packet).toContain("No inbox threads were available for review.");
    expect(packet).toContain("No outbound action is recommended.");
  });

  it("keeps all-reference reviewer packets explicit when no outbound review item exists", () => {
    const packet = createFollowUpPacket([
      classifyThread({
        ...inboxThreads[4],
        id: "TH-REFERENCE-ONLY"
      })
    ]);

    expect(packet).toContain("No outbound review items were found.");
    expect(packet).toContain("No outbound action is recommended.");
    expect(packet).not.toContain("## 1.");
  });

  it("does not rank waiting-on-them deadlines as actionable deadline risk", () => {
    const result = classifyThread({
      ...inboxThreads[2],
      deadlineDaysAway: 1,
      waitingOn: "them"
    });

    expect(result.state).toBe("waiting");
    expect(result.urgency).toBeLessThan(30);
    expect(result.evidence.join(" ")).not.toContain("Deadline is 1 day");
  });

  it("does not assign stale-ask urgency when no question is open", () => {
    const result = classifyThread({
      ...inboxThreads[4],
      lastInboundDaysAgo: 12,
      waitingOn: "me",
      hasUnansweredQuestion: false
    });

    expect(result.state).toBe("no-action");
    expect(result.urgency).toBe(0);
    expect(result.evidence.join(" ")).not.toContain("Inbound ask is stale");
  });

  it("keeps empty reviewer queues safe for UI summary rendering", () => {
    const queue = buildReviewQueue([]);
    const summary = summarizeRadar([]);

    expect(queue).toEqual([]);
    expect(summary.totalUrgency).toBe(0);
    expect(summary["deadline-risk"]).toBe(0);
  });

  it("keeps fresh unanswered asks actionable even before they become stale", () => {
    const result = classifyThread({
      ...inboxThreads[4],
      id: "TH-FRESH",
      waitingOn: "me",
      hasUnansweredQuestion: true,
      lastInboundDaysAgo: 2,
      deadlineDaysAway: null
    });

    expect(result.state).toBe("needs-response");
    expect(result.nextAction).toContain("answer the open ask");
  });

  it("normalizes due-today and overdue deadline evidence", () => {
    const dueToday = classifyThread({
      ...inboxThreads[0],
      deadlineDaysAway: 0
    });
    const overdue = classifyThread({
      ...inboxThreads[0],
      deadlineDaysAway: -2
    });

    expect(dueToday.evidence.join(" ")).toContain("Deadline is due today.");
    expect(overdue.evidence.join(" ")).toContain("Deadline is overdue by 2 days.");
  });
});
