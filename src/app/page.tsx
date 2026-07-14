import { redirect } from "next/navigation";
import { WelcomeScreen } from "@/components/welcome-screen";
import { createClient } from "@/lib/supabase/server";
import { getHomePath, resolveUserRole } from "@/lib/auth/roles";

export default async function HomePage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const role = await resolveUserRole(supabase, user);
      if (role) {
        redirect(getHomePath(role));
      }
    }
  } catch {
    // Missing/invalid env on first deploy should still show the welcome page.
  }

  return <WelcomeScreen />;
}
