import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import FarmScene from "./farm-scene";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "recipe-share — Real recipes from real kitchens",
  description: "Share what you actually cook, with ingredients and steps.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <FarmScene />
        <header className="border-b border-border">
          <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-serif text-xl font-semibold">
              recipe<span className="text-accent">.share</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="/browse" className="hover:text-foreground">
                Browse recipes
              </Link>
              <Link href="/plan" className="hover:text-foreground">
                Meal calendar
              </Link>
              <Link
                href="/submit"
                className="rounded-lg bg-accent px-4 py-2 font-medium text-background hover:bg-accent-strong"
              >
                Share a recipe
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-muted">
            Made with an appetite. Recipes belong to whoever is hungry.
          </div>
        </footer>
      </body>
    </html>
  );
}
