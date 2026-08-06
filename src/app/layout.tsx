import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://www.rishisilwal.com.np";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rishi Silwal - FRONTEND DEVELOPER ",
    template: "%s | Rishi Silwal",
  },
  description:
    "Rishi Silwal is a Frontend Developer specializing in building modern, scalable, and high-performing websites.",
  keywords: [
    "Rishi Silwal",
    "Frontend Developer",
    
    "Web Developer Nepal",
    
    "Next.js Developer",
    "Freelance Developer",
    "SEO Optimization",
    "Web Performance",
  ],
  authors: [{ name: "Rishi Silwal", url: siteUrl }],
  creator: "Rishi Silwal",
  publisher: "WildStone Solution",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "Rishi Silwal — Frontend Developer | Web Developer",
    description:
      "Building modern, scalable, and high-performing websites that help businesses grow.",
    url: siteUrl,
    siteName: "Rishi Silwal — Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rishi Silwal — Frontend Developer & Founder of WildStone Solution",
    description:
      "Building modern, scalable, and high-performing websites that help businesses grow.",
    creator: "@rishisilwal",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rishi Silwal",
  jobTitle: " Frontend Developer",
  worksFor: {
    "@type": "Organization",
    name: "WildStone Solution",
  },
  url: siteUrl,
  knowsAbout: [
    "WordPress Development",
    "WooCommerce",
    "Elementor",
    "PHP",
    "React",
    "Next.js",
    "SEO Optimization",
    "Web Performance",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="person-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
