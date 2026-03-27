import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  // After email magic link click, redirect to admin
  return NextResponse.redirect(new URL("/admin", requestUrl.origin));
}
