import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CoverBridge | Commercial Insurance", description: "B2B commercial insurance brokerage portal" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
