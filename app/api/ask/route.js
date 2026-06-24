import { NextResponse } from "next/server";
import { askQuestion } from "../../../src/query";
import { state } from "../state";

export async function POST(request) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }
    if (!state.currentFileUri) {
      return NextResponse.json({ error: "No file uploaded yet" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`[Server] Question: ${question}`);

    const answer = await askQuestion(apiKey, state.currentFileUri, question);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[Server] Query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
