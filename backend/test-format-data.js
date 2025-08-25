// Test script to debug the format-data endpoint
const axios = require('axios');

async function testFormatData() {
    const testContent = `
Unit 1. Family Life
I. Pronunciation
II. Vocabulary
III. Grammar

Speaking - Unit 1: Family life

1. Complete the conversations by circling the best answers.

1. Lan: Nam, do you think family routines are necessary?
   Nam: Yes. _________ each family should have some routines to help build strong family bonds.
   A. I'm not sure that
   B. I strongly believe that
   C. I agree that
   D. I hope that

Answer: B
`;

    try {
        const response = await axios.post('http://localhost:10001/api/vocabulary/format-data', {
            content: testContent,
            apiKey: process.argv[2], // Pass API key as command line argument
            source: 'Test',
            sourceUrl: 'http://test.com'
        });

        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('Server error:', error.response.data.error);
        }
    }
}

if (!process.argv[2]) {
    console.error('Please provide Gemini API key as argument: node test-format-data.js YOUR_API_KEY');
    process.exit(1);
}

testFormatData();