<template>
  <ToolCard title="调色板" description="使用调色板选择颜色，支持十六进制、RGB和HSL格式的转换">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <!-- 左侧：颜色选择器 -->
      <div class="lg:col-span-2 flex items-center justify-center">
        <div class="w-full max-w-[320px]">
          <ColorPicker v-model="selectedColor" />
        </div>
      </div>

      <!-- 右侧：颜色值和预览 -->
      <div class="lg:col-span-3 space-y-6">
        <!-- 颜色值显示 -->
        <div class="space-y-4">
          <div>
            <label class="label-text">十六进制</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                v-model="hexColor"
                class="input-field pr-16"
                @input="handleHexInput"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-1">
                <CopyButton :text="hexColor" label="" size="sm" />
              </div>
            </div>
          </div>
          <div>
            <label class="label-text">RGB</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                v-model="rgbColor"
                class="input-field pr-16"
                @input="handleRgbInput"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-1">
                <CopyButton :text="rgbColor" label="" size="sm" />
              </div>
            </div>
          </div>
          <div>
            <label class="label-text">HSL</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                v-model="hslColor"
                class="input-field pr-16"
                @input="handleHslInput"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-1">
                <CopyButton :text="hslColor" label="" size="sm" />
              </div>
            </div>
          </div>
        </div>

        <!-- 颜色预览 -->
        <div class="flex flex-col items-center justify-center p-6 border border-line rounded-lg">
          <div
            class="w-full h-48 rounded-lg mb-4 transition-colors duration-200"
            :style="{ backgroundColor: hexColor }"
          ></div>
          <div class="text-center">
            <p class="text-sm text-content-secondary">当前颜色</p>
            <p class="text-lg font-mono mt-1">{{ hexColor }}</p>
            <div class="mt-2">
              <CopyButton :text="hexColor" label="复制颜色" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolCard>

  <ToolCard title="渐变色生成工具" description="添加多个颜色点，设置位置和角度，生成CSS渐变色代码">
    <div class="space-y-6">
      <!-- 颜色列表 -->
      <div class="space-y-4">
        <div v-for="(color, index) in gradientColors" :key="index" class="flex items-center space-x-4">
          <div class="flex-1">
            <label class="label-text">颜色选择</label>
            <input
              type="color"
              :value="getOpaqueColor(color.value)"
              @input="updateColorValue(index, $event)"
              class="w-12 h-12 rounded cursor-pointer"
            />
          </div>
          <div class="flex-1">
            <label class="label-text">颜色值</label>
            <input
              type="text"
              v-model="color.value"
              class="input-field"
              placeholder="#RRGGBBAA 或 rgba(r,g,b,a)"
            />
          </div>
          <div class="flex-1">
            <label class="label-text">位置 (%)</label>
            <input
              type="number"
              v-model="color.stop"
              min="0"
              max="100"
              class="input-field"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="removeColor(index)"
              class="text-red-600 hover:text-red-500 cursor-pointer"
              title="删除此颜色点"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- 添加颜色按钮 -->
      <button
        @click="addColor"
        class="btn-primary"
      >
        添加颜色
      </button>

      <!-- 角度选择 -->
      <div>
        <label class="label-text">旋转角度</label>
        <div class="mt-1">
          <input
            type="range"
            v-model="gradientAngle"
            min="0"
            max="360"
            class="w-full h-2 bg-surface-tertiary rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-content-secondary mt-1">
            <span>0°</span>
            <span>{{ gradientAngle }}°</span>
            <span>360°</span>
          </div>
        </div>
      </div>

      <!-- 预览和代码 -->
      <div class="space-y-4">
        <div class="h-32 rounded-lg" :style="gradientStyle"></div>
        <div class="relative">
          <textarea
            v-model="gradientCode"
            class="textarea-field font-mono"
            rows="3"
            readonly
          ></textarea>
          <div class="absolute top-2 right-2">
            <CopyButton :text="gradientCode" label="" size="sm" />
          </div>
        </div>
      </div>
    </div>
  </ToolCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { parseToRgba, parseToHsla } from 'color2k'
import { TrashIcon } from '@heroicons/vue/24/outline'
import ColorPicker from '../components/ColorPicker.vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'

// 颜色选择器相关
const selectedColor = ref('#4F46E5ff')

// 渐变色相关
const gradientColors = ref([
  { value: '#ff0000', stop: 0 },
  { value: '#0000ff', stop: 100 }
])
const gradientAngle = ref(45)

// 添加颜色
const addColor = () => {
  gradientColors.value.push({ value: '#ffffff', stop: 50 })
}

// 移除颜色
const removeColor = (index: number) => {
  gradientColors.value.splice(index, 1)
}

// 计算渐变色样式
const gradientStyle = computed(() => {
  const stops = gradientColors.value
    .map(color => {
      try {
        const [r, g, b, a] = parseToRgba(color.value)
        return `rgba(${r}, ${g}, ${b}, ${a}) ${color.stop}%`
      } catch (e) {
        return `${color.value} ${color.stop}%`
      }
    })
    .join(', ')
  return {
    background: `linear-gradient(${gradientAngle.value}deg, ${stops})`
  }
})

// 计算渐变色代码
const gradientCode = computed(() => {
  const stops = gradientColors.value
    .map(color => {
      try {
        const [r, g, b, a] = parseToRgba(color.value)
        return `rgba(${r}, ${g}, ${b}, ${a}) ${color.stop}%`
      } catch (e) {
        return `${color.value} ${color.stop}%`
      }
    })
    .join(', ')
  return `background: linear-gradient(${gradientAngle.value}deg, ${stops});`
})

// 辅助函数：验证颜色值
const isValidColor = (color: string): boolean => {
  try {
    parseToRgba(color)
    return true
  } catch (e) {
    return false
  }
}

// 辅助函数：将颜色转换为十六进制格式
const toHexString = (r: number, g: number, b: number, a: number): string => {
  const rHex = Math.round(r).toString(16).padStart(2, '0')
  const gHex = Math.round(g).toString(16).padStart(2, '0')
  const bHex = Math.round(b).toString(16).padStart(2, '0')
  const aHex = Math.round(a * 255).toString(16).padStart(2, '0')
  return `#${rHex}${gHex}${bHex}${aHex}`
}

// 计算十六进制颜色值
const hexColor = computed(() => {
  try {
    const [r, g, b, a] = parseToRgba(selectedColor.value)
    return toHexString(r, g, b, a)
  } catch (e) {
    return '#ff0000ff'
  }
})

// 计算 RGB 颜色值
const rgbColor = computed(() => {
  try {
    const [r, g, b, a] = parseToRgba(selectedColor.value)
    return `rgba(${r}, ${g}, ${b}, ${a})`
  } catch (e) {
    return 'rgba(79, 70, 229, 1)'
  }
})

// 计算 HSL 颜色值
const hslColor = computed(() => {
  try {
    const [h, s, l, a] = parseToHsla(selectedColor.value)
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`
  } catch (e) {
    return 'hsl(0, 100%, 50%, 1)'
  }
})

// 处理十六进制输入
const handleHexInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.trim()

  // 检查是否是有效的十六进制颜色
  if (/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
    let hex = value
    if (!hex.startsWith('#')) {
      hex = '#' + hex
    }
    if (hex.length === 7) {
      hex = hex + 'ff'
    }

    if (isValidColor(hex)) {
      selectedColor.value = hex
    }
  }
}

// 处理 RGB 输入
const handleRgbInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const match = input.value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (match) {
    const [_, r, g, b, a = '1'] = match
    try {
      const color = `rgba(${r}, ${g}, ${b}, ${a})`
      if (isValidColor(color)) {
        const [rVal, gVal, bVal, aVal] = parseToRgba(color)
        selectedColor.value = toHexString(rVal, gVal, bVal, aVal)
      }
    } catch (e) {
      // 输入无效，不执行操作
    }
  }
}

// 处理 HSL 输入
const handleHslInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const match = input.value.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)$/)
  if (match) {
    const [_, h, s, l, a = '1'] = match
    try {
      const color = `hsla(${h}, ${s}%, ${l}%, ${a})`
      if (isValidColor(color)) {
        const [r, g, b, a] = parseToRgba(color)
        selectedColor.value = toHexString(r, g, b, a)
      }
    } catch (e) {
      // 输入无效，不执行操作
    }
  }
}

const getOpaqueColor = (color: string): string => {
  try {
    const [r, g, b] = parseToRgba(color)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch (e) {
    return color
  }
}

const updateColorValue = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const newColor = input.value
  const currentColor = gradientColors.value[index].value

  try {
    const [, , , a] = parseToRgba(currentColor)
    gradientColors.value[index].value = `rgba(${parseInt(newColor.slice(1, 3), 16)}, ${parseInt(newColor.slice(3, 5), 16)}, ${parseInt(newColor.slice(5, 7), 16)}, ${a})`
  } catch (e) {
    gradientColors.value[index].value = newColor
  }
}
</script>
