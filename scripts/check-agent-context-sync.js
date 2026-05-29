import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const AGENTS_PATH = path.join(ROOT, 'AGENTS.md');
const CLAUDE_PATH = path.join(ROOT, 'CLAUDE.md');
const OPENCODE_PATH = path.join(ROOT, 'opencode.json');

const WRITE = process.argv.includes('--write');

function normalizeAgentFile(content) {
  return content
    .replace(/^# (AGENTS|CLAUDE)\.md\r?\n/, '')
    .trimEnd();
}

function toClaudeFile(body) {
  return `# CLAUDE.md\n\n${body.trimEnd()}\n`;
}

async function main() {
  const [agentsRaw, claudeRaw, opencodeRaw] = await Promise.all([
    readFile(AGENTS_PATH, 'utf8'),
    readFile(CLAUDE_PATH, 'utf8'),
    readFile(OPENCODE_PATH, 'utf8'),
  ]);

  const agentsBody = normalizeAgentFile(agentsRaw);
  const claudeBody = normalizeAgentFile(claudeRaw);
  const issues = [];

  if (agentsBody !== claudeBody) {
    issues.push('AGENTS.md and CLAUDE.md differ');
    if (WRITE) {
      await writeFile(CLAUDE_PATH, toClaudeFile(agentsBody), 'utf8');
    }
  }

  let opencodeConfig;
  try {
    opencodeConfig = JSON.parse(opencodeRaw);
  } catch {
    throw new Error('opencode.json is invalid JSON');
  }

  const instructions = Array.isArray(opencodeConfig.instructions) ? opencodeConfig.instructions : [];
  if (!instructions.includes('AGENTS.md')) {
    issues.push('opencode.json should point to AGENTS.md');
    if (WRITE) {
      opencodeConfig.instructions = ['AGENTS.md'];
      await writeFile(OPENCODE_PATH, `${JSON.stringify(opencodeConfig, null, 2)}\n`, 'utf8');
    }
  }

  if (issues.length > 0) {
    if (WRITE) {
      return;
    }

    console.error(issues.join('\n'));
    console.error('Run `pnpm agent:sync` to fix.');
    process.exitCode = 1;
    return;
  }

  console.log('Agent context synced.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
