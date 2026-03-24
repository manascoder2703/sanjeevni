import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('audio');

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'voice');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const filename = `${uuidv4()}.webm`;
    const path = join(uploadDir, filename);

    // Write file
    await writeFile(path, buffer);
    console.log(`✅ Voice message saved to ${path}`);

    const url = `/uploads/voice/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Voice upload error:', error);
    return NextResponse.json({ error: 'Failed to upload voice message' }, { status: 500 });
  }
}
