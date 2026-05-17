import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS_CACHE_TTL_MS = 60 * 60 * 1000;

interface GeminiModelInfo {
    name: string;
    supportedGenerationMethods?: string[];
}

interface ModelsCache {
    names: string[];
    fetchedAt: number;
}

let modelsCache: ModelsCache | null = null;
let cachedWorkingModel: string | null = null;

export function isUsableGeminiModel(name: string): boolean {
    if (!name.startsWith('gemini-')) {
        return false;
    }

    return !/(embed|embedding|image|veo|live|audio|tts|aqa|computer-use|robotics|nano-banana)/i.test(name);
}

export function rankGeminiModels(a: string, b: string): number {
    const score = (name: string) => {
        let value = 0;

        if (name.includes('flash') && !name.includes('lite')) {
            value += 100;
        } else if (name.includes('flash-lite')) {
            value += 60;
        } else if (name.includes('pro')) {
            value += 40;
        }

        if (name.includes('preview') || name.includes('exp')) {
            value -= 15;
        }

        const versionMatch = name.match(/gemini-(\d+(?:\.\d+)?)/);
        if (versionMatch) {
            value += Number.parseFloat(versionMatch[1]) * 10;
        }

        return value;
    };

    const diff = score(b) - score(a);
    return diff !== 0 ? diff : b.localeCompare(a, undefined, { numeric: true });
}

export function parseModelsResponse(models: GeminiModelInfo[]): string[] {
    return models
        .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model) => model.name.replace(/^models\//, ''))
        .filter(isUsableGeminiModel)
        .sort(rankGeminiModels);
}

export async function listAvailableGeminiModels(apiKey: string): Promise<string[]> {
    if (modelsCache && Date.now() - modelsCache.fetchedAt < MODELS_CACHE_TTL_MS) {
        return modelsCache.names;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
        throw new Error(`Failed to list Gemini models (${response.status})`);
    }

    const data = (await response.json()) as { models?: GeminiModelInfo[] };
    const names = parseModelsResponse(data.models ?? []);

    modelsCache = { names, fetchedAt: Date.now() };
    return names;
}

export function resolveModelCandidates(availableModels: string[]): string[] {
    const envModel = process.env.GEMINI_MODEL?.trim();
    const candidates = [
        ...(envModel ? [envModel] : []),
        ...(cachedWorkingModel ? [cachedWorkingModel] : []),
        ...availableModels,
    ];

    return [...new Set(candidates)];
}

export async function generateWithBestModel(
    genAI: GoogleGenerativeAI,
    apiKey: string,
    prompt: string,
): Promise<{ result: { response: { text: () => string } }; modelName: string }> {
    let availableModels: string[] = [];

    try {
        availableModels = await listAvailableGeminiModels(apiKey);
    } catch (error) {
        console.warn('⚠️ Failed to list Gemini models dynamically:', error);
    }

    const candidates = resolveModelCandidates(availableModels);

    if (candidates.length === 0) {
        throw new Error('No available Gemini model found');
    }

    for (const name of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent(prompt);
            cachedWorkingModel = name;
            return { result, modelName: name };
        } catch {
            continue;
        }
    }

    throw new Error('No available Gemini model found');
}

export function resetGeminiModelCacheForTests() {
    modelsCache = null;
    cachedWorkingModel = null;
}
