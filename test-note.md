# 测试笔记

创建于 2026-02-11

## 关于 obsidian-cli

这是一个测试文件，用于演示 obsidian-cli 的功能。

## 常用命令备忘

```bash
# 设置默认 Vault
obsidian-cli set-default "Vault名称"

# 搜索笔记
obsidian-cli search

# 创建笔记
obsidian-cli create "笔记名" --content "内容"

# 打开 Daily Note
obsidian-cli daily

# 移动/重命名（自动更新链接）
obsidian-cli move "旧路径" "新路径"

# 编辑 frontmatter
obsidian-cli frontmatter "笔记名" --edit --key "tags" --value "test"
```

## 待办事项

- [ ] 安装 Obsidian 桌面应用
- [ ] 创建第一个 Vault
- [ ] 配置 obsidian-cli

## 链接

- [obsidian-cli GitHub](https://github.com/yakitrak/obsidian-cli)
