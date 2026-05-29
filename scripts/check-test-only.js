#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const TEST_DIRS = ['tests', 'src'];
const EXTENSIONS = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') return [];
      return walk(fullPath);
    }
    return EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [fullPath] : [];
  });
}

function findOnlys(files) {
  const found = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/\b(it|describe|test)\.only\s*\(/.test(line)) {
        found.push({ file, line: i + 1, text: line.trim() });
      }
    }
  }
  return found;
}

function collectTestFiles() {
  const files = [];
  for (const dir of TEST_DIRS) {
    try {
      statSync(dir);
      files.push(...walk(dir));
    } catch {
      // directory does not exist
    }
  }
  return files;
}

const files = collectTestFiles();
const onlys = findOnlys(files);

if (onlys.length > 0) {
  console.error('❌ .only encontrado em testes:');
  for (const o of onlys) {
    console.error(`   ${o.file}:${o.line}  ${o.text}`);
  }
  process.exit(1);
}

console.log('✅ Nenhum .only encontrado.');
process.exit(0);
