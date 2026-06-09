<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import {
  Regex,
  AlertCircle,
  Hash,
  BookOpen,
  RotateCcw,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'

// ===== 输入状态 =====
const regexStr = ref('')
const testText = ref('')
const flags = ref<Set<string>>(new Set(['g']))
const showExplanation = ref(true)

// ===== Flags =====
const flagOptions = [
  { key: 'g', label: 'g', desc: '全局匹配' },
  { key: 'i', label: 'i', desc: '忽略大小写' },
  { key: 'm', label: 'm', desc: '多行模式' },
  { key: 's', label: 's', desc: '点号匹配换行' },
]

function toggleFlag(key: string) {
  const next = new Set(flags.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  flags.value = next
}

const flagStr = computed(() => Array.from(flags.value).join(''))

// ===== 正则解析 =====
const regexError = ref('')

const compiledRegex = computed(() => {
  if (!regexStr.value) {
    regexError.value = ''
    return null
  }
  try {
    const re = new RegExp(regexStr.value, flagStr.value)
    regexError.value = ''
    return re
  } catch (e: any) {
    regexError.value = (e.message as string).replace(/^Invalid regular expression: /, '')
    return null
  }
})

// ===== 匹配结果 =====
interface MatchItem {
  text: string
  index: number
  end: number
  groups?: Record<string, string>[]
}

const matches = computed<MatchItem[]>(() => {
  if (!compiledRegex.value || !testText.value) return []
  const re = compiledRegex.value
  const results: MatchItem[] = []

  if (re.global) {
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(testText.value)) !== null) {
      const groups = m.length > 1
        ? m.slice(1).map((g, i) => ({ [`${i + 1}`]: g ?? '' }))
        : undefined
      results.push({
        text: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups,
      })
      if (m[0].length === 0) re.lastIndex++
    }
  } else {
    const m = re.exec(testText.value)
    if (m) {
      const groups = m.length > 1
        ? m.slice(1).map((g, i) => ({ [`${i + 1}`]: g ?? '' }))
        : undefined
      results.push({
        text: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups,
      })
    }
  }
  return results
})

// ===== 高亮文本 =====
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
}

const highlightedText = computed(() => {
  if (!testText.value) return ''
  if (!compiledRegex.value || matches.value.length === 0) {
    return escapeHtml(testText.value)
  }

  const parts: string[] = []
  let last = 0
  for (const m of matches.value) {
    if (m.index > last) {
      parts.push(escapeHtml(testText.value.slice(last, m.index)))
    }
    parts.push(
      `<mark class="bg-accent-soft text-content-primary rounded px-0.5 ring-1 ring-accent/20">${escapeHtml(m.text)}</mark>`
    )
    last = m.end
  }
  if (last < testText.value.length) {
    parts.push(escapeHtml(testText.value.slice(last)))
  }
  return parts.join('')
})

// ===== 正则解释 =====
const explanation = computed(() => {
  if (!regexStr.value) return ''
  try {
    new RegExp(regexStr.value)
  } catch {
    return ''
  }

  const tokens = parseRegexTokens(regexStr.value)
  return describeTokens(tokens)
})

type TokenType =
  | 'group-open' | 'group-close' | 'named-group' | 'non-capture'
  | 'lookahead' | 'neg-lookahead' | 'lookbehind' | 'neg-lookbehind'
  | 'anchor-start' | 'anchor-end' | 'word-boundary'
  | 'any' | 'alternation'
  | 'char-class' | 'neg-class' | 'escape'
  | 'quantifier' | 'optional'
  | 'backref'
  | 'literal'

interface Token {
  type: TokenType
  value: string
}

function parseRegexTokens(pattern: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < pattern.length) {
    const ch = pattern[i]

    if (ch === '\\') {
      i++
      if (i >= pattern.length) {
        tokens.push({ type: 'literal', value: '\\' })
        break
      }
      const next = pattern[i]
      const special = 'dDwWsSbB0123456789tnrfv\\.^$|()[]{}*+?'
      if (special.includes(next)) {
        tokens.push({ type: 'escape', value: `\\${next}` })
      } else {
        tokens.push({ type: 'literal', value: `\\${next}` })
      }
      i++
      continue
    }

    if (ch === '[') {
      let j = i + 1
      if (j < pattern.length && pattern[j] === '^') j++
      if (j < pattern.length && pattern[j] === ']') j++
      while (j < pattern.length && pattern[j] !== ']') {
        if (pattern[j] === '\\') j++
        j++
      }
      const cls = pattern.slice(i, j + 1)
      tokens.push({
        type: cls[1] === '^' ? 'neg-class' : 'char-class',
        value: cls,
      })
      i = j + 1
      continue
    }

    if (ch === '(') {
      if (pattern.slice(i, i + 3) === '(?:') {
        tokens.push({ type: 'non-capture', value: '(?:' })
        i += 3
      } else if (pattern.slice(i, i + 4) === '(?=') {
        tokens.push({ type: 'lookahead', value: '(?=' })
        i += 3
      } else if (pattern.slice(i, i + 4) === '(?!') {
        tokens.push({ type: 'neg-lookahead', value: '(?!' })
        i += 3
      } else if (pattern.slice(i, i + 4) === '(?<=') {
        tokens.push({ type: 'lookbehind', value: '(?<=' })
        i += 4
      } else if (pattern.slice(i, i + 4) === '(?<!') {
        tokens.push({ type: 'neg-lookbehind', value: '(?<!' })
        i += 4
      } else if (pattern.slice(i).match(/^\(\?P?<([^>]+)>/)) {
        const m = pattern.slice(i).match(/^\(\?P?<([^>]+)>/)!
        tokens.push({ type: 'named-group', value: m[1] })
        i += m[0].length
      } else {
        tokens.push({ type: 'group-open', value: '(' })
        i++
      }
      continue
    }

    if (ch === ')') {
      tokens.push({ type: 'group-close', value: ')' })
      i++
      continue
    }

    if (ch === '^') {
      tokens.push({ type: 'anchor-start', value: '^' })
      i++
      continue
    }

    if (ch === '$') {
      tokens.push({ type: 'anchor-end', value: '$' })
      i++
      continue
    }

    if (ch === '.') {
      tokens.push({ type: 'any', value: '.' })
      i++
      continue
    }

    if (ch === '|') {
      tokens.push({ type: 'alternation', value: '|' })
      i++
      continue
    }

    if (ch === '{') {
      const m = pattern.slice(i).match(/^\{(\d+)(,(\d*))?\}/)
      if (m) {
        tokens.push({ type: 'quantifier', value: m[0] })
        i += m[0].length
        continue
      }
    }

    if (ch === '*' || ch === '+' || ch === '?') {
      let q = ch
      if (i + 1 < pattern.length && pattern[i + 1] === '?') {
        q += '?'
      }
      tokens.push({ type: 'quantifier', value: q })
      i += q.length
      continue
    }

    // Literal characters - group consecutive ones
    let literal = ch
    i++
    while (
      i < pattern.length &&
      !'\\[().|^$*+?{'.includes(pattern[i])
    ) {
      // Check for { quantifier
      if (pattern[i] === '{') {
        const qm = pattern.slice(i).match(/^\{(\d+)(,(\d*))?\}/)
        if (qm) break
      }
      literal += pattern[i]
      i++
    }
    tokens.push({ type: 'literal', value: literal })
  }

  return tokens
}

function describeTokens(tokens: Token[]): string {
  if (tokens.length === 0) return ''
  const parts: string[] = []

  for (const token of tokens) {
    switch (token.type) {
      case 'literal':
        parts.push(`匹配文字 "${token.value}"`)
        break
      case 'any':
        parts.push('匹配任意单个字符')
        break
      case 'anchor-start':
        parts.push('匹配字符串开头')
        break
      case 'anchor-end':
        parts.push('匹配字符串结尾')
        break
      case 'word-boundary':
        parts.push('匹配单词边界')
        break
      case 'alternation':
        parts.push('或者')
        break
      case 'group-open':
        parts.push('捕获组开始')
        break
      case 'named-group':
        parts.push(`命名捕获组 "${token.value}"`)
        break
      case 'non-capture':
        parts.push('非捕获组')
        break
      case 'lookahead':
        parts.push('正向前瞻断言')
        break
      case 'neg-lookahead':
        parts.push('负向前瞻断言')
        break
      case 'lookbehind':
        parts.push('正向后顾断言')
        break
      case 'neg-lookbehind':
        parts.push('负向后顾断言')
        break
      case 'group-close':
        parts.push('组结束')
        break
      case 'escape': {
        const esc: Record<string, string> = {
          '\\d': '匹配数字 [0-9]',
          '\\D': '匹配非数字',
          '\\w': '匹配字母、数字、下划线',
          '\\W': '匹配非字母数字下划线',
          '\\s': '匹配空白字符',
          '\\S': '匹配非空白字符',
          '\\b': '匹配单词边界',
          '\\B': '匹配非单词边界',
          '\\t': '匹配制表符',
          '\\n': '匹配换行符',
          '\\r': '匹配回车符',
          '\\f': '匹配换页符',
          '\\v': '匹配垂直制表符',
          '\\\\': '匹配反斜杠',
        }
        if (esc[token.value]) {
          parts.push(esc[token.value])
        } else if (/^\\[1-9]$/.test(token.value)) {
          parts.push(`反向引用第 ${token.value[1]} 组`)
        } else {
          parts.push(`匹配 "${token.value[1]}"`)
        }
        break
      }
      case 'char-class':
        parts.push(`匹配字符集 ${token.value}`)
        break
      case 'neg-class':
        parts.push(`匹配不在 ${token.value} 中的字符`)
        break
      case 'quantifier': {
        const q = token.value.replace(/\?$/, '')
        const lazy = token.value.endsWith('?') ? '（惰性）' : ''
        if (q === '*') parts.push(`重复零次或多次${lazy}`)
        else if (q === '+') parts.push(`重复一次或多次${lazy}`)
        else if (q === '?') parts.push(`重复零次或一次${lazy}`)
        else {
          const m = q.match(/^\{(\d+)(,(\d*))?\}$/)
          if (m) {
            if (m[2] === undefined) {
              parts.push(`精确重复 ${m[1]} 次${lazy}`)
            } else if (m[3] === '') {
              parts.push(`重复 ${m[1]} 次及以上${lazy}`)
            } else {
              parts.push(`重复 ${m[1]} 到 ${m[3]} 次${lazy}`)
            }
          }
        }
        break
      }
      case 'backref':
        parts.push(`反向引用第 ${token.value[2]} 组`)
        break
    }
  }

  return parts.join('，') + '。'
}

// ===== 常用正则模板 =====
const templates = [
  {
    name: '邮箱',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    test: '联系我：test@example.com 或 admin@domain.org.cn',
  },
  {
    name: '手机号',
    pattern: '1[3-9]\\d{9}',
    flags: 'g',
    test: '电话：13812345678，备用：15999887766',
  },
  {
    name: 'URL',
    pattern: 'https?://[^\\s]+',
    flags: 'g',
    test: '访问 https://example.com 或 http://test.com/path?q=1 获取详情',
  },
  {
    name: 'IPv4 地址',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    flags: 'g',
    test: '服务器地址：192.168.1.1，网关：10.0.0.1，公网：8.8.8.8',
  },
  {
    name: '身份证号',
    pattern: '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]',
    flags: 'g',
    test: '张三：110101199003076531，李四：440301198812152019',
  },
  {
    name: '日期格式',
    pattern: '\\d{4}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    test: '创建：2024-01-15，更新：2024/12/31，过期：2025-06-30',
  },
  {
    name: 'HTML 标签',
    pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)</\\1>',
    flags: 'gs',
    test: '<div class="wrap"><p>段落一</p><span>文本</span></div>',
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    test: 'Hello 你好 World 世界 123 测试',
  },
]

function applyTemplate(tmpl: (typeof templates)[number]) {
  regexStr.value = tmpl.pattern
  testText.value = tmpl.test
  flags.value = new Set(tmpl.flags.split(''))
}

function resetAll() {
  regexStr.value = ''
  testText.value = ''
  flags.value = new Set(['g'])
}
</script>

<template>
  <ToolCard title="正则表达式测试器" description="实时匹配高亮、分组解析、常用正则模板">
    <div class="space-y-6">
      <!-- 正则输入 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="label-text flex items-center gap-2">
            <Regex class="h-3.5 w-3.5" />
            正则表达式
          </label>
          <div class="flex items-center gap-2">
            <span class="text-xs text-content-tertiary mr-1">Flags:</span>
            <button
              v-for="flag in flagOptions"
              :key="flag.key"
              @click="toggleFlag(flag.key)"
              :class="[
                'px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer',
                flags.has(flag.key)
                  ? 'bg-accent text-white'
                  : 'bg-surface-secondary text-content-tertiary hover:text-content-secondary border border-line',
              ]"
              :title="flag.desc"
            >
              {{ flag.label }}
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <div class="flex items-center flex-1 bg-surface-secondary rounded-xl border border-line focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
            <span class="pl-3 text-content-tertiary font-mono text-lg select-none">/</span>
            <input
              v-model="regexStr"
              class="flex-1 bg-transparent border-none outline-none py-3 px-1 font-mono text-content-primary placeholder:text-content-tertiary"
              placeholder="输入正则表达式..."
              spellcheck="false"
            />
            <span class="pr-1 text-content-tertiary font-mono text-lg select-none">/</span>
            <span class="pr-3 text-accent font-mono text-lg font-medium select-none">{{ flagStr }}</span>
          </div>
          <CopyButton :text="regexStr" label="复制" />
        </div>
        <!-- 错误提示 -->
        <div
          v-if="regexError"
          class="mt-2 flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
        >
          <AlertCircle class="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div class="text-sm text-red-600 dark:text-red-400">
            <span class="font-medium">语法错误：</span>{{ regexError }}
          </div>
        </div>
      </div>

      <!-- 测试文本 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="label-text">测试文本</label>
          <div v-if="matches.length > 0" class="flex items-center gap-1.5 text-xs">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
              <Hash class="h-3 w-3" />
              {{ matches.length }} 个匹配
            </span>
          </div>
        </div>
        <textarea
          v-model="testText"
          class="textarea-field w-full h-40 font-mono text-sm resize-y"
          placeholder="输入要测试的文本..."
          spellcheck="false"
        />
        <!-- 高亮预览 -->
        <div
          v-if="testText && matches.length > 0"
          class="mt-2 p-4 rounded-xl border border-line bg-surface-secondary overflow-x-auto"
        >
          <pre
            class="whitespace-pre-wrap break-all font-mono text-sm text-content-primary leading-relaxed"
            v-html="highlightedText"
          />
        </div>
      </div>

      <!-- 常用正则模板 -->
      <div>
        <label class="label-text flex items-center gap-2">
          <Zap class="h-3.5 w-3.5" />
          常用正则模板
        </label>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="tmpl in templates"
            :key="tmpl.name"
            @click="applyTemplate(tmpl)"
            class="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-secondary text-content-secondary hover:bg-surface-primary border border-line hover:border-accent/30 transition-all cursor-pointer"
          >
            {{ tmpl.name }}
          </button>
        </div>
      </div>

      <!-- 正则解释 -->
      <div v-if="regexStr && !regexError && explanation">
        <div
          class="flex items-center justify-between cursor-pointer mb-2"
          @click="showExplanation = !showExplanation"
        >
          <label class="label-text flex items-center gap-2 mb-0">
            <BookOpen class="h-3.5 w-3.5" />
            正则解释
          </label>
          <component
            :is="showExplanation ? ChevronUp : ChevronDown"
            class="h-4 w-4 text-content-tertiary"
          />
        </div>
        <div
          v-if="showExplanation"
          class="p-4 rounded-xl bg-accent-soft/50 border border-accent/20"
        >
          <p class="text-sm text-content-secondary leading-relaxed">{{ explanation }}</p>
        </div>
      </div>

      <!-- 匹配详情 -->
      <div v-if="matches.length > 0">
        <label class="label-text flex items-center gap-2">
          <Hash class="h-3.5 w-3.5" />
          匹配详情
        </label>
        <div class="mt-2 space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="(m, i) in matches"
            :key="i"
            class="rounded-xl border border-line bg-surface-secondary p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-accent/10 text-accent"
                  >
                    {{ i + 1 }}
                  </span>
                  <code
                    class="font-mono text-sm bg-accent-soft/60 text-content-primary px-1.5 py-0.5 rounded break-all"
                    >{{ m.text }}</code
                  >
                </div>
                <div class="text-xs text-content-tertiary mt-1">
                  位置：{{ m.index }} - {{ m.end }}（长度：{{ m.text.length }}）
                </div>
                <!-- 捕获组 -->
                <div v-if="m.groups" class="mt-2 space-y-1">
                  <div
                    v-for="(g, gi) in m.groups"
                    :key="gi"
                    class="flex items-center gap-2 text-xs"
                  >
                    <span class="text-content-tertiary">组 {{ Object.keys(g)[0] }}:</span>
                    <code class="font-mono bg-surface-primary px-1.5 py-0.5 rounded text-content-secondary break-all">{{
                      Object.values(g)[0] || 'undefined'
                    }}</code>
                  </div>
                </div>
              </div>
              <CopyButton :text="m.text" label="复制" />
            </div>
          </div>
        </div>
      </div>

      <!-- 无匹配提示 -->
      <div
        v-else-if="regexStr && !regexError && testText && matches.length === 0"
        class="flex items-center gap-2 p-4 rounded-xl border border-line bg-surface-secondary"
      >
        <AlertCircle class="h-4 w-4 text-content-tertiary shrink-0" />
        <span class="text-sm text-content-tertiary">没有找到匹配项</span>
      </div>

      <!-- 重置 -->
      <div class="flex justify-end">
        <button
          @click="resetAll"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <RotateCcw class="h-4 w-4" />
          重置
        </button>
      </div>

      <!-- 使用说明 -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">正则表达式语法速查</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-content-tertiary">
          <div><code class="font-mono text-content-secondary">.</code> 匹配任意字符</div>
          <div><code class="font-mono text-content-secondary">\d</code> 匹配数字</div>
          <div><code class="font-mono text-content-secondary">\w</code> 匹配字母/数字/下划线</div>
          <div><code class="font-mono text-content-secondary">\s</code> 匹配空白字符</div>
          <div><code class="font-mono text-content-secondary">^</code> 字符串开头</div>
          <div><code class="font-mono text-content-secondary">$</code> 字符串结尾</div>
          <div><code class="font-mono text-content-secondary">*</code> 零次或多次</div>
          <div><code class="font-mono text-content-secondary">+</code> 一次或多次</div>
          <div><code class="font-mono text-content-secondary">?</code> 零次或一次</div>
          <div><code class="font-mono text-content-secondary">{n,m}</code> n到m次</div>
          <div><code class="font-mono text-content-secondary">[abc]</code> 字符集</div>
          <div><code class="font-mono text-content-secondary">[^abc]</code> 排除字符集</div>
          <div><code class="font-mono text-content-secondary">(abc)</code> 捕获组</div>
          <div><code class="font-mono text-content-secondary">a|b</code> 或运算</div>
        </div>
      </div>
    </div>
  </ToolCard>
</template>
