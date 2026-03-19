---
name: news-fetcher
description: 获取高质量新闻资讯 v2.0 - 多源聚合、分类覆盖、热度排序
metadata: {"clawdbot":{"emoji":"📰","requires":{"bins":["node"],"env":["TAVILY_API_KEY"]},"primaryEnv":"TAVILY_API_KEY"}}
---

# News Fetcher v2.0

获取高质量新闻资讯，定时推送给 tk

## 数据源

| 领域 | 语言 | 来源 |
|------|------|------|
| 国际局势 | 🇬🇧 英文 | CNN, BBC, ISW, CNBC |
| A股/金融 | 🇨🇳 中文 | 新浪财经, 知乎, 同花顺 |
| 黄金/大宗 | 🇨🇳 中文 | 新浪财经, 金投网 |
| AI科技 | 🇨🇳 中文 | 36kr, 知乎, 新浪科技 |

## 技术特点

- **多关键词聚合**：每个领域搜3个关键词，合并去重
- **热度排序**：按 relevance 分数筛选
- **分类覆盖**：AI 分成 新产品 / 行业动态 / 融资并购

## 使用方法

```bash
# 获取早上资讯（国际 + 黄金）
node scripts/news-fetcher.js morning

# 获取下午资讯（A股）
node scripts/news-fetcher.js afternoon

# 获取晚间资讯（AI - 分类）
node scripts/news-fetcher.js night
```

## 定时任务

| 时间 | 内容 |
|------|------|
| 10:00 | 国际局势 + 黄金（各4条） |
| 15:10 | A股市场（3条） |
| 22:00 | AI科技（3分类×2条） |

## 输出格式

每条新闻包含：
- 标题
- 摘要（2-3句中文：核心事实 + 影响判断）
- 原文链接

强制流程：先读原文再写摘要，禁止只转发标题。
英文内容会标注 🇬🇧
