/**
 * 获取贵金属价格 - 调用 crypto-monitor 脚本获取完整数据
 */
async function fetchMetalsPrices() {
  const results = [];
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { execSync } = await import('child_process');
    const output = execSync('bash ~/.openclaw/workspace/skills/crypto-gold-monitor/crypto-monitor.sh all', {
      encoding: 'utf8',
      timeout: 15000
    });
    
    // 去掉 ANSI 颜色代码
    const text = output.replace(/\x1b\[[0-9;]*m/g, '');
    
    // 提取数据
    let goldUSD = '', goldCNY = '';
    let silverUSD = '', silverCNY = '';
    let rate = '6.87';
    
    // 用更简单的方法 - 直接搜索包含关键字的行
    const goldLine = text.split('\n').find(l => l.includes('Gold') && l.includes('$'));
    const silverLine = text.split('\n').find(l => l.includes('Silver') && l.includes('$'));
    const rateLine = text.split('\n').find(l => l.includes('Exchange') && l.includes('¥'));
    
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
      const rateMatch = rateLine.match(/¥(\d+\.\d+)/);
      if (rateMatch) rate = rateMatch[1];
    }
    
    // 黄金
    if (goldUSD && goldCNY) {
      results.push({
        title: '🥇 黄金 XAU/USD',
        content: `$${goldUSD}/oz ≈ ¥${goldCNY}/oz`,
        date: today,
        url: 'https://www.goldapi.io/',
        source: 'GoldAPI.io / Yahoo Finance'
      });
    }
    
    // 白银
    if (silverUSD && silverCNY) {
      results.push({
        title: '🥈 白银 XAG/USD',
        content: `$${silverUSD}/oz ≈ ¥${silverCNY}/oz`,
        date: today,
        url: 'https://www.goldapi.io/',
        source: 'GoldAPI.io / Yahoo Finance'
      });
    }
    
    // 汇率
    results.push({
      title: '💱 USD/CNY 汇率',
      content: `1 USD = ¥${rate}`,
      date: today,
      url: 'https://www.exchangerate-api.com/',
      source: 'Exchange Rate API'
    });
    
  } catch (e) {
    results.push({
      title: '贵金属价格',
      content: '获取失败: ' + e.message,
      date: today,
      url: 'https://www.goldapi.io/',
      source: 'API Error'
    });
  }
  
  return results;
}
