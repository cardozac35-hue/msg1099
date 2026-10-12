import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oil & Gas Sales Hub - B2B Quotation Management System",
  description: "Enterprise B2B Quotation, RFQ, and Commercial Pipeline Platform for Oilfield Supplies and Piping Equipment",
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
