# 22:00前命令片段（最小）

- 检查night日志：`[ -s /tmp/news-night.log ] && echo HIT || echo MISS`
- 去重检索：`grep -F "<链接>" memory/news-push-history.tsv`
- 发送后删除：`rm -f /tmp/news-night.log`
