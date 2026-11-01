import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/** Closest free geometric sans to Bw Gradual (brand style guide). */
const outfit = Outfit({
  variable: "--font-zoa-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfitDisplay = Outfit({
  variable: "--font-zoa-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Z.O.A — Corporate Service Limited",
  description:
    "Z.O.A Corporate Service Limited — guided CAC company, business name, and SCUML filings with document uploads.",
  applicationName: "Z.O.A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${outfitDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
