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
      "TH-2077",
      "TH-2112",
      "TH-2205"
    ]);
    expect(queue.every((item) => item.humanApprovalRequired)).toBe(true);
    expect(queue[0].reviewChecklist).toContain("Confirm the deadline before drafting");
    expect(queue[0].sourceTrail).toEqual(["synthetic://inbox/revenue-ops/TH-2041"]);
  });

  it("creates a reviewer packet with source evidence and no-send language", () => {
    const packet = createFollowUpPacket(inboxThreads.map(classifyThread));

    expect(packet).toContain("# Ops Follow-Up Radar Review Packet");
    expect(packet).toContain("Dry-run only: no email was sent, scheduled, archived, or labeled.");
    expect(packet).toContain("synthetic://inbox/revenue-ops/TH-2041");
    expect(packet).toContain("Owner path is ambiguous.");
    expect(packet).toContain("TH-2186");
  });

  it("creates an empty-state reviewer packet without inventing actions", () => {
    const packet = createFollowUpPacket([]);

    expect(packet).toContain("No inbox threads were available for review.");
    expect(packet).toContain("No outbound action is recommended.");
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
});
