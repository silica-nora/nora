# 飞书消息格式规范

> 来源：https://open.feishu.cn/document/server-docs/im-v1/message/create_json
> 来源：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/im-v1/message/create_json

## 消息类型

飞书机器人支持以下消息类型：
- `text` - 纯文本消息
- `post` - 富文本消息（JSON结构）
- `image` - 图片
- `file` - 文件
- `interactive` - 卡片消息

## 1. 纯文本消息 (text)

```json
{
  "msg_type": "text",
  "content": {
    "text": "消息内容"
  }
}
```

## 2. 富文本消息 (post)

富文本消息使用嵌套的 JSON 结构，支持多段落、多种元素。

### 基本结构

```json
{
  "msg_type": "post",
  "content": {
    "post": {
      "zh_cn": {
        "title": "标题（可选）",
        "content": [
          // 段落1
          [
            {"tag": "text", "text": "文本内容"}
          ],
          // 段落2
          [
            {"tag": "text", "text": "第一部分"},
            {"tag": "text", "text": "第二部分"}
          ]
        ]
      }
    }
  }
}
```

### 支持的元素标签 (tag)

| tag | 说明 | 属性 |
|-----|------|------|
| `text` | 纯文本 | `text`, `style` (bold, italic, color) |
| `a` | 超链接 | `text`, `href` |
| `at` | @某人 | `user_id` 或 `user_name` |
| `img` | 图片 | `img_key` (需要先上传图片获取 key) |
| `emoji` | 表情 | `emoji` |

### 文本样式

```json
{
  "tag": "text",
  "text": "加粗文本",
  "style": {
    "bold": true
  }
}
```

```json
{
  "tag": "text",
  "text": "红色文本",
  "style": {
    "color": "red"
  }
}
```

### 超链接

```json
{
  "tag": "a",
  "text": "点击这里",
  "href": "https://www.example.com"
}
```

### @用户

```json
{
  "tag": "at",
  "user_id": "ou_xxxxxxxxxxxxxxxx"
}
```

或使用 user_name：

```json
{
  "tag": "at",
  "user_name": "所有人",
  "style": {
    "user_id": "all"
  }
}
```

## 3. 卡片消息 (interactive)

卡片是一种更丰富的消息格式，支持按钮、输入框等交互元素。

```json
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {
        "tag": "plain_text",
        "content": "标题"
      }
    },
    "elements": [
      {
        "tag": "div",
        "text": {
          "tag": "plain_text",
          "content": "内容"
        }
      },
      {
        "tag": "action",
        "actions": [
          {
            "tag": "button",
            "text": {
              "tag": "plain_text",
              "content": "按钮"
            },
            "type": "primary",
            "url": "https://..."
          }
        ]
      }
    ]
  }
}
```

## 在 OpenClaw 中使用

OpenClaw 的 `message` 工具已封装了飞书 API，使用时直接传入参数即可：

### 发送纯文本

```json
{
  "action": "send",
  "channel": "feishu",
  "message": "Hello Nora",
  "target": "ou_xxx"
}
```

### 发送富文本

飞书富文本需要通过 `message` 工具的 `content` 参数传递。

> 注意：当前 OpenClaw 的 feishu 插件可能需要更新才能完全支持富文本格式。

## 注意事项

1. **content 必须是 JSON 字符串** - 在 API 调用时需要 `JSON.stringify()`
2. **user_id 获取** - 需要通过飞书 API 或用户信息获取
3. **图片上传** - 使用图片前需要先调用图片上传 API 获取 `img_key`
4. **语言版本** - 使用 `zh_cn` 或 `en_us` 指定语言

## 链接引用规范

在消息中引用链接时：
- 使用 `<url|文本>` 格式：`这是链接 <https://example.com|点击这里>`
- 或者使用富文本的 `a` 标签

---

*最后更新：2026-03-01*
