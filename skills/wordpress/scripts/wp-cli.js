#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// 限流配置
const RATE_LIMIT_MINUTES = 30;
const DAILY_POST_LIMIT = 3;
const DAILY_EDIT_LIMIT = 5;
const EDIT_DAYS_LIMIT = 7; // 发布超过7天的文章不可修改
const SPECIAL_POST_ID = 2595; // 我的自我介绍文章，无限修改权限，禁止删除

// 状态文件路径
const STATE_FILE = path.join(__dirname, '..', 'wordpress-rate-limit.json');

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { lastPostTime: null, dailyCount: 0, lastPostDate: null };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function checkRateLimit() {
  const now = new Date();
  const state = loadState();
  const today = now.toISOString().split('T')[0];

  // 检查每日限制
  if (state.lastPostDate !== today) {
    // 新的一天，重置计数
    state.dailyCount = 0;
    state.lastPostDate = today;
  }

  if (state.dailyCount >= DAILY_POST_LIMIT) {
    const nextReset = new Date(now);
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);
    const hours = Math.ceil((nextReset - now) / (1000 * 60 * 60));
    console.error(`❌ 每日限制已达上限（${DAILY_POST_LIMIT}篇/天）！明天再来吧～`);
    process.exit(1);
  }

  // 检查时间间隔
  if (state.lastPostTime) {
    const lastTime = new Date(state.lastPostTime);
    const diffMs = now - lastTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < RATE_LIMIT_MINUTES) {
      const waitMinutes = RATE_LIMIT_MINUTES - diffMinutes;
      console.error(`⏳ 发射太频繁啦！请等待 ${waitMinutes} 分钟后再试～`);
      process.exit(1);
    }
  }

  return state;
}

function recordPost() {
  const state = loadState();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (state.lastPostDate !== today) {
    state.dailyCount = 0;
  }

  state.lastPostTime = now.toISOString();
  state.lastPostDate = today;
  state.dailyCount += 1;

  saveState(state);
  console.log(`✅ 已记录：今天已发布 ${state.dailyCount}/${DAILY_POST_LIMIT} 篇`);
}

function checkEditLimit(postId) {
  // 特殊文章不受每日修改次数限制
  if (String(postId) === String(SPECIAL_POST_ID)) {
    return null;
  }

  const now = new Date();
  const state = loadState();
  const today = now.toISOString().split('T')[0];

  // 检查每日修改次数限制
  if (state.lastEditDate !== today) {
    state.editCount = 0;
    state.lastEditDate = today;
  }

  if (state.editCount >= DAILY_EDIT_LIMIT) {
    console.error(`❌ 每日修改次数已达上限（${DAILY_EDIT_LIMIT}次/天）！明天再来吧～`);
    process.exit(1);
  }

  return state;
}

function recordEdit() {
  const state = loadState();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (state.lastEditDate !== today) {
    state.editCount = 0;
  }

  state.lastEditTime = now.toISOString();
  state.lastEditDate = today;
  state.editCount = (state.editCount || 0) + 1;

  saveState(state);
  console.log(`✅ 已记录：今天已修改 ${state.editCount}/${DAILY_EDIT_LIMIT} 次`);
}

async function checkPostAgeLimit(postId) {
  // 特殊文章不受日期限制
  if (String(postId) === String(SPECIAL_POST_ID)) {
    return;
  }

  const post = await requestJson({ method: 'GET', path: `/posts/${postId}` });
  const postDate = new Date(post.date);
  const now = new Date();
  const diffDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));

  if (diffDays > EDIT_DAYS_LIMIT) {
    console.error(`❌ 这篇文章发布于 ${diffDays} 天前，已超过 ${EDIT_DAYS_LIMIT} 天，不可再修改！`);
    process.exit(1);
  }
}

function checkDeleteLimit(postId) {
  // 禁止删除所有文章（包括特殊文章）
  console.error(`❌ 禁止删除文章！保护机制已启用。`);
  process.exit(1);
}

// ============ 原有 wp-cli.js 代码 ============

const { Buffer } = require('buffer');

function parseArgs(argv) {
  const args = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args.push(token);
      continue;
    }

    const stripped = token.slice(2);
    const eqIndex = stripped.indexOf('=');
    if (eqIndex >= 0) {
      const key = stripped.slice(0, eqIndex);
      const value = stripped.slice(eqIndex + 1);
      flags[key] = value === '' ? true : value;
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags[stripped] = next;
      i += 1;
    } else {
      flags[stripped] = true;
    }
  }

  return { args, flags };
}

function toQueryList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

function buildAuthHeader() {
  const basicToken = process.env.WP_BASIC_TOKEN;
  if (basicToken) {
    return { Authorization: `Basic ${basicToken}` };
  }

  const user = process.env.WP_USER;
  const appPassword = process.env.WP_APP_PASSWORD;
  if (user && appPassword) {
    const token = Buffer.from(`${user}:${appPassword}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  const jwt = process.env.WP_JWT_TOKEN;
  if (jwt) {
    return { Authorization: `Bearer ${jwt}` };
  }

  return {};
}

function resolveBaseUrl() {
  const base = process.env.WP_BASE_URL;
  if (!base) {
    console.error('Missing WP_BASE_URL. Example: https://example.com');
    process.exit(1);
  }
  return base.replace(/\/$/, '');
}

function buildApiUrl(path, query) {
  const base = resolveBaseUrl();
  const apiRoot = `${base}/wp-json/wp/v2`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(apiRoot + normalized);

  if (query && query.length) {
    query.forEach((pair) => {
      const [key, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (key) url.searchParams.append(key, value);
    });
  }

  return url;
}

async function requestJson({ method, path, query, body }) {
  const headers = {
    'Accept': 'application/json',
    ...buildAuthHeader(),
  };

  const options = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(buildApiUrl(path, query), options);
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const error = payload || { status: response.status, statusText: response.statusText };
    throw new Error(JSON.stringify(error));
  }

  return payload;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function jsonFromArg(value, label) {
  if (!value) throw new Error(`Missing JSON input for ${label}.`);
  if (value.startsWith('@')) {
    const fs = require('fs');
    const filePath = value.slice(1);
    if (!fs.existsSync(filePath)) throw new Error(`JSON file not found: ${filePath}`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return JSON.parse(value);
}

const HELP_TEXT = `
WordPress REST API CLI (OpenClaw skill) - 带限流版本

Usage:
  node scripts/wp-cli.js <command> [args] [--flags]

⚠️ 限流规则：
  - 每次发布后需等待 ${RATE_LIMIT_MINUTES} 分钟
  - 每天最多发布 ${DAILY_POST_LIMIT} 篇
  - 每天最多修改 ${DAILY_EDIT_LIMIT} 次
  - 发布超过 ${EDIT_DAYS_LIMIT} 天的文章不可修改

Posts:
  posts:list [--query key=value]
  posts:get <id>
  posts:create <jsonOr@file>
  posts:update <id> <jsonOr@file>
  posts:delete <id> [--query force=true]

Pages:
  pages:list [--query key=value]
  pages:get <id>
  pages:create <jsonOr@file>
  pages:update <id> <jsonOr@file>
  pages:delete <id> [--query force=true]

Taxonomy:
  categories:list [--query key=value]
  categories:create <jsonOr@file>
  tags:list [--query key=value]
  tags:create <jsonOr@file>

Users:
  users:list [--query key=value]
  users:get <id>

Advanced:
  request <method> <path> [jsonOr@file] [--query key=value]
`;

async function main() {
  const { args, flags } = parseArgs(process.argv.slice(2));
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(HELP_TEXT.trim());
    return;
  }

  try {
    let result;
    const queryList = [];

    if (flags.query) {
      const entries = Array.isArray(flags.query) ? flags.query : [flags.query];
      entries.forEach((entry) => {
        toQueryList(entry).forEach((item) => queryList.push(item));
      });
    }

    // 对创建操作进行限流检查
    const isCreateCommand = ['posts:create', 'pages:create', 'categories:create', 'tags:create'].includes(command);
    const isDeleteCommand = command.endsWith(':delete');

    if (isCreateCommand) {
      checkRateLimit();
    }

    switch (command) {
      case 'posts:list': {
        result = await requestJson({ method: 'GET', path: '/posts', query: queryList });
        break;
      }
      case 'posts:get': {
        const id = args[1];
        if (!id) throw new Error('Usage: posts:get <id>');
        result = await requestJson({ method: 'GET', path: `/posts/${id}`, query: queryList });
        break;
      }
      case 'posts:create': {
        const body = jsonFromArg(args[1], 'post');
        result = await requestJson({ method: 'POST', path: '/posts', query: queryList, body });
        recordPost();
        break;
      }
      case 'posts:update': {
        const id = args[1];
        if (!id) throw new Error('Usage: posts:update <id> <jsonOr@file>');
        const isSpecialPost = String(id) === String(SPECIAL_POST_ID);
        if (!isSpecialPost) {
          checkEditLimit(id);
          await checkPostAgeLimit(id);
        }
        const body = jsonFromArg(args[2], 'post');
        result = await requestJson({ method: 'POST', path: `/posts/${id}`, query: queryList, body });
        if (isSpecialPost) {
          console.log(`✅ 已修改特殊文章（无限权限）`);
        } else {
          recordEdit();
        }
        break;
      }
      case 'posts:delete': {
        const id = args[1];
        if (!id) throw new Error('Usage: posts:delete <id>');
        checkDeleteLimit(id);
        result = await requestJson({ method: 'DELETE', path: `/posts/${id}`, query: queryList });
        break;
      }
      case 'pages:list': {
        result = await requestJson({ method: 'GET', path: '/pages', query: queryList });
        break;
      }
      case 'pages:get': {
        const id = args[1];
        if (!id) throw new Error('Usage: pages:get <id>');
        result = await requestJson({ method: 'GET', path: `/pages/${id}`, query: queryList });
        break;
      }
      case 'pages:create': {
        const body = jsonFromArg(args[1], 'page');
        result = await requestJson({ method: 'POST', path: '/pages', query: queryList, body });
        recordPost();
        break;
      }
      case 'pages:update': {
        const id = args[1];
        if (!id) throw new Error('Usage: pages:update <id> <jsonOr@file>');
        checkEditLimit();
        await checkPostAgeLimit(id);
        const body = jsonFromArg(args[2], 'page');
        result = await requestJson({ method: 'POST', path: `/pages/${id}`, query: queryList, body });
        recordEdit();
        break;
      }
      case 'pages:delete': {
        const id = args[1];
        if (!id) throw new Error('Usage: pages:delete <id>');
        result = await requestJson({ method: 'DELETE', path: `/pages/${id}`, query: queryList });
        break;
      }
      case 'categories:list': {
        result = await requestJson({ method: 'GET', path: '/categories', query: queryList });
        break;
      }
      case 'categories:create': {
        const body = jsonFromArg(args[1], 'category');
        result = await requestJson({ method: 'POST', path: '/categories', query: queryList, body });
        break;
      }
      case 'tags:list': {
        result = await requestJson({ method: 'GET', path: '/tags', query: queryList });
        break;
      }
      case 'tags:create': {
        const body = jsonFromArg(args[1], 'tag');
        result = await requestJson({ method: 'POST', path: '/tags', query: queryList, body });
        break;
      }
      case 'users:list': {
        result = await requestJson({ method: 'GET', path: '/users', query: queryList });
        break;
      }
      case 'users:get': {
        const id = args[1];
        if (!id) throw new Error('Usage: users:get <id>');
        result = await requestJson({ method: 'GET', path: `/users/${id}`, query: queryList });
        break;
      }
      case 'request': {
        const method = args[1];
        const path = args[2];
        if (!method || !path) throw new Error('Usage: request <method> <path> [jsonOr@file]');
        const body = args[3] ? jsonFromArg(args[3], 'body') : undefined;
        result = await requestJson({ method: method.toUpperCase(), path, query: queryList, body });
        break;
      }
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
