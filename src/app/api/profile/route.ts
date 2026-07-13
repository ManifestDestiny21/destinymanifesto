import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabase.from("company_profiles").upsert(
    {
      user_id: user.id,
      company_name: body.company_name,
      website: body.website || null,
      location: body.location || null,
      description: body.description || null,
      felon_friendly: Boolean(body.felon_friendly),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
