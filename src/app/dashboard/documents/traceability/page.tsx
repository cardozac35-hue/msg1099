"use client";

import React from "react";
import { Network } from "lucide-react";
import { TraceabilityView } from "@/components/documents/traceability-view";

export default function TraceabilityPage() {
  return (
    <div className="space-y-6">
      <TraceabilityView />
    </div>
  );
}
