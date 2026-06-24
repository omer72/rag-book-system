import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { state, loadBook } from "../state";

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF only" }, { status: 400 });
    }

    const savedName = file.name || "book.pdf";
    const savePath = path.join(process.cwd(), "book.pdf");
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(savePath, bytes);

    // ponytail: await the load so the client sees ready in one shot
    await loadBook(savePath, savedName);

    if (state.error) {
      return NextResponse.json({ error: state.error }, { status: 500 });
    }
    return NextResponse.json({ ready: true, fileName: state.currentFileName });
  } catch (error) {
    console.error("[Server] Upload error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
