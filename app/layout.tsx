import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kinetiq — Your people, in sync",
  description: "A real-time home for communities, voice lounges, and synchronized video theaters.",
  applicationName: "Kinetiq"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}