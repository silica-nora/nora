# 港股数据源记忆

更新时间：2026-03-10 23:16 (Asia/Shanghai)

## 当前使用的数据源（用于 MiniMax/智谱涨跌计算）

1) 腾讯港股实时行情接口（QT）
- 名称：Tencent QT Realtime Quote
- 示例：`https://qt.gtimg.cn/q=hk00100,hk02513`
- 用途：取当日最新价、涨跌幅、成交量等快照字段

2) 腾讯港股K线接口（IFZQ）
- 名称：Tencent IFZQ HK Kline API
- 示例：`https://web.ifzq.gtimg.cn/appstock/app/hkfqkline/get?param=hk00100,day,,,60,qfq`
- 用途：取日线序列（close），计算1日/5日/10日涨跌幅

## 备注
- 后续港股相关比较（如近5日/10日强弱）优先复用以上两条数据源。
