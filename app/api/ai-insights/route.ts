import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateWithBestModel } from '@/lib/gemini-models';

type AppLanguage = 'en' | 'ru';

function normalizeLang(lang: string | undefined): AppLanguage {
    return lang?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function getLanguageInstruction(lang: AppLanguage): string {
    return lang === 'ru'
        ? 'IMPORTANT: Write all tips in Russian. Use numbered format starting each line with "1. ", "2. ", "3. ", "4. ".'
        : 'IMPORTANT: Write all tips in English. Use numbered format starting each line with "1. ", "2. ", "3. ", "4. ".';
}

function parseInsightsFromText(text: string): string[] {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

    const numbered = lines
        .map((line) => {
            const dotted = line.match(/^\s*(?:\*{1,2})?\d+(?:\*{1,2})?[.)]\s*(.+)$/);
            if (dotted) {
                return dotted[1].replace(/\*\*/g, '').trim();
            }

            const dashed = line.match(/^\s*\d+\s*[:\-–—]\s*(.+)$/);
            if (dashed) {
                return dashed[1].trim();
            }

            return null;
        })
        .filter((line): line is string => !!line && line.length > 10);

    if (numbered.length >= 4) {
        return numbered.slice(0, 4);
    }

    const emojiLines = lines
        .filter((line) => /\p{Extended_Pictographic}/u.test(line) && line.length > 15)
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line.length > 10);

    if (emojiLines.length >= 4) {
        return emojiLines.slice(0, 4);
    }

    const combined = [...numbered, ...emojiLines.filter((line) => !numbered.includes(line))];
    return combined.slice(0, 4);
}

export async function POST(req: NextRequest) {
    let lang: AppLanguage = 'en';

    try {
        const body = await req.json();
        const { totalCO2, entries, refresh = false, labels } = body;
        lang = normalizeLang(body.lang);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            return Response.json({
                insights: getFallbackInsights(lang),
                cached: false,
                error: 'API key missing'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const unitsLabel = labels?.units ?? 'units';
        const kgLabel = labels?.kg ?? 'kg';
        let entriesText = labels?.noEntries ?? 'No entries';
        if (entries && entries.length > 0) {
            entriesText = entries.map((entry: any, index: number) => {
                return `${index + 1}. ${entry.category} - ${entry.activity}: ${entry.value} ${unitsLabel} (${entry.co2e} ${kgLabel} CO₂e)`;
            }).join('\n');
        }

        const languageInstruction = getLanguageInstruction(lang);

        const promptTemplates = [
            `You are an environmental expert. Give 4 short, motivating tips to reduce the carbon footprint.

User data:
- Total footprint: ${totalCO2} kg CO₂e
- Activities:
${entriesText}

Tips should be:
1. Specific and actionable
2. Varied in topic
3. Starting with an emoji
4. Based on the user's data

${languageInstruction}

Format: just 4 numbered items as 1. 2. 3. 4.`,

            `As an eco consultant, analyze the user's profile and give 4 personal recommendations.

Stats:
- Total CO₂: ${totalCO2} kg
- Recent actions: ${entriesText}

${languageInstruction}

Reply with a numbered list of 4 items.`,

            `Analyze the user's environmental habits and suggest 4 ways to improve.

Data:
CO₂ footprint: ${totalCO2} kg
Recent actions: ${entriesText}

${languageInstruction}

Format: 1. 2. 3. 4.`
        ];

        const randomIndex = refresh ? Math.floor(Math.random() * promptTemplates.length) : 0;
        const prompt = promptTemplates[randomIndex];

        let result;
        let modelName = '';

        try {
            const generated = await generateWithBestModel(genAI, apiKey, prompt);
            result = generated.result;
            modelName = generated.modelName;
        } catch (genError: any) {
            console.error('❌ Generation error:', genError);
            return Response.json({
                insights: getFallbackInsights(lang),
                cached: false,
                error: genError.message === 'No available Gemini model found' ? 'No model available' : 'Generation failed'
            });
        }

        const text = result.response.text();

        let insights = parseInsightsFromText(text);

        if (insights.length < 4) {
            insights = getFallbackInsights(lang);
        }

        const finalInsights = insights.slice(0, 4);

        return Response.json({
            insights: finalInsights,
            model: modelName,
            cached: false
        });

    } catch (error) {
        console.error('❌ Unhandled error:', error);
        return Response.json({
            insights: getFallbackInsights(lang),
            cached: false,
            error: 'Internal server error'
        });
    }
}

function getFallbackInsights(lang: string | undefined): string[] {
    if (normalizeLang(lang) === 'ru') {
        return [
            "🚗 Попробуйте добираться до работы на велосипеде или общественном транспорте",
            "💡 Замените лампы накаливания на светодиодные - это сэкономит до 80% электроэнергии",
            "🥩 Устройте один вегетарианский день в неделю - это снизит ваш след на 10%",
            "♻️ Начните сортировать отходы: пластик, стекло, бумага, металл"
        ];
    }
    return [
        "🚗 Try cycling or public transport to work",
        "💡 Replace incandescent bulbs with LEDs – save up to 80% energy",
        "🥩 Have one vegetarian day a week – reduce your footprint by 10%",
        "♻️ Start sorting waste: plastic, glass, paper, metal"
    ];
}