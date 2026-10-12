import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSG Oilfield - Material Solutions Grid | ERP & Certification Portal",
  description: "MSG Oilfield Equipment Trading LLC (Dubai, UAE) - Sourcing: Reliable & Systematic. Stockist of Pipes, Fittings, Flanges, Valves, and EN 10204 3.1/3.2 Certification Management.",
  icons: {
    icon: "/msg-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
