import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,        // или XAI_API_KEY
});

export async function POST(req: NextRequest) {
    try {
        const { totalCO2, entries } = await req.json();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",                   // или grok-beta
            messages: [
                {
                    role: "system",
                    content: "Ты — эксперт по экологии и климату. Давай короткие, мотивирующие и практичные советы."
                },
                {
                    role: "user",
                    content: `Пользователь имеет общий углеродный след ${totalCO2} кг CO₂e.
          Последние записи: ${JSON.stringify(entries)}.
          Дай 4 персональные рекомендации, как снизить footprint.`
                }
            ],
            temperature: 0.7,
            max_tokens: 600,
        });

        const text = completion.choices[0].message.content || "";
        const insights = text.split('\n').filter(line => line.trim().length > 10);

        return Response.json({ insights });
    } catch (error) {
        return Response.json({ insights: ["AI временно недоступен. Попробуйте позже."] });
    }
}