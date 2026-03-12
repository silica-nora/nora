# Archive Workspace v2 架构（脚本主流程 + 模型决策兜底）

## 目标
- 将可确定步骤全部脚本化，减少模型轮次与打扰。
- 只在“必须决策”节点触发用户交互。
- 核心规范：用户一句“归档”应尽量自动完成全流程。

## 分层

### L1 执行层（Script Engine）
入口：`scripts/archive_runner.py`

职责：
1. preflight（git/repo/identity/branch/remote）
2. 变更检测与分类（新增/修改/删除）
3. 本地自愈（git init、repo-local identity、detached head 处理）
4. dry-run 预检（静默）
5. run 模式提交（git add/敏感扫描/commit/push）
6. 输出统一 JSON 结果

### L2 决策层（Model/User）
只处理脚本返回 `needs_decision` 的场景：
- 无 remote 且未提供 remote_url
- 认证/权限问题
- 敏感内容拦截后需要选择修复路径

## 状态机
- `success`：归档成功（本地+远端或本地）
- `no_change`：无变更
- `needs_decision`：需要用户输入（如 remote_url）
- `blocked`：安全拦截（敏感内容）
- `failed`：执行失败（附 failure_code）

## 标准输出（JSON）
- `status`
- `branch`
- `changes`（added/modified/deleted）
- `commit_id`
- `push_status`（success/failed/pending_remote/not_needed）
- `failure_code`
- `next_action`
- `notes`

## 交互策略（低打扰）
- 默认静默 dry-run，不向用户输出过程细节。
- 仅在 `needs_decision/blocked/failed` 时输出人类可读行动建议。

## 已落地扩展
- 冲突预检：fetch + non-fast-forward 风险检测（返回 `NON_FAST_FORWARD_RISK`）
- 大文件预警：>20MB 文件加入 `notes` 并提示考虑 Git LFS

## 后续扩展
- 结果模板多语言（中文/英文）
- 风险等级评分（低/中/高）
