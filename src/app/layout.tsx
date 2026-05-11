import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Ops Follow-Up Radar",
  description: "Synthetic inbox follow-up classifier with dry-run next actions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
