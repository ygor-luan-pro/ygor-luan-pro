#!/usr/bin/env node
import { execSync } from 'child_process';

const PROTECTED_BRANCHES = ['main', 'master'];

try {
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  if (PROTECTED_BRANCHES.includes(currentBranch)) {
    console.error(`❌ Commits diretos na branch '${currentBranch}' são proibidos.`);
    console.error('   Crie uma feature branch: git checkout -b feature/nome');
    process.exit(1);
  }
  console.log(`✅ Branch '${currentBranch}' ok.`);
  process.exit(0);
} catch {
  console.error('❌ Falha ao detectar branch atual.');
  process.exit(1);
}
