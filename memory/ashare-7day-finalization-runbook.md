# A股7天复盘定稿 Runbook（工作时段执行）

## 目标
在一个工作时段内，把阶段复盘从草稿推进到 v1.0 定稿。

## 输入文件
- 草稿：`memory/ashare-7day-phase-review-draft.md`
- 证据填表：`memory/ashare-7day-evidence-capture-template.md`
- 定稿骨架：`memory/ashare-7day-phase-review-v1-skeleton.md`

## 执行顺序（30-45分钟）
1. 先填 `evidence-capture-template`：D1~D7 各补 1 组“事实/推断/反证+行号”。
2. 再填 `v1-skeleton`：把证据映射到“命中点3/偏差点3/下周调整3”。
3. 交叉校验：每条结论必须能回跳到证据行号；不满足则降级为“样本不足”。
4. 回写草稿状态：将草稿状态从“待白天补证据”改为“v1.0 定稿”。

## 退出条件（DoD）
- D1~D7 全覆盖且可追溯
- AI优先池5只至少2个交易日动作变化齐全
- 3/3/3 结论均有证据锚点
