import { readFileSync, writeFileSync } from 'node:fs';

const path='src/card-collection.js';
let source=readFileSync(path,'utf8');
source=source.replace("model:model || 'gpt-5.6-terra'","model");
writeFileSync(path,source);
