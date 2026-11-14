import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "rapshirtees",
  description: "T-shirts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body className="flex min-h-dvh flex-col bg-white text-black">
        <header className="pt-2 pb-2 text-center font-[Arial_Black,Arial,sans-serif] text-lg font-black">
          <Link href="/">RAPSHIRTEES.COM</Link>
        </header>
        {children}
      </body>
    </html>
  );
}
