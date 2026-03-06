# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## 飞书消息规则

### 回复渠道
- 用户从哪个渠道发消息，就回复到哪个渠道
- 飞书发的消息 → 必须用 message 工具回复到飞书
- 网页聊天发的消息 → 直接在当前会话回复

### 记忆检索规则（tk 新要求）
- 任何涉及“记忆/历史/偏好/人物/事件/是否聊过/待办”的问题，必须**同时查询两套系统**：
  1) `memory_search` / `memory_get`（MEMORY.md + memory/*.md）
  2) `memory/ontology/graph.jsonl`（对象实体数据库）
- 禁止只查单一路径后下结论
- 若两边结果冲突：明确标注冲突并给出证据行号

### 推送文案规则（tk 新要求）
- 自动推送结尾禁止出现类似“已按心跳规则完成XXX”这类系统化说明
- 只保留对用户有价值的内容正文，不附加流程性尾注

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

## 归档规则

**归档 = memory整理 + ontology更新 + Git提交**

### 流程
1. 整理 memory/ 下的记忆文件
2. 更新 ontology/ 知识图谱（新实体、新关系）
3. git add + git commit + git push
4. **给用户反馈归档改动总结**

### 归档反馈模板
```
归档完成 ✅

本次改动：
- 新增：xxx
- 修改：xxx
- 删除：xxx

共 N 个文件变更
```

### 归档回执（tk 强制要求）
- 每次归档后，必须立即发送归档回执到当前会话
- 回执至少包含：新增/修改/删除、文件数、commit id、push 状态
- 禁止只归档不回执

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
