import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { updateWeeklyNeeds } from "@/lib/storage";

export async function POST(request: Request) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Staff sign-in is required." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { categories?: string[] };
    const categories = (payload.categories ?? []).map((value) => value.trim()).filter(Boolean);

    if (categories.length === 0) {
      return NextResponse.json({ error: "Add at least one category." }, { status: 400 });
    }

    const weeklyNeeds = await updateWeeklyNeeds(categories);
    revalidatePath("/");
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true, weeklyNeeds });
  } catch {
    return NextResponse.json({ error: "Unable to update this week's needs right now." }, { status: 500 });
  }
}
