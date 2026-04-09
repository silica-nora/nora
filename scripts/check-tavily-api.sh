#!/bin/bash

# 检查Tavily API密钥是否存在
if [ -z "$TAVILY_API_KEY" ]; then
    echo "错误：未设置TAVILY_API_KEY环境变量"
    exit 1
fi

# 检查API密钥是否有效（简单格式检查）
if ! [[ "$TAVILY_API_KEY" =~ ^tvly-[a-zA-Z0-9]+$ ]]; then
    echo "错误：TAVILY_API_KEY格式不正确，应为tvly-开头的字符串"
    exit 1
fi

echo "Tavily API密钥检查通过"
exit 0
