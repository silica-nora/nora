# Ontology 学习笔记

## 核心概念

- **实体（Entity）**：所有知识都是实体，有类型、属性、关系
- **关系（Relation）**：实体之间的连接
- **存储**：`memory/ontology/graph.jsonl`
- **只追加原则**：不覆盖已有数据，只追加/合并

## 核心类型

| 类型 | 用途 |
|------|------|
| Person | 人（tk、Nora 等） |
| Project | 项目（博客、记忆系统等） |
| Task | 任务 |
| Event | 事件 |
| Document | 文档 |
| Note | 笔记 |
| Action | 行动记录 |

## 使用场景

| 触发 | 动作 |
|------|------|
| "记住..." | 创建/更新实体 |
| "关于X知道什么" | 查询图谱 |
| "关联X到Y" | 创建关系 |
| "显示项目Z的所有任务" | 图遍历 |

## 使用方式

```bash
# 初始化
mkdir -p memory/ontology
touch memory/ontology/graph.jsonl

# 创建实体
python3 scripts/ontology.py create --type Person --props '{"name":"tk"}'

# 查询
python3 scripts/ontology.py query --type Person

# 关联
python3 scripts/ontology.py relate --from proj_001 --rel has_owner --to person_001
```

## 与现有系统的整合

- 当前的 memory/ 可以作为 Document 类型
- 每小时记忆任务的结果可以作为 Note 关联到对应日期
- 可以创建 Project 类型来组织长期项目

## 下一步

- [ ] 初始化 ontology 存储目录
- [ ] 创建 tk 的 Person 实体
- [ ] 创建几个项目的 Project 实体
- [ ] 把现有知识整理成结构化数据
