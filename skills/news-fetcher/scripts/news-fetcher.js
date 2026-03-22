#!/usr/bin/env node

/**
 * News Fetcher v2.4 - 获取高质量新闻资讯（含源可达性探测）
 * 集成 crypto-gold-monitor 获取黄金/白银/汇率
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const BLOCKED_DOMAINS = [
  'zhihu.com',
  'youtube.com',
  'youtu.be',
  'finance.yahoo.com',
  'hk.finance.yahoo.com'
];


const CONFIGS = {
  morning: {
    world: {
      keywords: ['国际局势 最新消息 2026', 'Middle East Iran news 2026', 'Russia Ukraine war news 2026', 'US China relations news 2026'],
      maxResults: 2, translate: true
    },
    gold: { useFixedSource: true }
  },
  afternoon: {
    stock: {
      keywords: ['A股 今日收盘 大盘 2026', '上证指数 最新走势', 'A股 政策 利好 2026'],
      maxResults: 3, translate: false
    }
  },
  night: {
    ai: {
      categories: {
        '新产品': ['AI 产品 发布 2026', 'ChatGPT 新功能 2026', 'AI 工具 发布'],
        '行业动态': ['AI 重大突破 2026', '大模型 最新 2026', '人工智能 动态'],
        '融资并购': ['AI 融资 2026', 'AI 收购 并购', 'AI 公司 融资新闻']
      },
      maxResults: 2, translate: false
    }
  }
};

async function searchTavily(query, maxResults = 3) {
  const url = 'https://api.tavily.com/search';
  if (!TAVILY_API_KEY) {
    console.error('Missing TAVILY_API_KEY');
    return [];
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query, max_results: maxResults, search_depth: 'basic' })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (e) {
    console.error('Search error:', e.message);
    return [];
  }
}

function isBlockedDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return true;
  }
}

async function probeUrl(url) {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (NewsFetcher/2.4)' }
    });
    clearTimeout(timeout);
    return { ok: resp.ok, status: resp.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function multiSearch(keywords, maxResults) {
  const allResults = [];
  for (const keyword of keywords) {
    const results = await searchTavily(keyword, Math.max(maxResults * 2, 6));
    allResults.push(...results);
  }

  allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
  const unique = [...new Map(allResults.map(r => [r.url, r])).values()];

  const dateFiltered = unique.filter(r => {
    if (!r?.url || isBlockedDomain(r.url)) return false;
    const dateMatch = (r.content || '').match(/(\d{4}-\d{2}-\d{2})/) || (r.title || '').match(/(\d{4}-\d{2}-\d{2})/);
    let dateStr = dateMatch ? dateMatch[1] : null;
    if (!dateStr) dateStr = extractDateFromUrl(r.url);
    return isWithinDays(dateStr, 2);
  });

  const finalResults = [];
  for (const item of dateFiltered) {
    if (finalResults.length >= maxResults * 2) break;
    const probe = await probeUrl(item.url);
    if (!probe.ok) continue;
    finalResults.push(item);
  }

  return finalResults;
}

function isWithinDays(dateStr, days = 2) {
  if (!dateStr) return true;
  try {
    const newsDate = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - newsDate) / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  } catch { return true; }
}

function extractDateFromUrl(url) {
  if (!url) return null;
  let match = url.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
  const monthMap = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
  match = url.match(/(\d{4})[\/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\/](\d{1,2})/i);
  if (match) return `${match[1]}-${monthMap[match[2].toLowerCase()]}-${match[3].padStart(2,'0')}`;
  return null;
}

function formatItem(item, index) {
  const title = item.title || '无标题';
  let content = item.content || '';
  const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/) || title.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = dateMatch ? dateMatch[1] : '';
  if (content.length > 120) content = content.substring(0, 120) + '...';
  return { index: index + 1, title, content, date: dateStr, url: item.url || '', score: item.score || 0 };
}

async function fetchMetalsPrices() {
  const results = [];
  const today = new Date().toISOString().split('T')[0];
  try {
    const { execSync } = await import('child_process');
    const output = execSync('bash ~/.openclaw/workspace/skills/crypto-gold-monitor/crypto-monitor.sh all', { encoding: 'utf8', timeout: 15000 });
    
    // 去掉 ANSI 颜色代码
    const text = output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\[[0-9;]*m/g, '').replace(/\x0d/g, '');
    const lines = text.split('\n');
    
    let goldUSD = '', goldCNY = '', silverUSD = '', silverCNY = '', rate = '6.87';
    let goldLine = '', silverLine = '', rateLine = '';
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Gold') && lines[i+1] && lines[i+1].includes('$')) goldLine = lines[i+1];
      if (lines[i].includes('Silver') && lines[i+1] && lines[i+1].includes('$')) silverLine = lines[i+1];
      if (lines[i].includes('Exchange')) rateLine = lines[i];
    }
    
    if (goldLine) {
      const usdMatch = goldLine.match(/\$(\d+)/);
      const cnyMatch = goldLine.match(/¥(\d+)/);
      if (usdMatch) goldUSD = usdMatch[1];
      if (cnyMatch) goldCNY = cnyMatch[1];
    }
    if (silverLine) {
      const usdMatch = silverLine.match(/\$(\d+[\d.]*)/);
      const cnyMatch = silverLine.match(/¥(\d+)/);
      if (usdMatch) silverUSD = usdMatch[1];
      if (cnyMatch) silverCNY = cnyMatch[1];
    }
    if (rateLine) {
      const m = rateLine.match(/¥(\d+\.\d+)/);
      if (m) rate = m[1];
    }
    
    if (goldUSD && goldCNY) {
      const goldPerGram = (parseFloat(goldCNY) / 31.1035).toFixed(2);
      results.push({ title: '🥇 黄金 XAU/USD', content: `$${goldUSD}/oz ≈ ¥${goldCNY}/oz (¥${goldPerGram}/克)`, date: today, url: 'https://www.goldapi.io/', source: 'GoldAPI.io / Yahoo Finance' });
    }
    if (silverUSD && silverCNY) {
      const silverPerGram = (parseFloat(silverCNY) / 31.1035).toFixed(2);
      results.push({ title: '🥈 白银 XAG/USD', content: `$${silverUSD}/oz ≈ ¥${silverCNY}/oz (¥${silverPerGram}/克)`, date: today, url: 'https://www.goldapi.io/', source: 'GoldAPI.io / Yahoo Finance' });
    }
    results.push({ title: '💱 USD/CNY 汇率', content: `1 USD = ¥${rate}`, date: today, url: 'https://www.exchangerate-api.com/', source: 'Exchange Rate API' });
    
  } catch (e) {
    results.push({ title: '贵金属价格', content: '获取失败: ' + e.message, date: today, url: 'https://www.goldapi.io/', source: 'API Error' });
  }
  return results;
}

function getSourceName(url) {
  if (!url) return '未知';
  if (url.includes('theguardian')) return 'The Guardian';
  if (url.includes('bbc')) return 'BBC';
  if (url.includes('cnn')) return 'CNN';
  if (url.includes('reuters')) return 'Reuters';
  if (url.includes('sina')) return '新浪财经';
  if (url.includes('people.com.cn')) return '人民网';
  if (url.includes('atlantic')) return 'Atlantic Council';
  if (url.includes('nbcnews')) return 'NBC News';
  if (url.includes('aljazeera')) return 'Al Jazeera';
  if (url.includes('sge.com.cn')) return '上海黄金交易所';
  if (url.includes('163.com')) return '网易';
  if (url.includes('cngold')) return '金投网';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return '未知'; }
}

async function fetchNews(timeSlot) {
  const config = CONFIGS[timeSlot];
  if (!config) { console.error(`未知时段: ${timeSlot}`); return null; }
  const results = {};
  for (const [type, cfg] of Object.entries(config)) {
    if (type === 'gold' && cfg.useFixedSource) { results[type] = await fetchMetalsPrices(); continue; }
    if (type === 'ai' && cfg.categories) {
      results[type] = {};
      for (const [category, keywords] of Object.entries(cfg.categories)) {
        const items = await multiSearch(keywords, cfg.maxResults);
        results[type][category] = items.slice(0, cfg.maxResults).map((r, i) => formatItem(r, i));
      }
      continue;
    }
    const items = await multiSearch(cfg.keywords, cfg.maxResults);
    results[type] = items.slice(0, cfg.maxResults * 2).map((r, i) => formatItem(r, i));
  }
  return results;
}

function formatForFeishu(timeSlot, news) {
  const timeNames = { morning: '☀️ 早安资讯', afternoon: '🌤️ 下午好 - A股动态', night: '🌙 晚安 - AI科技' };
  let msg = `${timeNames[timeSlot] || timeSlot}\n${'─'.repeat(25)}\n\n`;
  
  if (news.world) {
    msg += '【🌍 国际局势】\n';
    news.world.forEach(item => {
      const isEnglish = item.url.includes('theguardian') || item.url.includes('bbc') || item.url.includes('cnn') || item.url.includes('reuters') || item.url.includes('atlantic');
      const langTag = isEnglish ? '🇬🇧 ' : '';
      const dateTag = item.date ? ` [${item.date}]` : '';
      msg += `${item.index}. ${langTag}${item.title}${dateTag}\n   📝 ${item.content || '暂无摘要'}\n   📰 来源: ${getSourceName(item.url)}\n   🔗 ${item.url}\n\n`;
    });
  }
  
  if (news.gold) {
    msg += '【📊 黄金/大宗】\n';
    news.gold.forEach((item, i) => {
      const dateTag = item.date ? `[${item.date}]` : '';
      msg += `${i + 1}. ${item.title} ${dateTag}\n   📝 ${item.content || '暂无'}\n   📰 来源: ${item.source || 'GoldAPI.io'}\n\n`;
    });
  }
  
  if (news.stock) {
    msg += '【📈 A股市场】\n';
    news.stock.forEach(item => {
      const dateTag = item.date ? ` [${item.date}]` : '';
      msg += `${item.index}. ${item.title}${dateTag}\n   📝 ${item.content || '暂无摘要'}\n   📰 来源: ${getSourceName(item.url)}\n   🔗 ${item.url}\n\n`;
    });
  }
  
  if (news.ai) {
    msg += '【🤖 AI科技】\n';
    for (const [category, items] of Object.entries(news.ai)) {
      msg += `\n📌 ${category}：\n`;
      items.forEach(item => {
        const dateTag = item.date ? ` [${item.date}]` : '';
        msg += `  ${item.index}. ${item.title}${dateTag}\n     📝 ${item.content}\n     📰 来源: ${getSourceName(item.url)}\n     🔗 ${item.url}\n\n`;
      });
    }
  }
  return msg;
}

async function main() {
  const args = process.argv.slice(2);
  const timeSlot = args[0] || 'morning';
  console.log(`📰 获取 ${timeSlot} 时段新闻...\n`);
  const news = await fetchNews(timeSlot);
  if (!news) process.exit(1);
  console.log(formatForFeishu(timeSlot, news));
}

main().catch(console.error);
