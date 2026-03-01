#!/usr/bin/env node

/**
 * News Fetcher - 获取高质量新闻资讯 v1.0
 * 定时任务专用版本
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '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';

// 搜索配置
const CONFIGS = {
  // 10:00 - 国际局势 + 黄金
  morning: {
    world: {
      keywords: ['latest news Middle East Iran 2026', 'latest news Russia Ukraine 2026'],
      maxResults: 2,
      translate: true
    },
    gold: {
      keywords: ['黄金价格 走势 2026年2月', '伦敦金 最新价格'],
      maxResults: 2,
      translate: false
    }
  },
  // 15:10 - A股
  afternoon: {
    stock: {
      keywords: ['A股 今日收盘 大盘 2026年2月', '上证指数 最新'],
      maxResults: 3,
      translate: false
    }
  },
  // 22:00 - AI科技
  night: {
    ai: {
      keywords: ['AI 人工智能 最新 2026', '大模型 DeepSeek ChatGPT 最新'],
      maxResults: 3,
      translate: false
    }
  }
};

async function searchTavily(query, maxResults = 3) {
  const url = 'https://api.tavily.com/search';
  
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
}

/**
 * 翻译摘要（简单实现）
 */
function translateSummary(content, toLang = 'zh') {
  // 简单处理：直接返回内容
  // TODO: 可以接入翻译API
  return content;
}

/**
 * 格式化单条新闻
 */
function formatItem(item, needTranslate = false) {
  const title = item.title || '无标题';
  let content = item.content || '';
  if (content.length > 150) {
    content = content.substring(0, 150) + '...';
  }
  if (needTranslate && content) {
    // 英文内容简单标注，实际可用翻译API
    content = '[英文] ' + content;
  }
  
  return {
    title,
    content,
    url: item.url || ''
  };
}

/**
 * 获取指定时段的新闻
 */
async function fetchNews(timeSlot) {
  const config = CONFIGS[timeSlot];
  if (!config) {
    console.error(`未知时段: ${timeSlot}`);
    return null;
  }
  
  const results = {};
  
  for (const [type, cfg] of Object.entries(config)) {
    const allResults = [];
    for (const keyword of cfg.keywords) {
      const items = await searchTavily(keyword, cfg.maxResults);
      allResults.push(...items);
    }
    
    // 去重
    const unique = [...new Map(allResults.map(r => [r.url, r])).values()];
    results[type] = unique.slice(0, cfg.maxResults).map(r => formatItem(r, cfg.translate));
  }
  
  return results;
}

/**
 * 格式化输出（用于飞书消息）
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
    news.world.forEach((item, i) => {
      msg += `${i + 1}. ${item.title}\n`;
      if (item.content) msg += `   ${item.content}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // 黄金
  if (news.gold) {
    msg += '【📊 黄金/大宗】\n';
    news.gold.forEach((item, i) => {
      msg += `${i + 1}. ${item.title}\n`;
      if (item.content) msg += `   ${item.content}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // A股
  if (news.stock) {
    msg += '【📈 A股市场】\n';
    news.stock.forEach((item, i) => {
      msg += `${i + 1}. ${item.title}\n`;
      if (item.content) msg += `   ${item.content}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
  }
  
  // AI
  if (news.ai) {
    msg += '【🤖 AI科技】\n';
    news.ai.forEach((item, i) => {
      msg += `${i + 1}. ${item.title}\n`;
      if (item.content) msg += `   ${item.content}\n`;
      msg += `   🔗 ${item.url}\n\n`;
    });
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
  
  // 输出 JSON 供其他程序调用
  console.log('\n--- JSON ---');
  console.log(JSON.stringify({ timeSlot, news }, null, 2));
}

main().catch(console.error);
