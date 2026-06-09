import {
  Braces,
  Table2,
  Clock,
  Code2,
  Globe,
  Palette,
  FileText,
  Wrench,
  FlaskConical,
  BarChart3,
  Image,
  Music,
  Calculator,
  Copy,
  Plus,
  SquareCode,
  Link,
  ArrowLeftRight,
  Fingerprint,
  Binary,
  KeyRound,
  Hash,
  QrCode,
  Timer,
  Regex,
} from 'lucide-vue-next'

// 工具分类类型
export type ToolCategory = 'text' | 'convert' | 'crypto' | 'generate' | 'dev' | 'utility'

// 工具类型定义
export interface Tool {
  name: string
  description: string
  path: string
  icon: any
  status?: string
  category?: ToolCategory
}

// 工具分类配置
export const toolCategories: { key: ToolCategory; label: string; shortLabel: string }[] = [
  { key: 'text', label: '文本处理', shortLabel: '文本' },
  { key: 'convert', label: '数据转换', shortLabel: '转换' },
  { key: 'crypto', label: '编码加密', shortLabel: '加密' },
  { key: 'generate', label: '生成工具', shortLabel: '生成' },
  { key: 'dev', label: '开发辅助', shortLabel: '开发' },
  { key: 'utility', label: '实用工具', shortLabel: '实用' },
]

// 已实现的工具列表
export const implementedTools: Tool[] = [
  {
    name: 'JSON格式化',
    description: 'JSON美化、压缩、树形视图、表格视图、语法校验',
    path: '/json-formatter',
    icon: Braces,
    category: 'text'
  },
  {
    name: '文档分割',
    description: '支持多种分隔符的文本分割与合并工具',
    path: '/document-splitter',
    icon: FileText,
    category: 'text'
  },
  {
    name: '文本对比',
    description: '代码Diff对比，支持分屏与行内字符高亮',
    path: '/diff',
    icon: ArrowLeftRight,
    category: 'text'
  },
  {
    name: '时间戳工具',
    description: '时间戳转换、时区转换等功能',
    path: '/timestamp',
    icon: Clock,
    category: 'convert'
  },
  {
    name: '编码转换',
    description: '支持多种编码格式的转换工具',
    path: '/encoding',
    icon: Code2,
    category: 'convert'
  },
  {
    name: 'CSV工具',
    description: '支持CSV文件的导入、预览和编辑',
    path: '/csv-tool',
    icon: Table2,
    category: 'convert'
  },
  {
    name: 'URL参数解析',
    description: '解析与构建URL查询参数',
    path: '/url-params',
    icon: Link,
    category: 'convert'
  },
  {
    name: 'IP地址查询',
    description: '查询当前IP地址的详细信息',
    path: '/ip-lookup',
    icon: Globe,
    category: 'dev'
  },
  {
    name: '颜色工具',
    description: '颜色选择器、调色板、CSS渐变生成器',
    path: '/color-tools',
    icon: Palette,
    category: 'utility'
  },
  {
    name: 'HTML预览',
    description: '实时预览HTML代码效果',
    path: '/html-preview',
    icon: SquareCode,
    category: 'dev'
  },
  {
    name: '身份证信息',
    description: '提取身份证中的地区、年龄、性别等信息',
    path: '/id-card',
    icon: Fingerprint,
    category: 'utility'
  },
  {
    name: 'UUID 生成器',
    description: '批量生成 UUID v4，支持大小写和连字符控制',
    path: '/uuid',
    icon: Fingerprint,
    category: 'generate'
  },
  {
    name: '进制转换',
    description: '二进制、八进制、十进制、十六进制及任意进制互转',
    path: '/base-convert',
    icon: Binary,
    category: 'convert'
  },
  {
    name: '密码生成器',
    description: '加密安全的随机密码生成，支持自定义选项',
    path: '/password',
    icon: KeyRound,
    category: 'crypto'
  },
  {
    name: '哈希计算器',
    description: 'MD5、SHA-1、SHA-256、SHA-512等哈希值计算',
    path: '/hash',
    icon: Hash,
    category: 'crypto'
  },
  {
    name: '二维码生成器',
    description: '支持文本、网址、WiFi、邮箱、电话等多种内容类型',
    path: '/qrcode',
    icon: QrCode,
    category: 'generate'
  },
  {
    name: 'Cron生成器',
    description: '可视化生成和解析Cron定时任务表达式',
    path: '/cron',
    icon: Timer,
    category: 'dev'
  },
  {
    name: '正则表达式',
    description: '实时匹配高亮、分组解析、常用模板',
    path: '/regex',
    icon: Regex,
    category: 'dev'
  },
  {
    name: 'JWT 解析器',
    description: '解码JWT Token，查看Header/Payload/过期时间',
    path: '/jwt',
    icon: KeyRound,
    category: 'dev'
  },
  {
    name: 'JSON YAML 转换',
    description: 'JSON与YAML在线互转，支持格式化',
    path: '/json-yaml',
    icon: ArrowLeftRight,
    category: 'convert'
  },
  {
    name: 'Markdown 编辑器',
    description: '实时预览、工具栏、同步滚动、导出',
    path: '/markdown',
    icon: FileText,
    category: 'dev'
  },
  {
    name: '身份证生成',
    description: '指定省份、日期、性别批量生成模拟身份证号',
    path: '/id-card-generator',
    icon: Fingerprint,
    category: 'utility'
  }
]

// 开发中的工具列表
export const developingTools: Tool[] = [
  {
    name: '文本工具',
    description: '文本处理、格式化、统计等',
    path: '/text-tools',
    icon: FileText,
    status: '开发中'
  },
  {
    name: '图片工具',
    description: '图片压缩、格式转换、编辑等',
    path: '/image-tools',
    icon: Image,
    status: '开发中'
  },
  {
    name: '音频工具',
    description: '音频转换、剪辑、提取等',
    path: '/audio-tools',
    icon: Music,
    status: '开发中'
  },
  {
    name: '翻译工具',
    description: '多语言翻译、文本本地化',
    path: '/translation',
    icon: Globe,
    status: '开发中'
  },
  {
    name: '计算器',
    description: '科学计算、单位转换等',
    path: '/calculator',
    icon: Calculator,
    status: '开发中'
  },
  {
    name: '文档工具',
    description: '文档转换、合并、分割等',
    path: '/document-tools',
    icon: Copy,
    status: '开发中'
  },
  {
    name: '数据分析',
    description: '数据可视化、统计分析等',
    path: '/data-analysis',
    icon: BarChart3,
    status: '开发中'
  },
  {
    name: '开发工具',
    description: '代码格式化、压缩、混淆等',
    path: '/dev-tools',
    icon: Wrench,
    status: '开发中'
  },
  {
    name: '实验工具',
    description: '各种实验性功能',
    path: '/experimental',
    icon: FlaskConical,
    status: '开发中'
  }
]

// 导航栏工具列表
export const navigationTools: Tool[] = [
  ...implementedTools,
  {
    name: '更多工具',
    path: '/more',
    description: '查看更多工具',
    icon: Plus
  }
] 