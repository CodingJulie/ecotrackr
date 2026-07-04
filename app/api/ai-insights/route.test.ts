import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Мок должен быть конструктором — arrow-функции нельзя вызывать через `new`,
// поэтому используем обычную function-реализацию.
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(function (this: any) {
        this.getGenerativeModel = vi.fn().mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: { text: vi.fn().mockReturnValue('1. Совет 1\n2. Совет 2\n3. Совет 3\n4. Совет 4') },
            }),
        });
    }),
}));

describe('POST /api/ai-insights', () => {
    beforeEach(() => {
        process.env.GEMINI_API_KEY = 'fake-key';
    });

    it('возвращает инсайты', async () => {
        const req = new NextRequest('http://localhost/api/ai-insights', {
            method: 'POST',
            body: JSON.stringify({ totalCO2: 100, entries: [], refresh: false, lang: 'ru' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(data.insights).toHaveLength(4);
        expect(data.model).toBeDefined();
        expect(data.model).toContain('gemini');
        expect(data.cached).toBe(false);
    });

    it('возвращает fallback при ошибке API', async () => {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        (GoogleGenerativeAI as any).mockImplementationOnce(function () {
            throw new Error('API key missing');
        });

        const req = new NextRequest('http://localhost/api/ai-insights', {
            method: 'POST',
            body: JSON.stringify({ totalCO2: 100, entries: [], lang: 'ru' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(data.insights).toHaveLength(4);
        expect(data.error).toBe('Internal server error');
    });
});