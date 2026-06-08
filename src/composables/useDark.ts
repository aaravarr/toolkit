import { ref, watch } from 'vue'

const isDark = ref(false)

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getStoredPreference(): boolean | null {
  const stored = localStorage.getItem('toolkit-dark-mode')
  if (stored === null) return null
  return stored === 'true'
}

function applyTheme(dark: boolean) {
  const html = document.documentElement
  if (dark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

// Initialize
const stored = getStoredPreference()
isDark.value = stored !== null ? stored : getSystemPreference()
applyTheme(isDark.value)

// Listen for system preference changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (getStoredPreference() === null) {
      isDark.value = e.matches
    }
  })
}

watch(isDark, (value) => {
  applyTheme(value)
  localStorage.setItem('toolkit-dark-mode', String(value))
})

export function useDark() {
  const toggle = () => {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
