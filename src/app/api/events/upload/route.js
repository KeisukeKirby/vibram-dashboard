import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';

// Issues client upload tokens so photos/videos go straight from the browser
// to Vercel Blob (bypassing the serverless request body size limit).
export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Vercel Blob が未設定です（BLOB_READ_WRITE_TOKEN）。Vercel の Storage から Blob ストアを作成してプロジェクトに接続してください。' },
      { status: 500 }
    );
  }
  try {
    const body = await request.json();
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('events/')) throw new Error('Invalid upload path');
        return {
          allowedContentTypes: ['image/*', 'video/*'],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
