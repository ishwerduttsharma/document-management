import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import pMap from 'p-map';

const API_URL = 'http://localhost:3000/document'; // Adjust to your API URL
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJrc2Q4OHlhbnlna3ZxczdldmZ6MXlnZTkiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwicGxhdGZvcm1Sb2xlIjoiQURNSU4iLCJpYXQiOjE3NDE0NDYyOTksImV4cCI6MTc0MTQ2MDY5OX0.oddp-OTnSr5ubgI7G6-2BOPA4fv4fKcFtYDs-1mhDok'; // Replace with a valid token
const CONCURRENT_REQUESTS = 300; // Number of concurrent uploads
const FILE_PATH =
  'C:\\Users\\shivdutt\\Desktop\\ishwer\\document_management_project\\document-management\\document-management\\uploads\\ksd88yanygkvqs7evfz1yge9\\2025\\bhlx11fu240rm17nmstbgfxr.jpeg';

async function uploadFile(): Promise<void> {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(FILE_PATH));

    const response = await axios.post(API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log(`✅ Upload success: ${response.status}`);
  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
  }
}

async function runLoadTest() {
  console.log(
    `Starting load test with ${CONCURRENT_REQUESTS} concurrent uploads...`,
  );

  const startTime = Date.now(); // Start time

  await pMap(
    Array.from({ length: CONCURRENT_REQUESTS }),
    async () => {
      await uploadFile();
    },
    { concurrency: CONCURRENT_REQUESTS },
  );

  const endTime = Date.now(); // End time
  const timeTaken = (endTime - startTime) / 1000; // Convert ms to seconds

  console.log(`Load test completed in ${timeTaken.toFixed(2)} seconds!`);
}

runLoadTest();
