export class MockIngestionService {
  processDocument(filePath: string, fileId: string) {
    return {
      fileId,
      filePath,
      extractedText: 'Mock extracted text from PDF file.',
      embedding: Array(1536).fill(0.123), // Mock embedding (OpenAI returns 1536-dim vector)
      status: 200,
    };
  }
}
