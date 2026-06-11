import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers/session-provider";
import "./globals.css";

const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/Poppins-ThinItalic.ttf", weight: "100", style: "italic" },
    { path: "./fonts/Poppins-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/Poppins-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "./fonts/Poppins-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Poppins-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "./fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "./fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "./fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Poppins-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "./fonts/Poppins-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/Poppins-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
    { path: "./fonts/Poppins-Black.ttf", weight: "900", style: "normal" },
    { path: "./fonts/Poppins-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notes App - Professional Note Taking",
  description: "A professional notes app with rich text editing, categories, tags, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
