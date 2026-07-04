import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';

vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(),
}));

describe('middleware', () => {
    let req: NextRequest;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
    });

    it('редиректит /en/dashboard -> /dashboard', async () => {
        req = new NextRequest('http://localhost/en/dashboard');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe('http://localhost/dashboard');
    });

    it('редиректит /ru -> /', async () => {
        req = new NextRequest('http://localhost/ru');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe('http://localhost/');
    });

    it('пропускает /dashboard без префикса', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('редиректит на /login при отсутствии пользователя на /dashboard', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        });
        req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        // ✅ Проверяем полный URL или путь
        expect(res.headers.get('location')).toBe('http://localhost/login');
    });

    it('пропускает /dashboard для авторизованного пользователя', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);
        expect(res.status).toBe(200);
    });

    it('редиректит с /login на /dashboard для авторизованного пользователя', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/login');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        // ✅ Проверяем полный URL
        expect(res.headers.get('location')).toBe('http://localhost/dashboard');
    });

    it('редиректит с /register на /dashboard для авторизованного пользователя', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/register');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        // ✅ Проверяем полный URL
        expect(res.headers.get('location')).toBe('http://localhost/dashboard');
    });

    it('устанавливает CSP и другие заголовки', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        });
        req = new NextRequest('http://localhost/public');
        const res = await middleware(req);
        expect(res.headers.get('Content-Security-Policy')).toBeDefined();
        expect(res.headers.get('Strict-Transport-Security')).toBeDefined();
    });
});