import { killBrowser } from "@/lib/kernel/utils";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const sandboxId = req.nextUrl.searchParams.get("sandboxId");
    
    if (!sandboxId) {
      return new Response(
        JSON.stringify({ error: "sandboxId is required" }), 
        { status: 400 }
      );
    }

    await killBrowser(sandboxId);
    
    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to kill browser:", error);
    return new Response(
      JSON.stringify({ error: "Failed to kill browser" }), 
      { status: 500 }
    );
  }
}