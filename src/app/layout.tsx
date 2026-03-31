import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPaaS連携サービス比較ツール",
  description:
    "主要iPaaSプラットフォーム（Zapier, IFTTT, Make, Power Automate, n8n, Yoom, Dify, Anyflow）の連携サービスを横断検索・比較できるツール",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-SZ0XT7E1JT"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-SZ0XT7E1JT');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
