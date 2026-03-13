# A股7天复盘来源索引（白天定稿用）

> 目的：减少白天定稿时的检索成本，先固定候选来源入口。

## 核心来源文件
- `memory/2026-03-05.md`
- `memory/2026-03-06.md`
- `memory/2026-03-07.md`
- `memory/2026-03-08.md`
- `memory/2026-03-09.md`
- `memory/2026-03-10.md`
- `memory/2026-03-11.md`
- `memory/ashare-daily-tracker.md`
- `HEARTBEAT.md`（规则与追踪约束）

## 建议取证顺序
1. 先按日期文件抓“事实与反证条件”原句。
2. 再到 `ashare-daily-tracker` 抓 AI优先池动作变化。
3. 最后回写到 `ashare-7day-evidence-capture-template.md` 与 `v1-skeleton.md`。

## 质量门槛
- 仅采纳 T/T-1 时窗内信息。
- 每条结论必须能回跳到“文件+行号”。
- 无证据结论一律降级为“样本不足”。
