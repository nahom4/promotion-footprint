import { NextResponse } from "next/server";
import { analyze } from "@/lib/report";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const company = typeof body.company === "string" ? body.company.trim() : "";
    if (!company || company.length > 160) return NextResponse.json({ error: "Enter a company or product name." }, { status: 400 });
    const report = await analyze(company);
    return NextResponse.json(report);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Analysis failed. Try again or check the source availability." }, { status: 500 });
  }
}
