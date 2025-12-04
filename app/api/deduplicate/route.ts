import { NextRequest, NextResponse } from 'next/server';
import * as fuzz from 'fuzzball';
import Papa from 'papaparse';

const NICKNAME_MAP: Record<string, string[]> = {
  'robert': ['rob', 'bob', 'bobby'], 'william': ['will', 'bill', 'billy'],
  'james': ['jim', 'jimmy'], 'michael': ['mike', 'mikey']
};

function areNamesRelated(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return true;
  for (const [fullName, nicknames] of Object.entries(NICKNAME_MAP)) {
    if ((n1 === fullName && nicknames.includes(n2)) || (n2 === fullName && nicknames.includes(n1)) || (nicknames.includes(n1) && nicknames.includes(n2))) return true;
  }
  return false;
}

interface Record { firstName?: string; lastName?: string; email?: string; company?: string; [key: string]: any; }

class DedupeEngine {
  threshold = 75;
  weights = { firstName: 0.3, lastName: 0.25, email: 0.25, company: 0.2 };
  
  compareRecords(r1: Record, r2: Record) {
    const s = { firstName: 0, lastName: 0, email: 0, company: 0, overall: 0 };
    if (r1.email && r2.email && r1.email.toLowerCase() === r2.email.toLowerCase()) return { match: true, confidence: 100, reason: 'Exact email', scores: s };
    if (r1.firstName && r2.firstName) s.firstName = areNamesRelated(r1.firstName, r2.firstName) ? 95 : fuzz.ratio(r1.firstName.toLowerCase(), r2.firstName.toLowerCase());
    if (r1.lastName && r2.lastName) s.lastName = fuzz.ratio(r1.lastName.toLowerCase(), r2.lastName.toLowerCase());
    if (r1.email && r2.email) s.email = fuzz.partial_ratio(r1.email.toLowerCase(), r2.email.toLowerCase());
    if (r1.company && r2.company) s.company = fuzz.token_sort_ratio(r1.company.toLowerCase(), r2.company.toLowerCase());
    s.overall = s.firstName * this.weights.firstName + s.lastName * this.weights.lastName + s.email * this.weights.email + s.company * this.weights.company;
    return { match: s.overall >= this.threshold, confidence: Math.round(s.overall), reason: 'Match detected', scores: s };
  }
  
  dedupeRecords(records: Record[]) {
    const duplicates: any[] = [];
    const clusters: any[] = [];
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const result = this.compareRecords(records[i], records[j]);
        if (result.match) {
          duplicates.push({ indices: [i, j], confidence: result.confidence });
          clusters.push({ id: clusters.length, records: [records[i], records[j]], matchReason: result.reason });
        }
      }
    }
    const toRemove = new Set<number>();
    duplicates.forEach(d => toRemove.add(d.indices[1]));
    const cleanRecords = records.filter((r, i) => !toRemove.has(i));
    return { 
      cleanRecords, 
      removedCount: toRemove.size, 
      duplicates, 
      clusters,
      summary: { 
        totalRecords: records.length, 
        uniqueRecords: cleanRecords.length,
        duplicatesFound: duplicates.length 
      } 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const csvText = await request.text();
    if (!csvText) return NextResponse.json({ error: 'No CSV' }, { status: 400 });
    const parseResult = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parseResult.errors?.length) return NextResponse.json({ error: 'Parse error' }, { status: 400 });
    const engine = new DedupeEngine();
    const results = engine.dedupeRecords(parseResult.data as Record[]);
    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
