# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## 飞书消息规则

### 回复渠道
- 用户从哪个渠道发消息，就回复到哪个渠道
- 飞书发的消息 → 必须用 message 工具回复到飞书
- 网页聊天发的消息 → 直接在当前会话回复

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
