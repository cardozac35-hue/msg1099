import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { dbService } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const enquiryItemSchema = z.object({
  productId: z.string().optional(),
  itemDescription: z.string().min(2, "Product description is required"),
  category: z.string().default("Valves"),
  materialGrade: z.string().default(""),
  standard: z.string().default(""),
  size: z.string().default(""),
  pressureClass: z.string().default(""),
  connectionType: z.string().default(""),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitOfMeasure: z.string().default("EA"),
  customerTargetUnitPrice: z.number().optional().default(0),
  notes: z.string().optional().default(""),
});

const createEnquirySchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1),
  contactId: z.string().min(1, "Contact person is required"),
  contactName: z.string().min(1),
  assignedTo: z.string().min(1, "Assigned salesperson is required"),
  assignedToName: z.string().min(1),
  currency: z.string().default("USD"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  nextFollowUpDate: z.string().optional(),
  notes: z.string().optional().default(""),
  items: z.array(enquiryItemSchema).min(1, "At least one product line item is required"),
});

export async function GET() {
  try {
    await requireAuth();
    // Shared enquiry register visible to both salespeople and admin
    const enquiries = await dbService.listEnquiries();
    return NextResponse.json({ success: true, enquiries });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = createEnquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const newEnquiry = await dbService.createEnquiry(
      {
        ...parsed.data,
        status: "received",
        nextFollowUpDate: parsed.data.nextFollowUpDate
          ? new Date(parsed.data.nextFollowUpDate)
          : undefined,
      },
      { id: user.id, name: user.name }
    );

    await logAudit({
      action: "ENQUIRY_CREATED",
      entityType: "Enquiry",
      entityId: newEnquiry._id?.toString() || newEnquiry.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: {
        enquiryNumber: newEnquiry.enquiryNumber,
        customerName: newEnquiry.customerName,
        itemCount: newEnquiry.items?.length,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, enquiry: newEnquiry }, { status: 201 });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
