import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();

    const enquiries = await dbService.listEnquiries();
    const quotations = await dbService.listQuotations();
    const followUps = await dbService.listFollowUps();

    const totalEnquiries = enquiries.length;
    const openEnquiries = enquiries.filter((e) =>
      ["received", "in_review", "supplier_pricing"].includes(e.status)
    ).length;
    const quotedEnquiries = enquiries.filter((e) => e.status === "quoted").length;
    const wonEnquiries = enquiries.filter((e) => e.status === "won").length;
    const lostEnquiries = enquiries.filter((e) => e.status === "lost").length;

    const quotationsSent = quotations.filter((q) => q.status === "sent").length;
    const quotationsPendingApproval = quotations.filter((q) => q.status === "pending_approval").length;

    // Follow-ups due and overdue
    const now = new Date();
    const pendingFollowUps = followUps.filter((f) => f.status === "pending");
    const followUpsDue = pendingFollowUps.filter((f) => {
      const d = new Date(f.scheduledDate);
      return d.toDateString() === now.toDateString();
    }).length;
    const followUpsOverdue = pendingFollowUps.filter((f) => new Date(f.scheduledDate) < now).length;

    // Salesperson conversion breakdown
    const salespersonStats: Record<string, { name: string; enquiriesCount: number; wonCount: number; quotedValue: number }> = {};
    for (const enq of enquiries) {
      const spName = enq.assignedToName || "Unassigned";
      if (!salespersonStats[spName]) {
        salespersonStats[spName] = { name: spName, enquiriesCount: 0, wonCount: 0, quotedValue: 0 };
      }
      salespersonStats[spName].enquiriesCount += 1;
      if (enq.status === "won") {
        salespersonStats[spName].wonCount += 1;
      }
    }

    for (const q of quotations) {
      const spName = q.createdByName || "Unassigned";
      if (salespersonStats[spName]) {
        salespersonStats[spName].quotedValue += q.totalAmount || 0;
      }
    }

    const conversionData = Object.values(salespersonStats).map((sp) => ({
      ...sp,
      conversionRate: sp.enquiriesCount > 0 ? ((sp.wonCount / sp.enquiriesCount) * 100).toFixed(1) : "0",
    }));

    // Status distribution
    const statusDistribution = [
      { name: "Received", value: enquiries.filter((e) => e.status === "received").length },
      { name: "In Review", value: enquiries.filter((e) => e.status === "in_review").length },
      { name: "Supplier Pricing", value: enquiries.filter((e) => e.status === "supplier_pricing").length },
      { name: "Quoted", value: quotedEnquiries },
      { name: "Won", value: wonEnquiries },
      { name: "Lost", value: lostEnquiries },
    ];

    return NextResponse.json({
      success: true,
      kpis: {
        totalEnquiries,
        openEnquiries,
        quotationsSent,
        quotationsPendingApproval,
        followUpsDue,
        followUpsOverdue,
        wonEnquiries,
        lostEnquiries,
        conversionRate: totalEnquiries > 0 ? ((wonEnquiries / totalEnquiries) * 100).toFixed(1) : "0.0",
      },
      conversionData,
      statusDistribution,
      userRole: user.role,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
