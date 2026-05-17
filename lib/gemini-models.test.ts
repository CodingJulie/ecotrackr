import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    isUsableGeminiModel,
    rankGeminiModels,
    parseModelsResponse,
    resolveModelCandidates,
    resetGeminiModelCacheForTests,
} from './gemini-models';

describe('gemini-models', () => {
    beforeEach(() => {
        resetGeminiModelCacheForTests();
        delete process.env.GEMINI_MODEL;
    });

    it('filters only suitable gemini models', () => {
        expect(isUsableGeminiModel('gemini-3.5-flash')).toBe(true);
        expect(isUsableGeminiModel('gemini-embedding-001')).toBe(false);
        expect(isUsableGeminiModel('text-embedding-004')).toBe(false);
    });

    it('ranks flash models above pro', () => {
        const ranked = [
            'gemini-2.5-pro',
            'gemini-3.5-flash',
            'gemini-3.7-flash',
        ].sort(rankGeminiModels);

        expect(ranked[0]).toBe('gemini-3.7-flash');
        expect(ranked[1]).toBe('gemini-3.5-flash');
    });

    it('parses models.list response', () => {
        const names = parseModelsResponse([
            { name: 'models/gemini-3.5-flash', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent'] },
            { name: 'models/gemini-3.7-flash', supportedGenerationMethods: ['generateContent'] },
        ]);

        expect(names).toEqual(['gemini-3.7-flash', 'gemini-3.5-flash']);
    });

    it('puts GEMINI_MODEL first in candidate list', () => {
        process.env.GEMINI_MODEL = 'gemini-custom';

        const candidates = resolveModelCandidates(['gemini-3.5-flash', 'gemini-3.7-flash']);

        expect(candidates[0]).toBe('gemini-custom');
        expect(candidates).toContain('gemini-3.7-flash');
    });
});
