import fs from 'fs';
import { parseCSVContent } from './src/app/admin/utils/csv-importer';

const content = fs.readFileSync('../../issue and improvement/animals_questions_fixed_v2.csv', 'utf-8');
const result = parseCSVContent(content);
console.log(JSON.stringify(result, null, 2));
