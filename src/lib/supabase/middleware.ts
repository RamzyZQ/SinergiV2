import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // -----------------------------------------------------------------------
  // Route classification
  // -----------------------------------------------------------------------
  const path = request.nextUrl.pathname;

  const isAuthPage =
    path.startsWith('/login') || path.startsWith('/register');

  const isAdminPage = path.startsWith('/admin');

  const isProtectedPage =
    path.startsWith('/dashboard') ||
    path.startsWith('/profile') ||
    path.startsWith('/apply') ||
    path.startsWith('/result');

  // Fast path: Check whether any Supabase auth cookie exists.
  // If user has no auth cookie, avoid hitting the Supabase Auth API over the network.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  if (!hasAuthCookie) {
    if (isProtectedPage || isAdminPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // Public routes (landing, login, register, privacy) return immediately with zero network delay
    return supabaseResponse;
  }

  // -----------------------------------------------------------------------
  // Revalidate Auth token only when auth cookie is present
  // -----------------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // -----------------------------------------------------------------------
  // Redirect unauthenticated users away from protected pages
  // -----------------------------------------------------------------------
  if (!user && (isProtectedPage || isAdminPage)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // -----------------------------------------------------------------------
  // Redirect authenticated users away from auth pages
  // -----------------------------------------------------------------------
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // -----------------------------------------------------------------------
  // Admin route guard — check role from DB
  // -----------------------------------------------------------------------
  if (user && isAdminPage) {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
