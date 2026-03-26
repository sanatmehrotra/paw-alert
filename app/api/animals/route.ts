import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json(store.getAnimals());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Assuming adding an animal in a realistic scenario
    // For now, in our simple prototype store, we didn't add an `addAnimal` method.
    // We'll just return a success payload.
    return NextResponse.json({ success: true, animal: body }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
