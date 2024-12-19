import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
        });

        return NextResponse.json({ 
            content: completion.choices[0]?.message?.content 
        });
    } catch (error) {
        console.error('Erro ao processar mensagem OpenAI:', error);
        return NextResponse.json(
            { error: 'Erro ao processar mensagem' },
            { status: 500 }
        );
    }
} 