import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "placeholder",
    message:
      "AI insights endpoint — connect an LLM provider here to generate spending summaries and recommendations.",
    insights: [],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      status: "placeholder",
      message: "POST /api/insights will accept prompts and return AI-generated financial insights.",
    },
    { status: 501 }
  );
}
