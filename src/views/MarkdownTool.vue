<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Link,
  Image,
  Quote,
  Minus,
  Download,
  ArrowUpDown,
} from 'lucide-vue-next'

const SAMPLE_MARKDOWN = `# Markdown 编辑器示例

欢迎使用 **X-Utils Markdown 编辑器**！这是一个在线实时预览的 Markdown 编辑工具。

## 功能特性

- 实时预览，所见即所得
- 工具栏快捷插入常用语法
- 同步滚动，编辑与预览保持一致
- 支持导出 Markdown 和 HTML 文件

## 代码示例

内行代码 \`console.log("hello")\` 也可以使用。

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10)) // 55
\`\`\`

## 引用

> 生活就像骑自行车，为了保持平衡，你必须不断前进。
> — 阿尔伯特·爱因斯坦

## 表格

| 语言   | 类型     | 用途       |
|--------|----------|------------|
| JavaScript | 动态   | Web 前端   |
| TypeScript | 静态   | 全栈开发   |
| Python     | 动态   | 数据科学   |
| Rust       | 静态   | 系统编程   |

## 列表

### 无序列表

- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

### 有序列表

1. 打开编辑器
2. 输入 Markdown 内容
3. 右侧实时预览渲染结果

## 链接与图片

访问 [X-Utils](https://xutils.net) 获取更多工具。

![示例图片](https://picsum.photos/600/300)

---

*开始编辑吧！删除这些示例内容，输入你自己的 Markdown。*
`

const markdown = ref(SAMPLE_MARKDOWN)
const editorRef = ref<HTMLTextAreaElement | null>(null)
const previewRef = ref<HTMLDivElement | null>(null)
const isSyncingScroll = ref(false)
const isMobile = ref(window.innerWidth < 768)
const mobileView = ref<'editor' | 'preview'>('editor')

// --- Markdown Parser ---
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
}

function parseMarkdown(md: string): string {
  const lines = md.split('\n')
  let html = ''
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().slice(3).trim()
      let code = ''
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        code += (code ? '\n' : '') + lines[i]
        i++
      }
      i++ // skip closing ```
      html += `<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>\n`
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = parseInline(headingMatch[2])
      html += `<h${level}>${text}</h${level}>\n`
      i++
      continue
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      html += '<hr>\n'
      i++
      continue
    }

    // Blockquote (collect consecutive lines)
    if (line.trimStart().startsWith('>')) {
      let quoteLines = ''
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quoteLines += (quoteLines ? '\n' : '') + lines[i].replace(/^\s*>\s?/, '')
        i++
      }
      html += `<blockquote>${parseInline(quoteLines)}</blockquote>\n`
      continue
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:]*-+/.test(lines[i + 1])) {
      const rows: string[][] = []
      // Header
      rows.push(parseTableRow(line))
      i++ // header row
      i++ // separator row
      // Body
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(parseTableRow(lines[i]))
        i++
      }
      html += '<table>\n'
      if (rows.length > 0) {
        html += '<thead><tr>'
        for (const cell of rows[0]) {
          html += `<th>${parseInline(cell.trim())}</th>`
        }
        html += '</tr></thead>\n'
      }
      if (rows.length > 1) {
        html += '<tbody>'
        for (let r = 1; r < rows.length; r++) {
          html += '<tr>'
          for (const cell of rows[r]) {
            html += `<td>${parseInline(cell.trim())}</td>`
          }
          html += '</tr>\n'
        }
        html += '</tbody>'
      }
      html += '</table>\n'
      continue
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      html += parseList(lines, i, 'ul')
      while (i < lines.length && (/^\s*[-*+]\s+/.test(lines[i]) || (/^\s+/.test(lines[i]) && lines[i].trim() !== ''))) {
        i++
      }
      continue
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      html += parseList(lines, i, 'ol')
      while (i < lines.length && (/^\s*\d+\.\s+/.test(lines[i]) || (/^\s+/.test(lines[i]) && lines[i].trim() !== ''))) {
        i++
      }
      continue
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph: collect consecutive non-empty lines
    let para = ''
    while (i < lines.length && lines[i].trim() !== '' && !isBlockElement(lines[i])) {
      para += (para ? ' ' : '') + lines[i]
      i++
    }
    if (para) {
      html += `<p>${parseInline(para)}</p>\n`
    }
  }

  return html
}

function isBlockElement(line: string): boolean {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim()) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    line.trimStart().startsWith('>') ||
    line.trimStart().startsWith('```')
  )
}

function parseTableRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
}

function parseList(lines: string[], start: number, tag: 'ul' | 'ol'): string {
  const items: { indent: number; content: string }[] = []
  let i = start

  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/)
    if (match) {
      items.push({ indent: match[1].length, content: match[3] })
      i++
    } else if (/^\s+/.test(line) && line.trim() !== '' && items.length > 0) {
      // Continuation of previous item
      items[items.length - 1].content += ' ' + line.trim()
      i++
    } else {
      break
    }
  }

  if (items.length === 0) return ''

  let html = `<${tag}>\n`
  for (const item of items) {
    html += `<li>${parseInline(item.content)}</li>\n`
  }
  html += `</${tag}>\n`
  return html
}

function parseInline(text: string): string {
  // Escape HTML first, then apply inline formatting
  let s = escapeHtml(text)

  // Images: ![alt](url) — must come before links
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')

  // Links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Inline code: `code`
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold: **text** or __text__
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_ (but not inside words with underscores)
  s = s.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '<em>$1</em>')
  s = s.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>')

  // Strikethrough: ~~text~~
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Line breaks
  s = s.replace(/  \n/g, '<br>')

  return s
}

const renderedHtml = computed(() => parseMarkdown(markdown.value))

// --- Word count ---
const stats = computed(() => {
  const text = markdown.value
  const chars = text.length
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const lines = text.split('\n').length
  return { chars, words, lines }
})

// --- Synchronized scrolling ---
function handleEditorScroll() {
  if (isSyncingScroll.value || !editorRef.value || !previewRef.value) return
  isSyncingScroll.value = true
  const editor = editorRef.value
  const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1)
  const preview = previewRef.value
  preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight || 1)
  requestAnimationFrame(() => {
    isSyncingScroll.value = false
  })
}

function handlePreviewScroll() {
  if (isSyncingScroll.value || !editorRef.value || !previewRef.value) return
  isSyncingScroll.value = true
  const preview = previewRef.value
  const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1)
  const editor = editorRef.value
  editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight || 1)
  requestAnimationFrame(() => {
    isSyncingScroll.value = false
  })
}

// --- Toolbar actions ---
function insertText(before: string, after: string, placeholder: string) {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = markdown.value.substring(start, end)
  const text = selected || placeholder
  const newText = markdown.value.substring(0, start) + before + text + after + markdown.value.substring(end)
  markdown.value = newText
  nextTick(() => {
    el.focus()
    const newStart = start + before.length
    const newEnd = newStart + text.length
    el.setSelectionRange(newStart, newEnd)
  })
}

function insertLinePrefix(prefix: string, placeholder: string) {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const lineStart = markdown.value.lastIndexOf('\n', start - 1) + 1
  const selected = markdown.value.substring(el.selectionStart, el.selectionEnd) || placeholder
  const newText = markdown.value.substring(0, lineStart) + prefix + selected + markdown.value.substring(el.selectionEnd)
  markdown.value = newText
  nextTick(() => {
    el.focus()
    const newStart = lineStart + prefix.length
    el.setSelectionRange(newStart, newStart + selected.length)
  })
}

function insertBlock(block: string) {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const before = markdown.value.substring(0, start)
  const after = markdown.value.substring(el.selectionEnd)
  const needsNewlineBefore = before.length > 0 && !before.endsWith('\n\n')
  const prefix = needsNewlineBefore ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
  markdown.value = before + prefix + block + after
  nextTick(() => {
    el.focus()
    const newPos = start + prefix.length + block.length
    el.setSelectionRange(newPos, newPos)
  })
}

const toolbarActions = [
  { icon: Bold, title: '加粗', action: () => insertText('**', '**', '粗体文本') },
  { icon: Italic, title: '斜体', action: () => insertText('*', '*', '斜体文本') },
  { icon: Strikethrough, title: '删除线', action: () => insertText('~~', '~~', '删除线文本') },
  { divider: true },
  { icon: Heading1, title: '一级标题', action: () => insertLinePrefix('# ', '标题') },
  { icon: Heading2, title: '二级标题', action: () => insertLinePrefix('## ', '标题') },
  { icon: Heading3, title: '三级标题', action: () => insertLinePrefix('### ', '标题') },
  { divider: true },
  { icon: List, title: '无序列表', action: () => insertLinePrefix('- ', '列表项') },
  { icon: ListOrdered, title: '有序列表', action: () => insertLinePrefix('1. ', '列表项') },
  { divider: true },
  { icon: Code2, title: '代码块', action: () => insertBlock('```\n代码\n```') },
  { icon: Quote, title: '引用', action: () => insertLinePrefix('> ', '引用文本') },
  { divider: true },
  { icon: Link, title: '链接', action: () => insertText('[', '](https://)', '链接文本') },
  { icon: Image, title: '图片', action: () => insertText('![', '](https://)', '图片描述') },
  { icon: Minus, title: '水平线', action: () => insertBlock('---\n') },
]

// --- Export ---
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadMarkdown() {
  downloadFile(markdown.value, 'document.md', 'text/markdown;charset=utf-8')
}

function downloadHtml() {
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111827; line-height: 1.75; }
    h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
    h2 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
    h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
    p { margin: 0.5rem 0; }
    code { background: #f1f3f5; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875rem; font-family: 'JetBrains Mono', monospace; }
    pre { background: #f8f9fb; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.75rem 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #2563eb; padding-left: 1rem; color: #6b7280; margin: 0.75rem 0; }
    ul, ol { padding-left: 1.5rem; margin: 0.5rem 0; }
    li { margin: 0.25rem 0; }
    a { color: #2563eb; text-decoration: underline; }
    img { max-width: 100%; border-radius: 8px; margin: 0.75rem 0; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
    th, td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f8f9fb; font-weight: 600; }
  </style>
</head>
<body>
${renderedHtml.value}
</body>
</html>`
  downloadFile(fullHtml, 'document.html', 'text/html;charset=utf-8')
}

// --- Responsive ---
function handleResize() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <ToolCard title="Markdown 编辑器" description="实时预览、工具栏、同步滚动、导出">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] mb-4">
      <template v-for="(item, idx) in toolbarActions" :key="idx">
        <div v-if="'divider' in item" class="w-px h-5 bg-[var(--border)] mx-1"></div>
        <button
          v-else
          :title="item.title"
          class="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          @click="item.action"
        >
          <component :is="item.icon" class="w-4 h-4" />
        </button>
      </template>

      <div class="flex-1"></div>

      <!-- Export buttons (desktop) -->
      <div class="hidden sm:flex items-center gap-1.5">
        <CopyButton :text="markdown" label="复制 MD" size="sm" />
        <CopyButton :text="renderedHtml" label="复制 HTML" size="sm" />
        <button class="btn-secondary !py-1 !px-2.5 !text-xs inline-flex items-center gap-1 cursor-pointer" @click="downloadMarkdown">
          <Download class="w-3.5 h-3.5" /> .md
        </button>
        <button class="btn-secondary !py-1 !px-2.5 !text-xs inline-flex items-center gap-1 cursor-pointer" @click="downloadHtml">
          <Download class="w-3.5 h-3.5" /> .html
        </button>
      </div>

      <!-- Mobile view toggle -->
      <button
        class="sm:hidden p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
        title="切换视图"
        @click="mobileView = mobileView === 'editor' ? 'preview' : 'editor'"
      >
        <ArrowUpDown class="w-4 h-4" />
      </button>
    </div>

    <!-- Mobile export buttons -->
    <div class="flex sm:hidden items-center gap-1.5 mb-3">
      <CopyButton :text="markdown" label="复制 MD" size="sm" />
      <CopyButton :text="renderedHtml" label="复制 HTML" size="sm" />
      <button class="btn-secondary !py-1 !px-2.5 !text-xs inline-flex items-center gap-1 cursor-pointer" @click="downloadMarkdown">
        <Download class="w-3.5 h-3.5" /> .md
      </button>
      <button class="btn-secondary !py-1 !px-2.5 !text-xs inline-flex items-center gap-1 cursor-pointer" @click="downloadHtml">
        <Download class="w-3.5 h-3.5" /> .html
      </button>
    </div>

    <!-- Editor + Preview -->
    <div class="flex flex-col lg:flex-row gap-4" style="height: calc(100vh - 16rem); min-height: 400px;">
      <!-- Editor -->
      <div class="flex-1 flex flex-col min-h-0" :class="{ 'hidden lg:flex': isMobile && mobileView !== 'editor' }">
        <label class="label-text">Markdown</label>
        <textarea
          ref="editorRef"
          v-model="markdown"
          class="textarea-field font-mono flex-1 min-h-0"
          style="resize: none;"
          placeholder="输入 Markdown 内容..."
          spellcheck="false"
          @scroll="handleEditorScroll"
        ></textarea>
      </div>

      <!-- Preview -->
      <div class="flex-1 flex flex-col min-h-0" :class="{ 'hidden lg:flex': isMobile && mobileView !== 'preview' }">
        <label class="label-text">预览</label>
        <div
          ref="previewRef"
          class="prose flex-1 min-h-0 overflow-auto rounded-lg border-1.5 border-[var(--border)] bg-[var(--bg-primary)] p-4"
          @scroll="handlePreviewScroll"
          v-html="renderedHtml"
        ></div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="flex items-center gap-4 mt-3 text-xs text-[var(--text-tertiary)]">
      <span>字符: {{ stats.chars }}</span>
      <span>单词: {{ stats.words }}</span>
      <span>行数: {{ stats.lines }}</span>
    </div>
  </ToolCard>
</template>

<style scoped>
/* Preview prose styles */
.prose :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
  color: var(--text-primary);
}
.prose :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  color: var(--text-primary);
}
.prose :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
  color: var(--text-primary);
}
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
  color: var(--text-primary);
}
.prose :deep(p) {
  margin: 0.5rem 0;
  line-height: 1.75;
  color: var(--text-primary);
}
.prose :deep(code) {
  background: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.prose :deep(pre) {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.75rem 0;
}
.prose :deep(pre code) {
  background: none;
  padding: 0;
}
.prose :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 1rem;
  color: var(--text-secondary);
  margin: 0.75rem 0;
}
.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.prose :deep(li) {
  margin: 0.25rem 0;
}
.prose :deep(a) {
  color: var(--accent);
  text-decoration: underline;
}
.prose :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.75rem 0;
}
.prose :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1rem 0;
}
.prose :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75rem 0;
}
.prose :deep(th),
.prose :deep(td) {
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.prose :deep(th) {
  background: var(--bg-secondary);
  font-weight: 600;
}
.prose :deep(del) {
  color: var(--text-tertiary);
}
.prose :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}
</style>
