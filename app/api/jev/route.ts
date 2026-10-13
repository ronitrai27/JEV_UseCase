import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = (
      body.apiKey?.trim() ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      process.env.OPENROUTER_KEY ||
      ""
    ).trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing OpenRouter API Key. Please ensure OPENROUTER_API_KEY is set in your .env or .env.local file, or pass apiKey in the request.",
        },
        { status: 401 }
      );
    }

    const payload = {
      model: body.model || "typesafe/jev-1.13",
      state: body.state,
      questions: body.questions,
    };

    const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "JEV Decisions Playground",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || data?.message || "Failed to call OpenRouter JEV API",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
