import { createRouter, createWebHistory } from 'vue-router'

const SITE_NAME = 'X-Utils'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '实用在线工具箱', description: '免费在线开发工具集合：JSON表格、时间戳、编码转换、文本对比、CSV、颜色工具、HTML预览等。' }
    },
    {
      path: '/json-to-table',
      name: 'json-to-table',
      component: () => import('../views/JsonToTable.vue'),
      meta: { title: 'JSON 转表格', description: '将JSON数组或对象转换为表格形式展示，支持嵌套数据的可视化浏览。' }
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
      meta: { title: 'HTML 预览', description: '在线实时预览HTML代码效果，支持CSS和JavaScript。' }
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
