import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const dataPath = join(process.cwd(), 'src', 'data', 'questions.json');
    await writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save quiz data:', error);
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to save quiz data' });
}
