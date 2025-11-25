import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import DedupeEngine from '@/lib/dedupe-engine';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        const text = await file.text();

        return new Promise((resolve) => {
            Papa.parse(text, {
                header: true,
                complete: (results: Papa.ParseResult<any>) => {
                    try {
                        const engine = new DedupeEngine({ threshold: 75 });
                        // @ts-ignore - DedupeEngine is JS and might have loose typing
                        const dedupeResults = engine.dedupeRecords(results.data);

                        resolve(NextResponse.json({
                            success: true,
                            ...dedupeResults
                        }));
                    } catch (err) {
                        console.error('Dedupe error:', err);
                        resolve(NextResponse.json(
                            { error: 'Failed to process records' },
                            { status: 500 }
                        ));
                    }
                },
                error: (err: any) => {
                    console.error('CSV Parse error:', err);
                    resolve(NextResponse.json(
                        { error: 'Failed to parse CSV' },
                        { status: 400 }
                    ));
                }
            });
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
