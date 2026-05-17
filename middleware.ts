import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: req,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        req.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request: req,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Важно: используем getUser() вместо getSession() для большей безопасности
    // getUser() проверяет и обновляет сессию автоматически
    const { data: { user }, error } = await supabase.auth.getUser();

    // Защищаем все маршруты /dashboard/*
    if (req.nextUrl.pathname.startsWith('/dashboard') && (!user || error)) {
        const redirectUrl = new URL('/login', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Защищаем /settings
    if (req.nextUrl.pathname.startsWith('/settings') && (!user || error)) {
        const redirectUrl = new URL('/login', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Опционально: если пользователь авторизован и пытается зайти на /login или /register
    if (user && !error && (
        req.nextUrl.pathname === '/login' ||
        req.nextUrl.pathname === '/register'
    )) {
        const redirectUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/settings/:path*',
        '/login',
        '/register',
    ],
};