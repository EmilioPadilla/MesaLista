import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the centralized OpenAPI specification
const openApiPath = path.join(__dirname, 'swagger', 'openapi.yaml');
const openApiContent = fs.readFileSync(openApiPath, 'utf8');
const specs = yaml.load(openApiContent) as object;

export default specs;
