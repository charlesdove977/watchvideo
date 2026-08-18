#!/usr/bin/env node
/**
 * watchvideo CLI
 *
 * Installs the watchvideo Claude Code skill into either the user-global
 * directory (~/.claude/skills/watchvideo/) or the current project's
 * .claude/skills/watchvideo/ directory.
 *
 * Optionally also drops a command stub in ~/.claude/commands/ so the analyzer
 * is reachable as an explicit slash command.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'watchvideo';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const SKILL_SRC = path.join(PACKAGE_ROOT, 'skill');
const PKG = require(path.join(PACKAGE_ROOT, 'package.json'));

function userClaudeDir() {
  return path.join(os.homedir(), '.claude');
}

function projectClaudeDir() {
  return path.join(process.cwd(), '.claude');
}

function resolveSkillTarget(opts) {
  const base = opts.project ? projectClaudeDir() : userClaudeDir();
  return path.join(base, 'skills', SKILL_NAME);
}

function resolveCommandsDir(opts) {
  const base = opts.project ? projectClaudeDir() : userClaudeDir();
  return path.join(base, 'commands');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function commandStub() {
  return `---
name: ${SKILL_NAME}
description: Watch and analyze a video locally. Downloads with yt-dlp, extracts frames and audio with ffmpeg, transcribes with Whisper, reads the frames, researches the topic, and writes a run folder under video-analytics/.
---

This command routes to the \`${SKILL_NAME}\` skill (task \`watch\`).

If the skill is installed, the Skill tool will load it automatically. Otherwise run:

    npx watchvideo install
`;
}

function writeCommandStubs(opts) {
  const dir = resolveCommandsDir(opts);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${SKILL_NAME}.md`), commandStub());
  return { dir, count: 1 };
}

function removeCommandStubs(opts) {
  const dir = resolveCommandsDir(opts);
  const p = path.join(dir, `${SKILL_NAME}.md`);
  let removed = 0;
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    removed += 1;
  }
  return { dir, removed };
}

function install(opts) {
  const target = resolveSkillTarget(opts);
  const exists = fs.existsSync(target);

  if (exists && !opts.force) {
    console.error(
      `[watchvideo] Skill already installed at:\n  ${target}\n\n` +
        `Run with --update to overwrite, or --uninstall to remove first.`
    );
    process.exitCode = 1;
    return;
  }

  if (exists && opts.force) {
    rmrf(target);
  }

  copyDir(SKILL_SRC, target);

  console.log(`[watchvideo] Skill installed:`);
  console.log(`  ${target}`);

  if (opts.withCommands) {
    const result = writeCommandStubs(opts);
    console.log(`[watchvideo] Command stub written (${result.count}):`);
    console.log(`  ${result.dir}`);
  }

  console.log('');
  console.log(`Done! Restart Claude Code to activate /${SKILL_NAME}.`);
  console.log(`Then run /${SKILL_NAME} and paste a video URL.`);
  console.log('');
  console.log('Runtime deps (local, free): yt-dlp, ffmpeg, openai-whisper');
  console.log('  brew install yt-dlp ffmpeg');
  console.log('  pip install -U openai-whisper');
}

function uninstall(opts) {
  const target = resolveSkillTarget(opts);
  let removedSkill = false;
  if (fs.existsSync(target)) {
    rmrf(target);
    removedSkill = true;
  }

  const cmdResult = opts.withCommands ? removeCommandStubs(opts) : { removed: 0 };

  if (!removedSkill && cmdResult.removed === 0) {
    console.log(`[watchvideo] Nothing to uninstall at ${target}`);
    return;
  }

  if (removedSkill) console.log(`[watchvideo] Removed skill: ${target}`);
  if (cmdResult.removed > 0) {
    console.log(
      `[watchvideo] Removed ${cmdResult.removed} command stub(s) from ${cmdResult.dir}`
    );
  }
}

function where(opts) {
  console.log(resolveSkillTarget(opts));
}

function doctor() {
  const { execFileSync } = require('child_process');
  const checks = [
    { name: 'yt-dlp', probe: ['yt-dlp', ['--version']], fix: 'brew install yt-dlp   (or: pipx install yt-dlp)' },
    { name: 'ffmpeg', probe: ['ffmpeg', ['-version']], fix: 'brew install ffmpeg' },
    { name: 'ffprobe', probe: ['ffprobe', ['-version']], fix: 'brew install ffmpeg' },
    {
      name: 'openai-whisper',
      probe: ['python3', ['-c', 'import whisper']],
      fix: 'pip install -U openai-whisper'
    }
  ];

  console.log(`watchvideo v${PKG.version} — dependency check\n`);
  let missing = 0;
  for (const c of checks) {
    let ok = true;
    try {
      execFileSync(c.probe[0], c.probe[1], { stdio: 'ignore' });
    } catch (e) {
      ok = false;
      missing += 1;
    }
    console.log(`  ${ok ? 'OK     ' : 'MISSING'}  ${c.name}${ok ? '' : `   →  ${c.fix}`}`);
  }

  console.log('');
  if (missing === 0) {
    console.log('All good. Run /watchvideo inside Claude Code.');
  } else {
    console.log(`${missing} missing. Install the above, then re-run: npx watchvideo doctor`);
    process.exitCode = 1;
  }
}

function help() {
  console.log(`watchvideo v${PKG.version}  —  local video analyzer for Claude Code

Install the watchvideo Claude Code skill.

Usage:
  npx watchvideo <command> [flags]

Commands:
  install         Install skill to ~/.claude/skills/${SKILL_NAME}/
  update          Same as install, but overwrite if already present
  uninstall       Remove skill from the target directory
  doctor          Check that yt-dlp, ffmpeg, and whisper are available
  where           Print the target install path and exit
  --help, -h      Show this message
  --version, -v   Show version

Flags:
  --project       Install into the current project's ./.claude/ instead of ~/.claude/
  --with-commands Also write an explicit /${SKILL_NAME} slash command stub

Examples:
  npx watchvideo install
  npx watchvideo install --project
  npx watchvideo install --with-commands
  npx watchvideo doctor
  npx watchvideo update

Skill name once installed: /${SKILL_NAME}
Repo:                      https://github.com/charlesdove977/watchvideo
`);
}

function parseArgs(argv) {
  const opts = {
    project: false,
    withCommands: false,
    force: false
  };
  let cmd = null;
  for (const arg of argv) {
    if (arg === '--project') opts.project = true;
    else if (arg === '--with-commands' || arg === '--commands') opts.withCommands = true;
    else if (arg === '--update' || arg === '--force' || arg === '-f') opts.force = true;
    else if (arg === '--help' || arg === '-h') cmd = '__help';
    else if (arg === '--version' || arg === '-v') cmd = '__version';
    else if (!arg.startsWith('-') && cmd === null) cmd = arg;
  }
  return { cmd, opts };
}

function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));

  switch (cmd) {
    case 'install':
      install(opts);
      return;
    case 'update':
      opts.force = true;
      install(opts);
      return;
    case 'uninstall':
      uninstall(opts);
      return;
    case 'doctor':
      doctor();
      return;
    case 'where':
      where(opts);
      return;
    case '__version':
      console.log(PKG.version);
      return;
    case '__help':
    case null:
    default:
      help();
      return;
  }
}

main();
