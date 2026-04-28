import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/payment";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "nigeria";

    const banks = await PaymentService.getBankList(country);

    return NextResponse.json({ success: true, data: banks });
  } catch (error: any) {
    console.error("Failed to fetch banks:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch banks" },
      { status: 500 }
    );
  }
}
