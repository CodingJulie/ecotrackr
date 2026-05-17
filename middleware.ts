import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase-env';

function getSupabaseOrigin(): string | null {
    if (!isSupabaseConfigured()) return null;

    try {
        return new URL(getSupabaseUrl()).origin;
    } catch {
        return null;
    }
}

function buildContentSecurityPolicy(supabaseOrigin: string | null): string {
    const supabaseSources = supabaseOrigin
        ? `${supabaseOrigin} https://*.supabase.co wss://${new URL(supabaseOrigin).host}`
        : 'https://*.supabase.co';

    return (
        "default-src 'self'; " +
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${supabaseSources}; ` +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' https://*.supabase.co https://tile.openstreetmap.org https://a.basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://mt1.google.com https://*.google.com data: blob:; " +
        `connect-src 'self' ${supabaseSources} http://localhost:3000 http://localhost:3001 https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://a.basemaps.cartocdn.com https://*.basemaps.cartocdn.com; ` +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "worker-src 'self' blob:; " +
        "frame-src 'self';"
    );
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    let supabaseResponse = NextResponse.next({ request });
    let user: { id: string } | null = null;
    let error: Error | null = null;

    if (isSupabaseConfigured()) {
        const supabase = createServerClient(
            getSupabaseUrl(),
            getSupabaseAnonKey(),
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

        const authResult = await supabase.auth.getUser();
        user = authResult.data.user;
        error = authResult.error;
    }

    if (pathname.startsWith('/dashboard') && (!user || error)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/settings') && (!user || error)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && !error && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const response = supabaseResponse || NextResponse.next();
    response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(getSupabaseOrigin()));
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

    return response;
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/settings/:path*',
        '/login',
        '/register',
        '/:path*',
    ],
};