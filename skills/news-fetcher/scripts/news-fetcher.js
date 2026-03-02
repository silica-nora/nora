#!/usr/bin/env node

/**
 * News Fetcher v2.1 - 获取高质量新闻资讯
 * 优化：多源聚合 + 分类覆盖 + 热度排序 + 黄金固定数据源
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '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';

// 搜索配置 - 多关键词聚合
const CONFIGS = {
  // 10:00 - 国际局势 + 黄金
  morning: {
    world: {
      // 多源搜索，打破信息茧房
      keywords: [
        '国际局势 最新消息 2026',
        'Middle East Iran news 2026',
        'Russia Ukraine war news 2026',
        'US China relations news 2026'
      ],
      maxResults: 2,
      translate: true
    },
    gold: {
      useFixedSource: true
    }
  },
  // 15:10 - A股
  afternoon: {
    stock: {
      keywords: [
        'A股 今日收盘 大盘 2026',
        '上证指数 最新走势',
        'A股 政策 利好 2026'
      ],
      maxResults: 3,
      translate: false
    }
  },
  // 22:00 - AI科技（多分类）
  night: {
    ai: {
      categories: {
        '新产品': ['AI 产品 发布 2026', 'ChatGPT 新功能 2026', 'AI 工具 发布'],
        '行业动态': ['AI 重大突破 2026', '大模型 最新 2026', '人工智能 动态'],
        '融资并购': ['AI 融资 2026', 'AI 收购 并购', 'AI 公司 融资新闻']
      },
      maxResults: 2,
      translate: false
    }
  }
};

// 黄金/大宗 - 固定数据源直链
const GOLD_SOURCES = [
  {
    name: '上海黄金交易所 Au9999',
    url: 'https://www.sge.com.cn/h5_cpfw/xhsph_xq?pro_id=793730879941324800&parent_cplx=0&cplx=7',
    type: 'sge'
  },
  {
    name: '伦敦金 XAU',
    url: 'https://finance.sina.com.cn/forex/gold.shtml',
    type: 'london'
  },
  {
    name: '周大福金价',
    url: 'https://www.cngold.org/cn/market/zhongguo_zhoudaifu.html',
    type: 'zhoudaifu'
  }
];

async function searchTavily(query, maxResults = 3) {
  const url = 'https://api.tavily.com/search';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        max_results: maxResults,
        search_depth: 'basic'
      })
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (e) {
    console.error('Search error:', e.message);
    return [];
  }
}

/**
 * 多关键词搜索 + 合并去重
 */
async function multiSearch(keywords, maxResults) {
  const allResults = [];
  
  for (const keyword of keywords) {
    const results = await searchTavily(keyword, maxResults);
    allResults.push(...results);
  }
  
  // 按 relevance 排序
  allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // 去重（按URL）
  const unique = [...new Map(allResults.map(r => [r.url, r])).values()];
  
  // 筛选2天内的资讯
  const filtered = unique.filter(r => {
    const dateMatch = (r.content || '').match(/(\d{4}-\d{2}-\d{2})/) ||
                     (r.title || '').match(/(\d{4}-\d{2}-\d{2})/);
    let dateStr = dateMatch ? dateMatch[1] : null;
    if (!dateStr) {
      dateStr = extractDateFromUrl(r.url);
    }
    return isWithinDays(dateStr, 2);
  });
  
  return filtered.slice(0, maxResults * 2);
}

/**
 * 检查日期是否在N天内
 */
function isWithinDays(dateStr, days = 2) {
  if (!dateStr) return true;
  
  try {
    const newsDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - newsDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  } catch {
    return true;
  }
}

/**
 * 从URL提取日期
 */
function extractDateFromUrl(url) {
  if (!url) return null;
  
  let match = url.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const monthMap = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                   jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
  match = url.match(/(\d{4})[\/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\/](\d{1,2})/i);
  if (match) {
    const year = match[1];
    const month = monthMap[match[2].toLowerCase()];
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

/**
 * 格式化新闻项
 */
function formatItem(item, index) {
  const title = item.title || '无标题';
  let content = item.content || '';
  
  const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/) || 
                   title.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = dateMatch ? dateMatch[1] : '';
  
  if (content.length > 120) {
    content = content.substring(0, 120) + '...';
  }
  
  return {
    index: index + 1,
    title,
    content,
    date: dateStr,
    url: item.url || '',
    score: item.score || 0
  };
}

/**
 * 获取黄金价格 - 直接抓取固定来源
 */
async function fetchGoldPrices() {
  const results = [];
  const today = new Date().toISOString().split('T')[0];
  
  for (const source of GOLD_SOURCES) {
    try {
      const response = await fetch(source.url, { timeout: 10000 });
      const html = await response.text();
      
      let price = '查询中...';
      
      if (source.type === 'sge') {
        const match = html.match(/Au9999[\s\S]*?(\d+\.?\d*)/);
        if (match) price = match[1] + ' 元/克';
      } else if (source.type === 'zhoudaifu') {
        const match = html.match(/(\d{3,4})\s*元\/克/);
        if (match) price = match[1] + ' 元/克';
      } else if (source.type === 'london') {
        const match = html.match(/伦敦金.*?(\d{2,4}\.?\d*)\s*美元/);
        if (match) price = '$' + match[1] + '/盎司';
      }
      
      results.push({
        title: source.name,
        content: price,
        date: today,
        url: source.url,
        source: source.name
      });
    } catch (e) {
      results.push({
        title: source.name,
        content: '获取失败',
        date: today,
        url: source.url,
        source: source.name
      });
    }
  }
  
  return results;
}

/**
 * 从URL提取来源名称
 */
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
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return '未知';
  }
}

/**
 * 获取指定时段新闻
 */
async function fetchNews(timeSlot) {
  const config = CONFIGS[timeSlot];
  if (!config) {
    console.error(`未知时段: ${timeSlot}`);
    return null;
  }
  
  const results = {};
  
  for (const [type, cfg] of Object.entries(config)) {
    
    if (type === 'gold' && cfg.useFixedSource) {
      results[type] = await fetchGoldPrices();
      continue;
    }
    
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

/**
 * 格式化输出（飞书消息）
 */
function formatForFeishu(timeSlot, news) {
  const timeNames = {
    morning: '☀️ 早安资讯',
    afternoon: '🌤️ 下午好 - A股动态',
    night: '🌙 晚安 - AI科技'
  };
  
  let msg = `${timeNames[timeSlot] || timeSlot}\n`;
  msg += '─'.repeat(25) + '\n\n';
  
  // 国际局势
  if (news.world) {
    msg += '【🌍 国际局势】\n';
    news.world.forEach(item => {
      const isEnglish = item.url.includes('theguardian') || item.url.includes('bbc') || 
                        item.url.includes('cnn') || item.url.includes('reuters') ||
                        item.url.includes('atlantic');
      const langTag = isEnglish ? '🇬🇧 ' : '';
      const dateTag = item.date ? ` [${item.date}]` : '';
      msg += `${item.index}. ${langTag}${item.title}${dateTag}\n`;
      msg += `   📝 ${item.content || '暂无摘要'}\n`;
      const source = getSourceName(item.url);
      msg += `   📰 来源: ${source}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // 黄金
  if (news.gold) {
    msg += '【📊 黄金/大宗】\n';
    news.gold.forEach((item, i) => {
      const dateTag = item.date ? `[${item.date}]` : '';
      msg += `${i + 1}. ${item.title} ${dateTag}\n`;
      msg += `   📝 ${item.content || '暂无摘要'}\n`;
      msg += `   📰 来源: ${item.source || getSourceName(item.url)}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // A股
  if (news.stock) {
    msg += '【📈 A股市场】\n';
    news.stock.forEach(item => {
      const dateTag = item.date ? ` [${item.date}]` : '';
      msg += `${item.index}. ${item.title}${dateTag}\n`;
      msg += `   📝 ${item.content || '暂无摘要'}\n`;
      const source = getSourceName(item.url);
      msg += `   📰 来源: ${source}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // AI（多分类）
  if (news.ai) {
    msg += '【🤖 AI科技】\n';
    
    for (const [category, items] of Object.entries(news.ai)) {
      msg += `\n📌 ${category}：\n`;
      items.forEach(item => {
        const dateTag = item.date ? ` [${item.date}]` : '';
        msg += `  ${item.index}. ${item.title}${dateTag}\n`;
        msg += `     📝 ${item.content}\n`;
        msg += `     📰 来源: ${getSourceName(item.url)}\n`;
        msg += `     🔗 ${item.url}\n\n`;
      });
    }
  }
  
  return msg;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const timeSlot = args[0] || 'morning';
  
  console.log(`📰 获取 ${timeSlot} 时段新闻...\n`);
  
  const news = await fetchNews(timeSlot);
  if (!news) process.exit(1);
  
  const formatted = formatForFeishu(timeSlot, news);
  console.log(formatted);
}

main().catch(console.error);
