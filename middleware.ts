// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 1️⃣ Редирект с /ru, /en, /ru/*, /en/* на путь без префикса
    const localePrefixRegex = /^\/(en|ru)(\/|$)/;
    if (localePrefixRegex.test(pathname)) {
        const newPath = pathname.replace(/^\/(en|ru)/, '') || '/';
        const url = new URL(newPath, request.url);
        return NextResponse.redirect(url);
    }

    // 2️⃣ Создаём ответ и клиент Supabase (как в proxy.ts)
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

    // Проверяем пользователя
    const { data: { user }, error } = await supabase.auth.getUser();

    // 3️⃣ Защита маршрутов
    if (pathname.startsWith('/dashboard') && (!user || error)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/settings') && (!user || error)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Если пользователь уже авторизован и пытается зайти на /login или /register
    if (user && !error && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 4️⃣ Заголовки безопасности (были в middleware.ts)
    const response = supabaseResponse || NextResponse.next();
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fgvghjbdifuipretksy.supabase.co; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' https://tile.openstreetmap.org https://a.basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://mt1.google.com https://*.google.com data:; " +
        "connect-src 'self' https://fgvghjbdifuipretksy.supabase.co https://*.supabase.co wss://fgvghjbdifuipretksy.supabase.co http://localhost:3000 https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://a.basemaps.cartocdn.com https://*.basemaps.cartocdn.com; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "worker-src 'self' blob:; " +
        "frame-src 'self';"
    );
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
        '/:path*', // для редиректов и заголовков
    ],
};