"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { clearLocalUserData } from "@/lib/clear-local-data";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await clearLocalUserData();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
    >
      Logout
    </button>
  );
}
