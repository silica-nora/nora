#!/usr/bin/env node

/**
 * News Fetcher v2.0 - 获取高质量新闻资讯
 * 优化：多源聚合 + 分类覆盖 + 热度排序
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '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';

// 搜索配置 - 多关键词聚合
const CONFIGS = {
  // 10:00 - 国际局势 + 黄金
  morning: {
    world: {
      // 多源搜索，打破信息茧房
      keywords: [
        // 中文源
        '国际局势 最新消息 2026',
        // 英文源 - 不同视角
        'Middle East Iran news 2026',
        'Russia Ukraine war news 2026',
        'US China relations news 2026'
      ],
      maxResults: 2,
      translate: true
    },
    gold: {
      // 官方数据源
      keywords: [
        '上海黄金交易所 Au9999 今日价格',
        '伦敦金 XAU 实时行情 新浪财经',
        '黄金价格 今日报价 2026'
      ],
      maxResults: 2,
      translate: false
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
  
  return unique.slice(0, maxResults * 2);
}

/**
 * 格式化新闻项
 */
function formatItem(item, index) {
  const title = item.title || '无标题';
  let content = item.content || '';
  
  // 截取核心内容作为摘要
  if (content.length > 120) {
    content = content.substring(0, 120) + '...';
  }
  
  return {
    index: index + 1,
    title,
    content,
    url: item.url || '',
    score: item.score || 0
  };
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
  if (url.includes('sina.com.cn')) return '新浪';
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
  
  // 遍历所有类型
  for (const [type, cfg] of Object.entries(config)) {
    
    // AI 科技：按分类处理
    if (type === 'ai' && cfg.categories) {
      results[type] = {};
      
      for (const [category, keywords] of Object.entries(cfg.categories)) {
        const items = await multiSearch(keywords, cfg.maxResults);
        results[type][category] = items.slice(0, cfg.maxResults).map((r, i) => formatItem(r, i));
      }
      continue;
    }
    
    // 其他类型：直接多关键词搜索
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
      msg += `${item.index}. ${langTag}${item.title}\n`;
      // 摘要（翻译为中文或直接使用）
      msg += `   📝 ${item.content || '暂无摘要'}\n`;
      // 来源
      const source = getSourceName(item.url);
      msg += `   📰 来源: ${source}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // 黄金
  if (news.gold) {
    msg += '【📊 黄金/大宗】\n';
    news.gold.forEach(item => {
      msg += `${item.index}. ${item.title}\n`;
      msg += `   📝 ${item.content || '暂无摘要'}\n`;
      const source = getSourceName(item.url);
      msg += `   📰 来源: ${source}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // A股
  if (news.stock) {
    msg += '【📈 A股市场】\n';
    news.stock.forEach(item => {
      msg += `${item.index}. ${item.title}\n`;
      msg += `   ${item.content}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // AI（多分类）
  if (news.ai) {
    msg += '【🤖 AI科技】\n';
    
    for (const [category, items] of Object.entries(news.ai)) {
      msg += `\n📌 ${category}：\n`;
      items.forEach(item => {
        msg += `  ${item.index}. ${item.title}\n`;
        msg += `     ${item.content}\n`;
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
