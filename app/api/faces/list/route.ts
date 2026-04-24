import { readdirSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const facesDir = join(process.cwd(), "public", "faces");
    const files = readdirSync(facesDir).filter(
      (file) =>
        file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !file.startsWith(".")
    );

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error("Error listing faces:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array if folder doesn't exist
  }
}
