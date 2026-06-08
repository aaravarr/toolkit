<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import * as Diff from 'diff'

type ViewMode = 'split' | 'unified'

interface TextSegment {
  text: string
  highlight: boolean
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'empty'
  content: string
  oldLineNum: number | null
  newLineNum: number | null
  highlights?: { start: number; end: number }[]
}

interface DiffLinePair {
  left: DiffLine
  right: DiffLine
  hunkId: number // -1 表示未变化行
}

interface HunkRange {
  start: number
  end: number
}

const leftText = ref('')
const rightText = ref('')
const viewMode = ref<ViewMode>('split')
const showDiff = ref(false)
const currentHunkIdx = ref(0)

// ── 辅助函数 ──────────────────────────────────────────────

function splitByHighlights(content: string, highlights: { start: number; end: number }[]): TextSegment[] {
  const segments: TextSegment[] = []
  let pos = 0
  for (const h of highlights) {
    if (h.start > pos) {
      segments.push({ text: content.slice(pos, h.start), highlight: false })
    }
    segments.push({ text: content.slice(h.start, h.end), highlight: true })
    pos = h.end
  }
  if (pos < content.length) {
    segments.push({ text: content.slice(pos), highlight: false })
  }
  return segments
}

function computeInlineHighlights(
  oldLine: string,
  newLine: string,
  side: 'left' | 'right'
): { start: number; end: number }[] {
  const charDiff = Diff.diffChars(oldLine, newLine)
  const ranges: { start: number; end: number }[] = []
  let pos = 0
  for (const part of charDiff) {
    if (side === 'left' && part.removed) {
      ranges.push({ start: pos, end: pos + part.value.length })
    } else if (side === 'right' && part.added) {
      ranges.push({ start: pos, end: pos + part.value.length })
    }
    if (!(side === 'left' && part.added) && !(side === 'right' && part.removed)) {
      pos += part.value.length
    }
  }
  return ranges
}

// ── Diff 计算 ─────────────────────────────────────────────

const diffResult = computed(() => {
  if (!showDiff.value) return { pairs: [] as DiffLinePair[], lines: [] as DiffLine[], stats: { added: 0, removed: 0 }, hunkRanges: [] as HunkRange[] }

  const oldLines = leftText.value.split('\n')
  const newLines = rightText.value.split('\n')
  const lineDiff = Diff.diffArrays(oldLines, newLines)

  const pairs: DiffLinePair[] = []
  const unifiedLines: DiffLine[] = []
  let oldLineNum = 1
  let newLineNum = 1
  let added = 0
  let removed = 0

  let pendingRemoved: { content: string; lineNum: number }[] = []
  let pendingAdded: { content: string; lineNum: number }[] = []

  const flushPending = () => {
    const maxLen = Math.max(pendingRemoved.length, pendingAdded.length)
    for (let i = 0; i < maxLen; i++) {
      const rem = i < pendingRemoved.length ? pendingRemoved[i] : null
      const add = i < pendingAdded.length ? pendingAdded[i] : null

      let leftHighlights: { start: number; end: number }[] = []
      let rightHighlights: { start: number; end: number }[] = []
      if (rem && add) {
        leftHighlights = computeInlineHighlights(rem.content, add.content, 'left')
        rightHighlights = computeInlineHighlights(rem.content, add.content, 'right')
      }

      const leftLine: DiffLine = rem
        ? { type: 'removed', content: rem.content, oldLineNum: rem.lineNum, newLineNum: null, highlights: leftHighlights }
        : { type: 'empty', content: '', oldLineNum: null, newLineNum: null }
      const rightLine: DiffLine = add
        ? { type: 'added', content: add.content, oldLineNum: null, newLineNum: add.lineNum, highlights: rightHighlights }
        : { type: 'empty', content: '', oldLineNum: null, newLineNum: null }

      pairs.push({ left: leftLine, right: rightLine, hunkId: -1 })
      unifiedLines.push(leftLine)
      if (rightLine.type !== 'empty' || leftLine.type === 'empty') {
        unifiedLines.push(rightLine)
      }
    }
    pendingRemoved = []
    pendingAdded = []
  }

  for (const part of lineDiff) {
    if (part.removed) {
      for (const line of part.value) {
        pendingRemoved.push({ content: line, lineNum: oldLineNum++ })
        removed++
      }
      continue
    }
    if (part.added) {
      for (const line of part.value) {
        pendingAdded.push({ content: line, lineNum: newLineNum++ })
        added++
      }
      continue
    }
    flushPending()
    for (const line of part.value) {
      const dl: DiffLine = { type: 'unchanged', content: line, oldLineNum: oldLineNum++, newLineNum: newLineNum++ }
      pairs.push({ left: dl, right: dl, hunkId: -1 })
      unifiedLines.push(dl)
    }
  }
  flushPending()

  // 计算 hunk 范围并标记 hunkId
  const hunkRanges: HunkRange[] = []
  let hunkStart = -1
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].left.type !== 'unchanged') {
      if (hunkStart === -1) hunkStart = i
    } else {
      if (hunkStart !== -1) {
        hunkRanges.push({ start: hunkStart, end: i - 1 })
        hunkStart = -1
      }
    }
  }
  if (hunkStart !== -1) {
    hunkRanges.push({ start: hunkStart, end: pairs.length - 1 })
  }
  for (let h = 0; h < hunkRanges.length; h++) {
    for (let i = hunkRanges[h].start; i <= hunkRanges[h].end; i++) {
      pairs[i].hunkId = h
    }
  }

  return { pairs, lines: unifiedLines, stats: { added, removed }, hunkRanges }
})

// ── 安全的 hunk 索引 ─────────────────────────────────────

const safeHunkIdx = computed(() => {
  const count = diffResult.value.hunkRanges.length
  if (count === 0) return -1
  return Math.max(0, Math.min(currentHunkIdx.value, count - 1))
})

// ── 导航 ─────────────────────────────────────────────────

function scrollToPair(pairIdx: number) {
  nextTick(() => {
    const el = document.querySelector(`[data-pair-idx="${pairIdx}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function prevHunk() {
  if (safeHunkIdx.value > 0) {
    currentHunkIdx.value = safeHunkIdx.value - 1
    scrollToPair(diffResult.value.hunkRanges[currentHunkIdx.value].start)
  }
}

function nextHunk() {
  if (safeHunkIdx.value < diffResult.value.hunkRanges.length - 1) {
    currentHunkIdx.value = safeHunkIdx.value + 1
    scrollToPair(diffResult.value.hunkRanges[currentHunkIdx.value].start)
  }
}

// ── 合并操作（按 hunk 整块合并）──────────────────────────

function mergeHunkToRight(hunkId: number) {
  const { pairs } = diffResult.value
  const newRightLines: string[] = []

  for (const pair of pairs) {
    if (pair.hunkId === hunkId) {
      // 属于当前 hunk：以左为准，写入右侧
      if (pair.left.type !== 'empty') {
        newRightLines.push(pair.left.content)
      }
    } else {
      // 不属于当前 hunk：保持右侧不变
      if (pair.right.type !== 'empty') {
        newRightLines.push(pair.right.content)
      }
    }
  }

  rightText.value = newRightLines.join('\n')
  currentHunkIdx.value = 0
}

function mergeHunkToLeft(hunkId: number) {
  const { pairs } = diffResult.value
  const newLeftLines: string[] = []

  for (const pair of pairs) {
    if (pair.hunkId === hunkId) {
      // 属于当前 hunk：以右为准，写入左侧
      if (pair.right.type !== 'empty') {
        newLeftLines.push(pair.right.content)
      }
    } else {
      // 不属于当前 hunk：保持左侧不变
      if (pair.left.type !== 'empty') {
        newLeftLines.push(pair.left.content)
      }
    }
  }

  leftText.value = newLeftLines.join('\n')
  currentHunkIdx.value = 0
}

// ── 操作 ─────────────────────────────────────────────────

function doDiff() {
  showDiff.value = true
  currentHunkIdx.value = 0
}

function clearAll() {
  leftText.value = ''
  rightText.value = ''
  showDiff.value = false
  currentHunkIdx.value = 0
}

function swapSides() {
  const tmp = leftText.value
  leftText.value = rightText.value
  rightText.value = tmp
  if (showDiff.value) {
    showDiff.value = false
    nextTick(() => { showDiff.value = true })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div class="bg-surface-primary shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-base font-semibold leading-6 text-content-primary">文本对比</h3>
        <div class="mt-2 max-w-xl text-sm text-content-secondary">
          <p>粘贴两段文本，以代码 diff 形式展示差异，支持行内级别字符高亮、变更块跳转和左右合并。</p>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="bg-surface-primary shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label class="label-text">原始文本</label>
            <textarea
              v-model="leftText"
              rows="12"
              class="textarea-field font-mono resize-y"
              placeholder="粘贴原始文本..."
            ></textarea>
          </div>
          <div>
            <label class="label-text">修改后文本</label>
            <textarea
              v-model="rightText"
              rows="12"
              class="textarea-field font-mono resize-y"
              placeholder="粘贴修改后文本..."
            ></textarea>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            @click="doDiff"
            class="btn-primary"
          >
            对比
          </button>
          <button
            @click="swapSides"
            class="btn-secondary"
          >
            交换两侧
          </button>
          <button
            @click="clearAll"
            class="btn-secondary"
          >
            清空
          </button>

          <div class="ml-auto flex items-center gap-2">
            <div class="inline-flex rounded-md shadow-sm" role="group">
              <button
                @click="viewMode = 'split'"
                :class="[
                  'px-4 py-2 text-sm font-medium border rounded-l-lg',
                  viewMode === 'split'
                    ? 'btn-primary !rounded-l-lg !rounded-r-none'
                    : 'btn-secondary !rounded-l-lg !rounded-r-none'
                ]"
              >
                分屏
              </button>
              <button
                @click="viewMode = 'unified'"
                :class="[
                  'px-4 py-2 text-sm font-medium border rounded-r-lg -ml-px',
                  viewMode === 'unified'
                    ? 'btn-primary !rounded-r-lg !rounded-l-none'
                    : 'btn-secondary !rounded-r-lg !rounded-l-none'
                ]"
              >
                统一
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计 + 导航栏（吸顶） -->
    <div v-if="showDiff && (diffResult.stats.added > 0 || diffResult.stats.removed > 0)" class="bg-surface-primary shadow sm:rounded-lg sticky top-0 z-20">
      <div class="px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <!-- 左侧：统计 -->
        <div class="flex items-center gap-4">
          <span class="font-medium text-content-secondary">变更统计：</span>
          <span class="text-green-600 dark:text-green-400 font-mono">+{{ diffResult.stats.added }}</span>
          <span class="text-red-600 dark:text-red-400 font-mono">-{{ diffResult.stats.removed }}</span>
        </div>
        <!-- 右侧：hunk 导航 -->
        <div v-if="diffResult.hunkRanges.length > 0" class="flex items-center gap-2">
          <button
            @click="prevHunk"
            :disabled="safeHunkIdx <= 0"
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border',
              safeHunkIdx <= 0
                ? 'text-content-tertiary border-line cursor-not-allowed'
                : 'btn-secondary !text-xs !px-2.5 !py-1.5'
            ]"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
            上一处
          </button>
          <span class="text-content-secondary font-mono min-w-[4rem] text-center">
            {{ safeHunkIdx + 1 }} / {{ diffResult.hunkRanges.length }}
          </span>
          <button
            @click="nextHunk"
            :disabled="safeHunkIdx >= diffResult.hunkRanges.length - 1"
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border',
              safeHunkIdx >= diffResult.hunkRanges.length - 1
                ? 'text-content-tertiary border-line cursor-not-allowed'
                : 'btn-secondary !text-xs !px-2.5 !py-1.5'
            ]"
          >
            下一处
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 分屏 diff 视图 -->
    <div v-if="showDiff && viewMode === 'split'" class="bg-surface-primary shadow overflow-hidden">
      <table class="diff-table diff-table-split w-full border-collapse text-sm font-mono">
        <tbody>
          <tr
            v-for="(pair, idx) in diffResult.pairs"
            :key="idx"
            :data-pair-idx="idx"
            :class="['diff-row', pair.hunkId === safeHunkIdx && pair.hunkId >= 0 ? 'diff-row-current-hunk' : '']"
          >
            <!-- 左侧行号 -->
            <td class="diff-line-num" :class="'diff-line-num-' + pair.left.type">
              <span v-if="pair.left.oldLineNum !== null">{{ pair.left.oldLineNum }}</span>
            </td>
            <!-- 左侧内容 -->
            <td :class="'diff-content-cell diff-content-' + pair.left.type">
              <div class="diff-scroll">
                <span v-if="pair.left.type === 'empty'" class="diff-empty-placeholder">&nbsp;</span>
                <template v-else-if="pair.left.highlights && pair.left.highlights.length > 0">
                  <template v-for="(segment, si) in splitByHighlights(pair.left.content, pair.left.highlights)" :key="si">
                    <span v-if="segment.highlight" class="diff-inline-highlight-removed">{{ segment.text }}</span>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </template>
                <template v-else>{{ pair.left.content }}</template>
              </div>
            </td>
            <!-- 分隔列 + 合并按钮 -->
            <td :class="pair.hunkId >= 0 ? 'diff-separator diff-separator-active' : 'diff-separator'">
              <div v-if="pair.hunkId >= 0 && idx === diffResult.hunkRanges[pair.hunkId].start" class="diff-merge-actions">
                <button
                  @click.stop="mergeHunkToRight(pair.hunkId)"
                  class="diff-merge-btn"
                  title="以左为准，合并整个变更块到右侧"
                >→</button>
                <button
                  @click.stop="mergeHunkToLeft(pair.hunkId)"
                  class="diff-merge-btn"
                  title="以右为准，合并整个变更块到左侧"
                >←</button>
              </div>
            </td>
            <!-- 右侧行号 -->
            <td class="diff-line-num" :class="'diff-line-num-' + pair.right.type">
              <span v-if="pair.right.newLineNum !== null">{{ pair.right.newLineNum }}</span>
            </td>
            <!-- 右侧内容 -->
            <td :class="'diff-content-cell diff-content-' + pair.right.type">
              <div class="diff-scroll">
                <span v-if="pair.right.type === 'empty'" class="diff-empty-placeholder">&nbsp;</span>
                <template v-else-if="pair.right.highlights && pair.right.highlights.length > 0">
                  <template v-for="(segment, si) in splitByHighlights(pair.right.content, pair.right.highlights)" :key="si">
                    <span v-if="segment.highlight" class="diff-inline-highlight-added">{{ segment.text }}</span>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </template>
                <template v-else>{{ pair.right.content }}</template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 统一 diff 视图 -->
    <div v-if="showDiff && viewMode === 'unified'" class="bg-surface-primary shadow overflow-hidden">
      <table class="diff-table diff-table-unified w-full border-collapse text-sm font-mono">
        <tbody>
          <tr
            v-for="(line, idx) in diffResult.lines"
            :key="idx"
            :data-pair-idx="idx"
            :class="['diff-row']"
          >
            <td class="diff-line-num" :class="'diff-line-num-' + line.type">
              <span v-if="line.oldLineNum !== null">{{ line.oldLineNum }}</span>
            </td>
            <td class="diff-line-num" :class="'diff-line-num-' + line.type">
              <span v-if="line.newLineNum !== null">{{ line.newLineNum }}</span>
            </td>
            <td class="diff-prefix" :class="'diff-prefix-' + line.type">
              <span v-if="line.type === 'added'">+</span>
              <span v-else-if="line.type === 'removed'">-</span>
              <span v-else>&nbsp;</span>
            </td>
            <td :class="'diff-content-cell diff-content-' + line.type">
              <div class="diff-scroll">
                <template v-if="line.highlights && line.highlights.length > 0">
                  <template v-for="(segment, si) in splitByHighlights(line.content, line.highlights)" :key="si">
                    <span v-if="segment.highlight" :class="line.type === 'added' ? 'diff-inline-highlight-added' : 'diff-inline-highlight-removed'">{{ segment.text }}</span>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </template>
                <template v-else>{{ line.content }}</template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* ── 表格基础 ────────────────────────────── */
.diff-table {
  line-height: 1.5;
  border-spacing: 0;
}

.diff-table-split,
.diff-table-unified {
  table-layout: fixed;
}

.diff-row {
  border: none;
}

.diff-line-num {
  width: 60px;
  min-width: 60px;
  padding: 0 10px;
  text-align: right;
  vertical-align: top;
  user-select: none;
  border-right: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
}

.diff-separator {
  width: 1px;
  background-color: var(--border);
  padding: 0;
  vertical-align: middle;
}

.diff-separator-active {
  width: 44px;
  min-width: 44px;
  background-color: var(--bg-secondary);
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

.diff-content-cell {
  padding: 0;
  vertical-align: top;
  overflow: hidden;
}

.diff-scroll {
  white-space: pre-wrap;
  word-break: break-all;
  padding: 0 12px;
}

.diff-prefix {
  width: 24px;
  min-width: 24px;
  padding: 0 4px 0 8px;
  text-align: center;
  vertical-align: top;
  user-select: none;
  font-weight: 600;
}

.diff-empty-placeholder {
  display: inline-block;
}

/* ── 行样式 — 删除 ──────────────────────── */
.diff-line-num-removed {
  background-color: #ffebe9;
  color: #a40e26;
}
.diff-content-removed {
  background-color: #ffebe9;
  color: #24292f;
}
.diff-prefix-removed {
  background-color: #ffebe9;
  color: #a40e26;
}

:deep(.dark) .diff-line-num-removed {
  background-color: rgba(248, 81, 73, 0.15);
  color: #f85149;
}
:deep(.dark) .diff-content-removed {
  background-color: rgba(248, 81, 73, 0.1);
  color: #e6edf3;
}
:deep(.dark) .diff-prefix-removed {
  background-color: rgba(248, 81, 73, 0.15);
  color: #f85149;
}

/* ── 行样式 — 添加 ──────────────────────── */
.diff-line-num-added {
  background-color: #dafbe1;
  color: #116329;
}
.diff-content-added {
  background-color: #dafbe1;
  color: #24292f;
}
.diff-prefix-added {
  background-color: #dafbe1;
  color: #116329;
}

:deep(.dark) .diff-line-num-added {
  background-color: rgba(46, 160, 67, 0.15);
  color: #3fb950;
}
:deep(.dark) .diff-content-added {
  background-color: rgba(46, 160, 67, 0.1);
  color: #e6edf3;
}
:deep(.dark) .diff-prefix-added {
  background-color: rgba(46, 160, 67, 0.15);
  color: #3fb950;
}

/* ── 行样式 — 未变化 ────────────────────── */
.diff-line-num-unchanged {
  background-color: var(--bg-primary);
}
.diff-content-unchanged {
  background-color: var(--bg-primary);
}

/* ── 行样式 — 空占位 ────────────────────── */
.diff-line-num-empty {
  background-color: var(--bg-secondary);
}
.diff-content-empty {
  background-color: var(--bg-secondary);
}

/* ── 当前 hunk 高亮 ─────────────────────── */
.diff-row-current-hunk td {
  box-shadow: inset 3px 0 0 var(--accent);
}

/* ── 合并按钮 ───────────────────────────── */
.diff-merge-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 2px 0;
}

.diff-merge-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}

.diff-merge-btn:hover {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

/* ── 行内字符级高亮 ─────────────────────── */
:deep(.diff-inline-highlight-removed) {
  background-color: #ffc1ba;
  color: #24292f;
  border-radius: 2px;
  padding: 1px 0;
}

:deep(.dark) :deep(.diff-inline-highlight-removed) {
  background-color: rgba(248, 81, 73, 0.3);
  color: #e6edf3;
}

:deep(.diff-inline-highlight-added) {
  background-color: #8fdbb1;
  color: #24292f;
  border-radius: 2px;
  padding: 1px 0;
}

:deep(.dark) :deep(.diff-inline-highlight-added) {
  background-color: rgba(46, 160, 67, 0.3);
  color: #e6edf3;
}

.diff-prefix + .diff-content-cell {
  padding-left: 0;
}
</style>
