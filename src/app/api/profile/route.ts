import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";

export async function POST(request: Request) {
  const auth = await requireApiRole("employer");
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

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
