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

    it('allows /dashboard through', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('redirects to /login when user is missing on /dashboard', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        });
        req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe('http://localhost/login');
    });

    it('allows /dashboard for authenticated user', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);
        expect(res.status).toBe(200);
    });

    it('redirects from /login to /dashboard for authenticated user', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/login');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe('http://localhost/dashboard');
    });

    it('redirects from /register to /dashboard for authenticated user', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }) },
        });
        req = new NextRequest('http://localhost/register');
        const res = await middleware(req);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe('http://localhost/dashboard');
    });

    it('sets CSP and other headers', async () => {
        const { createServerClient } = await import('@supabase/ssr');
        (createServerClient as any).mockReturnValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        });
        req = new NextRequest('http://localhost/public');
        const res = await middleware(req);
        const csp = res.headers.get('Content-Security-Policy') || '';
        expect(csp).toContain("img-src");
        expect(csp).toContain('https://*.supabase.co');
        expect(res.headers.get('Strict-Transport-Security')).toBeDefined();
    });
});