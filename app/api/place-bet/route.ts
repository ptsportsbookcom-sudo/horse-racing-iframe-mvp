import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  console.log("place-bet payload:", payload);

  return NextResponse.json({ success: true });
}
