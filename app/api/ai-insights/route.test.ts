import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

const generateWithBestModel = vi.fn().mockResolvedValue({
    result: {
        response: { text: vi.fn().mockReturnValue('1. Tip 1\n2. Tip 2\n3. Tip 3\n4. Tip 4') },
    },
    modelName: 'gemini-3.7-flash',
});

vi.mock('@/lib/gemini-models', () => ({
    generateWithBestModel: (...args: unknown[]) => generateWithBestModel(...args),
}));

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(function () {
        return {};
    }),
}));

describe('POST /api/ai-insights', () => {
    beforeEach(() => {
        process.env.GEMINI_API_KEY = 'fake-key';
        generateWithBestModel.mockClear();
    });

    it('returns insights', async () => {
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

    it('asks Gemini to respond in Russian when lang=ru', async () => {
        const req = new NextRequest('http://localhost/api/ai-insights', {
            method: 'POST',
            body: JSON.stringify({ totalCO2: 100, entries: [], refresh: false, lang: 'ru' }),
        });

        await POST(req);

        const prompt = generateWithBestModel.mock.calls.at(-1)?.[2] as string;
        expect(prompt).toMatch(/Russian/i);
    });

    it('parses Russian responses in 1) format', async () => {
        generateWithBestModel.mockResolvedValueOnce({
            result: {
                text: vi.fn(),
                response: {
                    text: vi.fn().mockReturnValue(
                        '1) 🚗 Попробуйте чаще пользоваться общественным транспортом вместо автомобиля\n' +
                        '2) 💡 Замените лампы накаливания на светодиодные для экономии электроэнергии\n' +
                        '3) 🥩 Добавьте один вегетарианский день в неделю для снижения выбросов\n' +
                        '4) ♻️ Начните сортировать отходы: пластик, стекло, бумага и металл',
                    ),
                },
            },
            modelName: 'gemini-3.7-flash',
        });

        const req = new NextRequest('http://localhost/api/ai-insights', {
            method: 'POST',
            body: JSON.stringify({ totalCO2: 100, entries: [], refresh: false, lang: 'ru' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(data.insights).toHaveLength(4);
        expect(data.insights[0]).toMatch(/транспорт/i);
    });

    it('asks Gemini to respond in English when lang=en', async () => {
        const req = new NextRequest('http://localhost/api/ai-insights', {
            method: 'POST',
            body: JSON.stringify({ totalCO2: 100, entries: [], refresh: false, lang: 'en' }),
        });

        await POST(req);

        const prompt = generateWithBestModel.mock.calls.at(-1)?.[2] as string;
        expect(prompt).toMatch(/English/i);
    });

    it('returns fallback on API error', async () => {
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
