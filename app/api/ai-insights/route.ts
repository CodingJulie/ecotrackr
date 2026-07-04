import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const { totalCO2, entries, refresh = false, lang = 'en' } = await req.json();

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

        const modelNames = [
            'gemini-2.0-flash-exp',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-pro',
        ];

        let model;
        let modelName = '';

        for (const name of modelNames) {
            try {
                const testModel = genAI.getGenerativeModel({ model: name });
                await testModel.generateContent('ping');
                model = testModel;
                modelName = name;
                console.log(`✅ Using model: ${name}`);
                break;
            } catch (e: any) {
                console.log(`⛔ Model ${name} not available (${e.status || e.message}), trying next...`);
            }
        }

        if (!model) {
            console.error('❌ No available Gemini model found');
            return Response.json({
                insights: getFallbackInsights(lang),
                cached: false,
                error: 'No model available'
            });
        }

        let entriesText = "Нет записей";
        if (entries && entries.length > 0) {
            entriesText = entries.map((entry: any, index: number) => {
                return `${index + 1}. ${entry.category} - ${entry.activity}: ${entry.value} ед. (${entry.co2e} кг CO₂e)`;
            }).join('\n');
        }

        const promptTemplates = [
            `Ты — эксперт по экологии. Дай 4 коротких, мотивирующих совета по снижению углеродного следа.

Данные пользователя:
- Общий след: ${totalCO2} кг CO₂e
- Активности:
${entriesText}

Советы должны быть:
1. Конкретными и выполнимыми
2. Разными по тематике
3. С эмодзи в начале
4. Основанными на данных пользователя

Формат: просто 4 пункта с 1. 2. 3. 4.`,

            `Как эко-консультант, проанализируй профиль пользователя и дай 4 персональные рекомендации.

Статистика:
- Общий CO₂: ${totalCO2} кг
- Последние действия: ${entriesText}

Ответь нумерованным списком из 4 пунктов.`,

            `Проанализируй экологические привычки пользователя и предложи 4 способа улучшения.

Данные:
CO₂ след: ${totalCO2} кг
Недавние действия: ${entriesText}

Формат: 1. 2. 3. 4.`
        ];

        const randomIndex = refresh ? Math.floor(Math.random() * promptTemplates.length) : 0;
        const prompt = promptTemplates[randomIndex];

        console.log(`📝 Using prompt template: ${randomIndex + 1} with model: ${modelName}`);

        let result;
        try {
            result = await model.generateContent(prompt);
        } catch (genError: any) {
            console.error('❌ Generation error:', genError);
            return Response.json({
                insights: getFallbackInsights(lang),
                cached: false,
                error: 'Generation failed'
            });
        }

        const text = result.response.text();
        console.log('✅ Gemini response:', text);

        let insights = text
            .split('\n')
            .filter(line => line.match(/^\d+\./))
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(line => line.length > 10);

        if (insights.length < 4) {
            insights = text
                .split('\n')
                .filter(line => line.length > 15 && (line.match(/[🌍🌱💡🚗🥩♻️]/) || line.includes('•')))
                .map(line => line.replace(/^[•\-]\s*/, '').trim())
                .slice(0, 4);
        }

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
            insights: getFallbackInsights('en'),
            cached: false,
            error: 'Internal server error'
        });
    }
}

function getFallbackInsights(lang: string): string[] {
    if (lang === 'ru') {
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