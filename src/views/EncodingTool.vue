<script setup lang="ts">
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'

// 编码类型定义
interface EncodingType {
  id: string
  name: string
  description: string
  canDecode: boolean
  encode: (text: string) => string | Promise<string | { [key: string]: string }>
  decode?: (text: string) => string | Promise<string>
}

// 编码类型列表
const encodingTypes = ref<EncodingType[]>([
  {
    id: 'base64',
    name: 'Base64',
    description: '将二进制数据编码为ASCII字符',
    canDecode: true,
    encode: (text: string) => {
      try {
        return btoa(unescape(encodeURIComponent(text)))
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return decodeURIComponent(escape(atob(text)))
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'url',
    name: 'URL编码',
    description: '将URL中的特殊字符编码为%XX格式',
    canDecode: true,
    encode: (text: string) => {
      try {
        return encodeURIComponent(text)
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return decodeURIComponent(text)
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'html',
    name: 'HTML实体',
    description: '将HTML特殊字符转换为实体',
    canDecode: true,
    encode: (text: string) => {
      try {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        const div = document.createElement('div')
        div.innerHTML = text
        return div.textContent || ''
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'hex',
    name: '十六进制',
    description: '将文本转换为十六进制编码',
    canDecode: true,
    encode: (text: string) => {
      try {
        return Array.from(text)
          .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return text.replace(/([0-9A-Fa-f]{2})/g, (_, hex) => 
          String.fromCharCode(parseInt(hex, 16))
        )
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'binary',
    name: '二进制',
    description: '将文本转换为二进制编码',
    canDecode: true,
    encode: (text: string) => {
      try {
        return Array.from(text)
          .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
          .join(' ')
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return text.split(' ')
          .map(bin => String.fromCharCode(parseInt(bin, 2)))
          .join('')
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'ascii',
    name: 'ASCII码',
    description: '将文本转换为ASCII码',
    canDecode: true,
    encode: (text: string) => {
      try {
        return Array.from(text)
          .map(char => char.charCodeAt(0))
          .join(' ')
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return text.split(' ')
          .map(code => String.fromCharCode(parseInt(code)))
          .join('')
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'unicode',
    name: 'Unicode',
    description: '将文本转换为Unicode编码',
    canDecode: true,
    encode: (text: string) => {
      try {
        return Array.from(text)
          .map(char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'))
          .join('')
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return text.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => 
          String.fromCharCode(parseInt(hex, 16))
        )
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'rot13',
    name: 'ROT13',
    description: '将文本按字母表旋转13位',
    canDecode: true,
    encode: (text: string) => {
      try {
        return text.replace(/[a-zA-Z]/g, char => {
          const code = char.charCodeAt(0)
          const base = code >= 97 ? 97 : 65
          return String.fromCharCode(((code - base + 13) % 26) + base)
        })
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return text.replace(/[a-zA-Z]/g, char => {
          const code = char.charCodeAt(0)
          const base = code >= 97 ? 97 : 65
          return String.fromCharCode(((code - base + 13) % 26) + base)
        })
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'morse',
    name: '摩斯密码',
    description: '将文本转换为摩斯密码',
    canDecode: true,
    encode: (text: string) => {
      try {
        const morseCode: Record<string, string> = {
          'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
          'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
          'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
          'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
          'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
          'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
          '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
          '9': '----.', ' ': '/'
        }
        return text.toUpperCase().split('').map(char => morseCode[char] || char).join(' ')
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        const morseCode: Record<string, string> = {
          '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
          '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
          '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
          '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
          '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
          '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3',
          '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8',
          '----.': '9', '/': ' '
        }
        return text.split(' ').map(code => morseCode[code] || code).join('')
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'reverse',
    name: '反转文本',
    description: '将文本反转',
    canDecode: true,
    encode: (text: string) => {
      try {
        return text.split('').reverse().join('')
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    },
    decode: (text: string) => {
      try {
        return text.split('').reverse().join('')
      } catch (e) {
        return '解码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'md5',
    name: 'MD5',
    description: '生成MD5哈希值',
    canDecode: false,
    encode: (text: string) => {
      try {
        return CryptoJS.MD5(text).toString()
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'sha1',
    name: 'SHA-1',
    description: '生成SHA-1哈希值',
    canDecode: false,
    encode: (text: string) => {
      try {
        return CryptoJS.SHA1(text).toString()
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    description: '生成SHA-256哈希值',
    canDecode: false,
    encode: (text: string) => {
      try {
        return CryptoJS.SHA256(text).toString()
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    description: '生成SHA-512哈希值',
    canDecode: false,
    encode: (text: string) => {
      try {
        return CryptoJS.SHA512(text).toString()
      } catch (e) {
        return '编码错误: ' + (e as Error).message
      }
    }
  },
  {
    id: 'aes',
    name: 'AES',
    description: 'AES加密/解密',
    canDecode: true,
    encode: async (text: string) => {
      try {
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          encoded
        );
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        return {
          key: btoa(String.fromCharCode(...new Uint8Array(exportedKey))),
          iv: btoa(String.fromCharCode(...iv)),
          data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
        };
      } catch (e) {
        return '加密错误: ' + (e as Error).message;
      }
    },
    decode: async (text: string) => {
      try {
        const { key, iv, data } = JSON.parse(text);
        const keyData = Uint8Array.from(atob(key), c => c.charCodeAt(0));
        const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
        const encryptedData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        
        const importedKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM', length: 256 },
          true,
          ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: ivData },
          importedKey,
          encryptedData
        );
        
        return new TextDecoder().decode(decrypted);
      } catch (e) {
        return '解密错误: ' + (e as Error).message;
      }
    }
  },
  {
    id: 'hmac',
    name: 'HMAC',
    description: 'HMAC消息认证码',
    canDecode: false,
    encode: async (text: string) => {
      try {
        const key = await crypto.subtle.generateKey(
          { name: 'HMAC', hash: 'SHA-256' },
          true,
          ['sign']
        );
        const msgBuffer = new TextEncoder().encode(text);
        const signature = await crypto.subtle.sign(
          'HMAC',
          key,
          msgBuffer
        );
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        return {
          key: btoa(String.fromCharCode(...new Uint8Array(exportedKey))),
          signature: btoa(String.fromCharCode(...new Uint8Array(signature)))
        };
      } catch (e) {
        return 'HMAC错误: ' + (e as Error).message;
      }
    }
  },
  {
    id: 'pbkdf2',
    name: 'PBKDF2',
    description: 'PBKDF2密钥派生',
    canDecode: false,
    encode: async (text: string) => {
      try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(text),
          'PBKDF2',
          false,
          ['deriveBits']
        );
        const derivedKey = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          key,
          256
        );
        return {
          salt: btoa(String.fromCharCode(...salt)),
          key: btoa(String.fromCharCode(...new Uint8Array(derivedKey)))
        };
      } catch (e) {
        return 'PBKDF2错误: ' + (e as Error).message;
      }
    }
  }
])

// 输入文本
const inputText = ref('')
// 输出文本
const outputText = ref('')
// 当前选择的编码类型
const selectedEncoding = ref(encodingTypes.value[0].id)
// 当前操作模式（编码/解码）
const isEncoding = ref(true)

// 获取当前选择的编码类型对象
const currentEncoding = computed(() => {
  return encodingTypes.value.find(type => type.id === selectedEncoding.value) || encodingTypes.value[0]
})

// 执行编码/解码操作
const processText = async () => {
  if (isEncoding.value) {
    outputText.value = await currentEncoding.value.encode(inputText.value) as string;
  } else if (currentEncoding.value.canDecode && currentEncoding.value.decode) {
    outputText.value = await currentEncoding.value.decode(inputText.value);
  } else {
    outputText.value = '当前编码类型不支持解码';
  }
}

// 清空输入和输出
const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
}

// 切换编码/解码模式
const toggleMode = () => {
  isEncoding.value = !isEncoding.value
  processText()
}
</script>

<template>
  <ToolCard title="编码转换" description="支持多种编码格式的编码和解码功能">

    <div class="space-y-6">
      <!-- 编码类型选择 -->
      <div class="space-y-4">
        <div>
          <label class="label-text">编码类型</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <select
              v-model="selectedEncoding"
              @change="processText"
              class="select-field"
            >
              <option v-for="type in encodingTypes" :key="type.id" :value="type.id">
                {{ type.name }} - {{ type.description }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 操作模式切换 -->
      <div class="space-y-4">
        <div>
          <label class="label-text">操作模式</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <div class="flex gap-2">
              <button
                @click="toggleMode"
                class="btn-primary whitespace-nowrap"
              >
                {{ isEncoding ? '切换到解码' : '切换到编码' }}
              </button>
              <button
                @click="clearAll"
                class="btn-secondary whitespace-nowrap"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="space-y-4">
        <div>
          <label class="label-text">输入文本</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <textarea
              v-model="inputText"
              @input="processText"
              rows="4"
              class="textarea-field"
              :placeholder="isEncoding ? '请输入要编码的文本' : '请输入要解码的文本'"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div>
          <label class="label-text">输出结果</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <div class="relative">
              <textarea
                v-model="outputText"
                rows="4"
                readonly
                class="textarea-field bg-surface-secondary"
              ></textarea>
              <div v-if="outputText" class="absolute top-2 right-2">
                <CopyButton :text="outputText" label="复制结果" size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </ToolCard>
</template> 