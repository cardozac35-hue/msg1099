"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExcelToQuoteRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/enquiries/new");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-8 h-8 border-3 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-xs font-semibold text-slate-600">
        Redirecting to New Enquiry (Integrated Excel Importer)...
      </p>
    </div>
  );
}
