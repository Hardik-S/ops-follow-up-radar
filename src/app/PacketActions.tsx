"use client";

import { useState } from "react";

type PacketActionsProps = {
  packet: string;
};

export function PacketActions({ packet }: PacketActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "blocked">("idle");

  async function copyPacket() {
    if (!navigator.clipboard) {
      setCopyState("blocked");
      return;
    }

    await navigator.clipboard.writeText(packet);
    setCopyState("copied");
  }

  return (
    <div className="packetActions" aria-label="Packet actions">
      <button type="button" onClick={copyPacket}>
        Copy packet
      </button>
      <a
        download="ops-follow-up-radar-review-packet.md"
        href={`data:text/markdown;charset=utf-8,${encodeURIComponent(packet)}`}
      >
        Download Markdown
      </a>
      <span aria-live="polite">
        {copyState === "copied"
          ? "Copied for review"
          : copyState === "blocked"
            ? "Clipboard unavailable"
            : "No mailbox mutation"}
      </span>
    </div>
  );
}
