import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MediScope AI | Advanced Medical Wellness & Specialized Care",
  description: "MediScope AI offers professional medical wellness solutions for weight loss, men's and women's health. Get personalized GLP-1 protocols and expert healthcare advice.",
  keywords: ["medical weight loss", "GLP-1", "semaglutide", "men's health", "women's wellness", "AI health assistant"],
  authors: [{ name: "MediScope AI Team" }],
  openGraph: {
    title: "MediScope AI | Specialized Medical Wellness",
    description: "Expert medical care delivered digitally. Specialized tracks for weight loss and sexual health.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${lora.variable} antialiased font-sans`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
