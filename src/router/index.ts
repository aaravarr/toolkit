import { createRouter, createWebHistory } from 'vue-router'

const SITE_NAME = 'X-Utils'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '实用在线工具箱', description: '免费在线开发工具集合：JSON格式化、时间戳、编码转换、文本对比、CSV、颜色工具、HTML预览等。' }
    },
    {
      path: '/json-formatter',
      name: 'json-formatter',
      component: () => import('../views/JsonFormatterTool.vue'),
      meta: { title: 'JSON 格式化', description: 'JSON美化、压缩、树形视图、表格视图、语法校验、JSONPath提取，支持文件上传。' }
    },
    {
      path: '/timestamp',
      name: 'timestamp',
      component: () => import('../views/TimestampTool.vue'),
      meta: { title: '时间戳工具', description: '时间戳与日期互转、时区转换、时间格式化、时间计算，支持粘贴自动识别。' }
    },
    {
      path: '/encoding',
      name: 'encoding',
      component: () => import('../views/EncodingTool.vue'),
      meta: { title: '编码转换', description: '支持Base64、URL、HTML实体、MD5、SHA、AES等16种编码格式的在线转换工具。' }
    },
    {
      path: '/ip-lookup',
      name: 'ip-lookup',
      component: () => import('../views/IpLookup.vue'),
      meta: { title: 'IP 地址查询', description: '查询当前IP地址的地理位置、ISP等详细信息。' }
    },
    {
      path: '/color-tools',
      name: 'color-tools',
      component: () => import('../views/ColorTools.vue'),
      meta: { title: '颜色工具', description: '在线颜色选择器、调色板、CSS渐变代码生成器。' }
    },
    {
      path: '/document-splitter',
      name: 'document-splitter',
      component: () => import('../views/DocumentSplitter.vue'),
      meta: { title: '文档分割工具', description: '支持多种分隔符的文本分割与合并工具，内置常用编程语言模板。' }
    },
    {
      path: '/html-preview',
      name: 'html-preview',
      component: () => import('../views/HtmlPreview.vue'),
      meta: { title: 'HTML 预览', description: '在线实时预览HTML代码效果，支持CSS/JavaScript，以及全屏编辑与全屏预览视图。' }
    },
    {
      path: '/csv-tool',
      name: 'csv-tool',
      component: () => import('../views/CsvTool.vue'),
      meta: { title: 'CSV 工具', description: 'CSV/Excel文件的在线导入、预览、编辑和导出工具。' }
    },
    {
      path: '/url-params/:data?',
      name: 'url-params',
      component: () => import('../views/UrlParamsTool.vue'),
      meta: { title: 'URL 参数解析', description: 'URL查询字符串的在线解析与构建工具。' }
    },
    {
      path: '/diff',
      name: 'diff',
      component: () => import('../views/DiffTool.vue'),
      meta: { title: '文本对比', description: '在线代码Diff对比工具，支持分屏与统一视图、行内字符级高亮、块级合并。' }
    },
    {
      path: '/id-card',
      name: 'id-card',
      component: () => import('../views/IdCardTool.vue'),
      meta: { title: '身份证信息提取', description: '输入身份证号码，自动提取省份、年龄、性别、生肖、星座等信息，支持校验码验证。' }
    },
    {
      path: '/uuid',
      name: 'uuid',
      component: () => import('../views/UuidTool.vue'),
      meta: { title: 'UUID 生成器', description: '在线生成 UUID v4（随机），支持批量生成、大小写切换、连字符控制。' }
    },
    {
      path: '/base-convert',
      name: 'base-convert',
      component: () => import('../views/BaseConvertTool.vue'),
      meta: { title: '进制转换', description: '支持二进制、八进制、十进制、十六进制及任意 2-36 进制的实时互转工具。' }
    },
    {
      path: '/password',
      name: 'password',
      component: () => import('../views/PasswordTool.vue'),
      meta: { title: '密码生成器', description: '使用加密安全的随机数生成器创建高强度密码，支持自定义长度、字符类型、批量生成。' }
    },
    {
      path: '/hash',
      name: 'hash',
      component: () => import('../views/HashTool.vue'),
      meta: { title: '哈希计算器', description: '在线计算MD5、SHA-1、SHA-256、SHA-512等哈希值，支持HMAC模式和文件哈希。' }
    },
    {
      path: '/qrcode',
      name: 'qrcode',
      component: () => import('../views/QrCodeTool.vue'),
      meta: { title: '二维码生成器', description: '支持文本、网址、WiFi、邮箱、电话等多种内容类型的二维码生成，支持自定义样式和下载。' }
    },
    {
      path: '/cron',
      name: 'cron',
      component: () => import('../views/CronTool.vue'),
      meta: { title: 'Cron 表达式生成器', description: '可视化生成和解析 Cron 定时任务表达式，支持常用预设、人类可读描述和未来执行时间预览。' }
    },
    {
      path: '/json-yaml',
      name: 'json-yaml',
      component: () => import('../views/JsonYamlTool.vue'),
      meta: { title: 'JSON YAML 转换', description: 'JSON与YAML在线互转工具，支持格式化、压缩、错误定位。' }
    },
    {
      path: '/regex',
      name: 'regex',
      component: () => import('../views/RegexTool.vue'),
      meta: { title: '正则表达式测试', description: '在线正则表达式测试工具，实时匹配高亮、分组解析、常用正则模板。' }
    },
    {
      path: '/jwt',
      name: 'jwt',
      component: () => import('../views/JwtTool.vue'),
      meta: { title: 'JWT 解析器', description: '在线JWT Token解析工具，解码Header/Payload，判断过期时间。' }
    },
    {
      path: '/markdown',
      name: 'markdown',
      component: () => import('../views/MarkdownTool.vue'),
      meta: { title: 'Markdown 编辑器', description: '在线Markdown编辑器，实时预览、工具栏、同步滚动、导出HTML。' }
    },
    {
      path: '/id-card-generator',
      name: 'id-card-generator',
      component: () => import('../views/IdCardGeneratorTool.vue'),
      meta: { title: '身份证号码生成', description: '在线随机身份证号码生成器，可指定省份、出生日期、性别批量生成模拟身份证号。' }
    },
    {
      path: '/more',
      name: 'more',
      component: () => import('../views/MoreView.vue'),
      meta: { title: '更多工具', description: '更多实用工具正在开发中，敬请期待。' }
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

// 动态更新页面标题和 meta
router.afterEach((to) => {
  const title = to.meta.title as string
  const description = to.meta.description as string

  document.title = title ? `${title} - ${SITE_NAME}` : SITE_NAME

  // 更新 meta description
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc && description) {
    metaDesc.setAttribute('content', description)
  }

  // 更新 og:title
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    ogTitle.setAttribute('content', title ? `${title} - ${SITE_NAME}` : SITE_NAME)
  }

  // 更新 og:description
  const ogDesc = document.querySelector('meta[property="og:description"]')
  if (ogDesc && description) {
    ogDesc.setAttribute('content', description)
  }
})

export default router

