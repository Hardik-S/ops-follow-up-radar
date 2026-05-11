import type { InboxThread } from "../lib/followup";

export const inboxThreads: InboxThread[] = [
  {
    id: "TH-2041",
    subject: "Pilot pricing approval before Friday",
    source: "synthetic://inbox/revenue-ops/TH-2041",
    owner: "Hardik",
    sender: "Maya from Northstar",
    lastInboundDaysAgo: 5,
    lastOutboundDaysAgo: 4,
    deadlineDaysAway: 1,
    askType: "approval",
    waitingOn: "me",
    hasExplicitOwner: true,
    hasUnansweredQuestion: true,
    excerpt: "Can you confirm the discounted pilot pricing before Friday so procurement can cut the PO?"
  },
  {
    id: "TH-2077",
    subject: "Who owns the vendor security packet?",
    source: "synthetic://inbox/security/TH-2077",
    owner: "Unassigned",
    sender: "Ivey Venture Lab",
    lastInboundDaysAgo: 3,
    lastOutboundDaysAgo: 0,
    deadlineDaysAway: 6,
    askType: "handoff",
    waitingOn: "unclear",
    hasExplicitOwner: false,
    hasUnansweredQuestion: true,
    excerpt: "Looping both teams here. Who is taking point on the security questionnaire and references?"
  },
  {
    id: "TH-2112",
    subject: "Waiting on countersigned onboarding form",
    source: "synthetic://inbox/customer-success/TH-2112",
    owner: "Priya",
    sender: "Brightline Health",
    lastInboundDaysAgo: 8,
    lastOutboundDaysAgo: 7,
    deadlineDaysAway: 10,
    askType: "document",
    waitingOn: "them",
    hasExplicitOwner: true,
    hasUnansweredQuestion: false,
    excerpt: "Thanks, we will send the countersigned onboarding form after legal has one more look."
  },
  {
    id: "TH-2186",
    subject: "Renewal rescue notes need a next step",
    source: "synthetic://inbox/founder-office/TH-2186",
    owner: "Hardik",
    sender: "Avery Chen",
    lastInboundDaysAgo: 11,
    lastOutboundDaysAgo: 10,
    deadlineDaysAway: 3,
    askType: "decision",
    waitingOn: "me",
    hasExplicitOwner: true,
    hasUnansweredQuestion: true,
    excerpt: "Can you send the revised talk track and decide whether we are offering a usage extension?"
  },
  {
    id: "TH-2205",
    subject: "Workshop recap and optional async notes",
    source: "synthetic://inbox/community/TH-2205",
    owner: "Sam",
    sender: "Founders Circle",
    lastInboundDaysAgo: 2,
    lastOutboundDaysAgo: 1,
    deadlineDaysAway: null,
    askType: "fyi",
    waitingOn: "none",
    hasExplicitOwner: true,
    hasUnansweredQuestion: false,
    excerpt: "Sharing the recap deck here. Optional async notes are welcome but there is no action needed."
  }
];
