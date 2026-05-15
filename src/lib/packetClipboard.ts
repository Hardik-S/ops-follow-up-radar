export type PacketCopyState = "copied" | "blocked";

type ClipboardWriter = {
  writeText: (text: string) => Promise<void>;
};

export async function writePacketToClipboard(
  clipboard: ClipboardWriter | undefined,
  packet: string
): Promise<PacketCopyState> {
  if (!clipboard) {
    return "blocked";
  }

  try {
    await clipboard.writeText(packet);
    return "copied";
  } catch {
    return "blocked";
  }
}
