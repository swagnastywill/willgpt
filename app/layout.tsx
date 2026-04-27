import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { vanillaCream } from "./fonts";
import "./globals.css";

const SITE_URL = "https://willygpt.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "willygpt",
    template: "%s · willygpt",
  },
  description: "i am replacing ai. text me anything, ill get back when i can. — willy",
  keywords: ["willygpt", "willyhopps", "ai", "chat"],
  authors: [{ name: "willy hopps", url: "https://x.com/willyhopps" }],
  creator: "willy hopps",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "willygpt",
    title: "willygpt",
    description: "i am replacing ai. text me anything, ill get back when i can.",
  },
  twitter: {
    card: "summary_large_image",
    title: "willygpt",
    description: "i am replacing ai. text me anything, ill get back when i can.",
    creator: "@willyhopps",
  },
  robots: {
    index: true,
    follow: true,
  },
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
