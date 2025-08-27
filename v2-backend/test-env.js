import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing environment variable loading...');
console.log('Current directory:', __dirname);
console.log('Env file path:', path.join(__dirname, '.env'));

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'FOUND' : 'NOT FOUND');
console.log('PORT:', process.env.PORT);