import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promotion Footprint",
  description: "Evidence-backed public marketing intelligence for competitor analysis.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
