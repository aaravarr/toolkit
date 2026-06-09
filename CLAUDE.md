# X-Utils 项目指南

## 项目简介

X-Utils (xutils.net) 是一个基于 Vue 3 + TypeScript 的免费在线开发工具箱网站。

## 技术栈

- **框架**: Vue 3 + TypeScript + Vite
- **路由**: Vue Router (SPA 模式)
- **样式**: Tailwind CSS
- **部署**: 静态站点部署

## 开发规范

### 新增工具页面时的 SEO 更新清单

**每次新增工具页面，必须同步更新以下内容：**

#### 1. sitemap.xml (`public/sitemap.xml`)
```xml
<url>
  <loc>https://xutils.net/{新路由}</loc>
  <lastmod>{当前日期 YYYY-MM-DD}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

#### 2. index.html 首页 meta 标签
- **description**: 在工具列表中添加新工具名称
- **keywords**: 添加新工具的相关关键词（中英文、同义词）

#### 3. index.html 结构化数据 (JSON-LD)
- 在 `featureList` 数组中添加新工具的功能描述

#### 4. 路由 meta 信息 (`src/router/index.ts`)
- 设置 `title`: 页面标题，格式为 `{工具名} - X-Utils`
- 设置 `description`: 页面描述，包含工具功能和关键词

### SEO 更新检查清单

```markdown
□ sitemap.xml 已添加新页面 URL + lastmod
□ index.html description 已更新
□ index.html keywords 已更新
□ JSON-LD featureList 已添加新功能
□ 路由 meta.title 已设置
□ 路由 meta.description 已设置
```

## 文件结构

```
├── index.html              # SPA 入口，包含 SEO meta 标签
├── public/
│   ├── favicon.svg         # 网站图标
│   ├── og-image.svg        # 社交分享图片 (1200×630)
│   ├── robots.txt          # 爬虫配置
│   └── sitemap.xml         # 站点地图
├── src/
│   ├── router/
│   │   └── index.ts        # 路由定义 + 动态 SEO 更新
│   └── views/              # 工具页面组件
└── dist/                   # 构建产物
```

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建产物
```
