import type { Metadata } from "next";
import { JetBrains_Mono, Oswald } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GentleBrief",
  description: "A slow daily audio digest. Sources in, noise out.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${oswald.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-[100dvh] bg-[#fcfbf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
