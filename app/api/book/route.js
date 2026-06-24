import fs from "fs/promises";
import { NextResponse } from "next/server";
import { BOOK_PATH } from "../../../src/paths.js";

export async function GET() {
  try {
    const buf = await fs.readFile(BOOK_PATH);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }
}
