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
} from 'lucide-vue-next'

// 工具分类类型
export type ToolCategory = 'text' | 'data' | 'dev'

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
  { key: 'text', label: '文本工具', shortLabel: '文本' },
  { key: 'data', label: '数据工具', shortLabel: '数据' },
  { key: 'dev', label: '开发工具', shortLabel: '开发' },
]

// 已实现的工具列表
export const implementedTools: Tool[] = [
  {
    name: 'JSON表格',
    description: '将JSON数据转换为表格形式展示',
    path: '/json-to-table',
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
    category: 'data'
  },
  {
    name: '编码转换',
    description: '支持多种编码格式的转换工具',
    path: '/encoding',
    icon: Code2,
    category: 'data'
  },
  {
    name: 'CSV工具',
    description: '支持CSV文件的导入、预览和编辑',
    path: '/csv-tool',
    icon: Table2,
    category: 'data'
  },
  {
    name: 'URL参数解析',
    description: '解析与构建URL查询参数',
    path: '/url-params',
    icon: Link,
    category: 'data'
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
    category: 'dev'
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
    category: 'dev'
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