import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { documentService } from "@/services/document-service";
import { CreateDocumentSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);

    const filter = {
      search: searchParams.get("search") || undefined,
      documentType: searchParams.get("documentType") || undefined,
      approvalStatus: searchParams.get("approvalStatus") || undefined,
      materialCode: searchParams.get("materialCode") || undefined,
      heatNumber: searchParams.get("heatNumber") || undefined,
      batchNumber: searchParams.get("batchNumber") || undefined,
      supplierName: searchParams.get("supplierName") || undefined,
      soNumber: searchParams.get("soNumber") || undefined,
      poNumber: searchParams.get("poNumber") || undefined,
      visibilityClassification: searchParams.get("visibilityClassification") || undefined,
      isArchived: searchParams.get("isArchived") === "true" ? true : undefined,
      isExpired: searchParams.get("isExpired") === "true" ? true : undefined,
      expiringWithinDays: searchParams.get("expiringWithinDays")
        ? parseInt(searchParams.get("expiringWithinDays")!, 10)
        : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const result = await documentService.listDocuments(filter, user);
    return NextResponse.json({ success: true, ...result, currentUser: user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const validation = CreateDocumentSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const doc = await documentService.createDocument(validation.data, user);
    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (err: any) {
    const status = err.message.includes("FORBIDDEN") ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
