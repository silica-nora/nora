---
name: news-fetcher
description: 获取高质量新闻资讯 - 国际局势、A股、黄金、AI科技
metadata: {"clawdbot":{"emoji":"📰","requires":{"bins":["node"],"env":["TAVILY_API_KEY"]},"primaryEnv":"TAVILY_API_KEY"}}
---

# News Fetcher

获取高质量新闻资讯，定时推送给 tk

## 数据源

| 领域 | 语言 | 来源 |
|------|------|------|
| 国际局势 | 🇬🇧 英文 | BBC, Reuters, ISW |
| A股/金融 | 🇨🇳 中文 | 新浪财经, 知乎, 同花顺 |
| 黄金/大宗 | 🇨🇳 中文 | 新浪财经, 金投网 |
| AI科技 | 🇨🇳 中文 | 36kr, 知乎, IBM |

## 使用方法

```bash
# 获取早上资讯（国际 + 黄金）
node scripts/news-fetcher.js morning

# 获取下午资讯（A股）
node scripts/news-fetcher.js afternoon

# 获取晚间资讯（AI）
node scripts/news-fetcher.js night
```

## 定时任务

| 时间 | 内容 |
|------|------|
| 10:00 | 国际局势 + 黄金 |
| 15:10 | A股市场 |
| 22:00 | AI科技 |

## 输出格式

每条新闻包含：
- 标题
- 摘要（150字左右）
- 原文链接

英文内容会标注 `[英文]`，需要翻译
