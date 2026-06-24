import { NextResponse } from "next/server";
import { state } from "../state";

export async function GET() {
  return NextResponse.json({
    ready: !!state.currentFileUri,
    loading: state.loading,
    fileName: state.currentFileName,
    error: state.error,
  });
}
