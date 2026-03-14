# 三档推送预检 Runbook 索引

## 使用时机
- 10:00 早报前：`memory/morning-1000-push-preflight-checklist.md`
- 15:10 午报前：`memory/afternoon-1510-push-preflight-checklist.md`
- 22:00 晚报前：`memory/night-2200-push-preflight-checklist.md`

## 通用硬规则
- 中文化：英文标题/摘要先转中文
- 链接格式：仅 `[中文标题](url)`，禁裸链接
- 去重：按“标题+链接”与最近48小时已推送记录比对
- 收尾：发送成功后删除对应日志并记录 messageId
