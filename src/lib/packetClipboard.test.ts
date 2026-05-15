import { describe, expect, it, vi } from "vitest";
import { writePacketToClipboard } from "./packetClipboard";

describe("writePacketToClipboard", () => {
  it("reports copied when the clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(writePacketToClipboard({ writeText }, "review packet")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("review packet");
  });

  it("blocks gracefully when the clipboard API is unavailable", async () => {
    await expect(writePacketToClipboard(undefined, "review packet")).resolves.toBe("blocked");
  });

  it("blocks gracefully when browser permissions reject clipboard writes", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError"));

    await expect(writePacketToClipboard({ writeText }, "review packet")).resolves.toBe("blocked");
    expect(writeText).toHaveBeenCalledWith("review packet");
  });
});
