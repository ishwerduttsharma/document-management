export class MockIngestionService {
  processDocument(filePath: string, fileId: string, route: string) {
    return {
      fileId,
      filePath,
      extractedText: 'Mock extracted text from PDF file.',
      embedding: Array(1536).fill(0.123), // Mock embedding (OpenAI returns 1536-dim vector)
      status: 200,
    };
  }
}

//if actual post to be done to route then run: pnpm i axios and use below code instead of above in mock class
// import axios from 'axios';

// async function processDocument(filePath: string, fileId: string, route: string) {
//   try {
//     const response = await axios.post(route, {
//       filePath,
//       fileId,
//     });

//     return response.data;
//   } catch (error) {
//     console.error('Error processing document:', error.message);
//     throw error;
//   }
// }

// // Example usage
// processDocument('/path/to/file.pdf', '12345', 'http://localhost:3000/process')
//   .then((res) => console.log('Response:', res))
//   .catch((err) => console.error('Request failed:', err.message));
