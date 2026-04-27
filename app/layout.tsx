import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { vanillaCream } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "willygpt",
  description: "i am replacing ai",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={vanillaCream.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
