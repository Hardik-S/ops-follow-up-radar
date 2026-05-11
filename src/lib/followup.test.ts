import { describe, expect, it } from "vitest";
import { inboxThreads } from "../data/inbox";
import { classifyThread, summarizeRadar } from "./followup";

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
});
