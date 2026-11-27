import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getHomePath,
  isEmployerPath,
  isProtectedPath,
  isSeekerPath,
  getUserRole,
} from "@/lib/auth/roles";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = isEmployerPath(pathname) ? "/login" : "/login";
    if (isSeekerPath(pathname)) {
      url.searchParams.set("role", "job-seeker");
    }
    return NextResponse.redirect(url);
  }

  if (user && isProtectedPath(pathname)) {
    const role = getUserRole(user);

    if (role === "employer" && isSeekerPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getHomePath("employer");
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (role === "job_seeker" && isEmployerPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getHomePath("job_seeker");
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
