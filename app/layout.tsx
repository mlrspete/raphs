import type { Metadata } from "next";
import type { ReactNode } from "react";

import { OutboundLinkTracker } from "@/components/analytics/OutboundLinkTracker";
import { Providers } from "@/app/providers";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: site.name,
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body>
        <Providers>
          <OutboundLinkTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
