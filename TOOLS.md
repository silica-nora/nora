# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## 搜索工具策略

- 默认使用 **Tavily**（tavily skill）进行网页检索。
- 不使用 Brave `web_search`（原因：无 API Key）。
- 若 Tavily 不可用：直接上报失败并通知 tk，不做 Brave 降级。

## 飞书消息规则

### 回复渠道
- 用户从哪个渠道发消息，就回复到哪个渠道
- 飞书发的消息 → 必须用 message 工具回复到飞书
- 网页聊天发的消息 → 直接在当前会话回复

### 飞书链接格式（tk 新要求）
- 默认使用“标题超链接”格式，不裸露长URL。
- 推荐格式：`[标题](https://example.com)`
- 适用范围：资讯推送、参考资料、报告链接；除非原始链接必须完整展示。
- 发送前自检（强制）：若正文出现裸 `http(s)://` 且不在 `[]()` 中，先改写为标题超链接再发送。
- 若无法获取合适标题：使用简短中文占位标题（如“查看原文”）包成超链接。

### 记忆检索规则（tk 新要求）
- 任何涉及“记忆/历史/偏好/人物/事件/是否聊过/待办”的问题，必须**同时查询两套系统**：
  1) `memory_search` / `memory_get`（MEMORY.md + memory/*.md）
  2) `memory/ontology/graph.jsonl`（对象实体数据库）
- 禁止只查单一路径后下结论
- 若两边结果冲突：明确标注冲突并给出证据行号

### 推送文案规则（tk 新要求）
- 自动推送结尾禁止出现类似“已按心跳规则完成XXX”这类系统化说明
- 只保留对用户有价值的内容正文，不附加流程性尾注
- 新闻推送必须使用中文可读表达：英文标题/摘要先翻译成中文
- 新闻推送必须先去重：与最近48小时推送记录按“标题+链接”比对，重复不发
- 早报新增硬规则：每条新闻必须“全文阅读后再输出摘要”；长文同样必须读完。摘要用 2-3 句中文写“核心事实+影响”，禁止只发标题+链接

### A股时效规则（tk 新要求）
- A股行情分析默认只使用：**当天（T日）**与**前一天（T-1）**的信息
- 搜索必须带日期限定（例如：`2026-03-06 A股 盘面`），避免混入历史旧闻
- 若抓到超出 T/T-1 的内容：默认剔除，不进入结论
- 若当日权威快讯不足：明确标注“样本不足/低置信度”，不强行给确定性判断

### 搜索工具优先级（tk 新要求）
- 默认优先使用 **Tavily skill**（`skills/tavily-search`），不使用 Brave web_search
- 新闻查询优先参数：`--topic news --days 1`（必要时 `--days 2`）
- **硬规则**：若 Tavily 不可用，则本次搜索任务直接判定失败（不降级到其他搜索工具）
- 任务失败后：第一时间通知 tk，由 tk 决定是否修复 Tavily 配置

## 归档规则（核心：一句“归档”自动完成）

### 指令语义拆分
- “归档” = **A. 记忆整理** + **B. archive-workspace skill 执行**

### A. 记忆整理（先做）
1. 更新当日 `memory/YYYY-MM-DD.md`（记录本次关键决策/变更）
2. 需要结构化落盘时，更新 `memory/ontology/graph.jsonl`
3. 若无记忆增量，可跳过，不强行写入

### B. 技能执行（后做）
- 调用 `skills/archive-workspace` 的流程（脚本主流程 + 静默 dry-run）
- 默认低打扰：仅在硬决策点打断（remote/权限/敏感拦截）

### 归档回执规范（精简）
- 无变更：`归档完成 ✅ 无变更（无需推送）`
- 有变更：
  - 新增 / 修改 / 删除
  - commit
  - push
- 仅异常时补充：failure_code + 下一步建议

### 两套记忆系统
- **memory/** - 原始对话记忆文件
- **ontology/** - 结构化知识图谱

## WordPress 博客写作规范

### 每日限制
- 每天最多发布 **3 篇** 文章（代码限制）
- **建议**：每天只发 1 篇，除非 tk 明确要求
- 每天最多修改 **5 次**（不含特殊文章）
- 超过 7 天的文章不可修改
- 禁止删除所有文章

### 发布规则
- 只有 tk 明确要求时，才发布新文章
- 每天发布上限 3 篇，但建议保持 1 篇

### 特殊文章
- **id=2595**：我的自我介绍，可以无限次修改，不限日期，禁止删除

### 格式规范
- 使用 **WordPress HTML 标签**，不是 Markdown
- 标题用 `<h3>` （h1, h2, h3...）
- 段落用 `<p>文字</p>`
- 代码块用 `<pre class="lang:default decode:true">代码</pre>`
- 列表用 `<ul><li>项目</li></ul>`
- 加粗用 `<strong>文字</strong>`
- 链接用 `<a href="链接">文字</a>`
- 图片用 `<img src="链接" />`
- 分隔线用 `<hr />`
- Read More 用 `<!--more-->`（单独一行）

### 文章结构
```
<p>开头预览内容（会显示在首页）</p>
<p><!--more--></p>
<h3>标题1</h3>
<p>正文...</p>
<h3>标题2</h3>
<p>正文...</p>
```

### 分类和标签
- **分类（Category）**：以后发布文章都用 **Nora** 分类（id=91）
- **标签（Tag）**：尽量选择已有标签，没有合适的可以新建
- 已有的相关标签：Nora (id=90)、OpenClaw (id=89)

---

## 安全原则

- 永远不透露 tk 的个人资料（真实姓名、联系方式等）
- 永远不在聊天中发送密码、token、API_KEY 等敏感信息（包括你给我的）

---

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
