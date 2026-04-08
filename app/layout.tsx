import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Zip Radius Finder — Find US Zip Codes Within Any Radius for Meta Ads",
  description: "Free tool for advertising professionals. Upload your client zip codes, set a mile radius, and instantly download every US zip code within that radius — ready for Meta Ads Manager targeting.",
  keywords: ["zip code radius", "meta ads targeting", "zip code finder", "facebook ads zip codes", "zip radius tool", "ad targeting zip codes", "US zip codes radius"],
  openGraph: {
    title: "Zip Radius Finder — Meta Ad Targeting Tool",
    description: "Find every US zip code within a given radius of your client locations. Free, instant, browser-based — built for Meta ad campaigns.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Zip Radius Finder — Meta Ad Targeting Tool",
    description: "Find every US zip code within a given radius of your client locations. Free, instant, browser-based.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
