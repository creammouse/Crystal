import { getApiBaseUrl, isApiDebug } from '../config'

const TOKEN_KEY = 'crystal_access_token'

/** 与微信客户端默认接近；过短易误判为「一直转圈」 */
const REQUEST_TIMEOUT_MS = 60_000

function logApi(...parts: unknown[]) {
  if (isApiDebug())
    console.warn('[Crystal API]', ...parts)
}

function logApiFail(...parts: unknown[]) {
  console.warn('[Crystal API]', ...parts)
}

function pickFailMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const o = err as { errMsg?: unknown; message?: unknown }
    if (typeof o.errMsg === 'string' && o.errMsg)
      return o.errMsg
    if (typeof o.message === 'string' && o.message)
      return o.message
  }
  try {
    return JSON.stringify(err)
  }
  catch {
    return String(err)
  }
}

export function getStoredToken(): string {
  try {
    const t = uni.getStorageSync(TOKEN_KEY)
    return typeof t === 'string' ? t : ''
  }
  catch {
    return ''
  }
}

export function setStoredToken(token: string) {
  if (token)
    uni.setStorageSync(TOKEN_KEY, token)
  else
    uni.removeStorageSync(TOKEN_KEY)
}

function joinUrl(path: string) {
  const base = getApiBaseUrl()
  if (path.startsWith('http'))
    return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** 供 `uni.uploadFile` 等拼接与 `request` 一致的 API 根路径 */
export function buildApiUrl(path: string): string {
  return joinUrl(path)
}

export type ApiErrorBody = {
  message?: string | string[]
  statusCode?: number
}

export async function request<T>(options: {
  path: string
  method?: 'GET' | 'POST' | 'PATCH'
  data?: Record<string, unknown>
  /** 是否自动附带 Bearer token，默认 true */
  auth?: boolean
}): Promise<T> {
  const { path, method = 'GET', data, auth = true } = options
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (auth) {
    const token = getStoredToken()
    if (token)
      header.Authorization = `Bearer ${token}`
  }

  const url = joinUrl(path)
  const started = Date.now()
  const reqId = Math.random().toString(36).slice(2, 8)
  logApi(`→ [${reqId}]`, method, url)

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header,
      timeout: REQUEST_TIMEOUT_MS,
      success: (res) => {
        const ms = Date.now() - started
        const status = res.statusCode ?? 0
        logApi(`← [${reqId}]`, status, `${ms}ms`)
        if (status >= 200 && status < 300) {
          resolve(res.data as T)
          return
        }
        const body = res.data as ApiErrorBody
        const raw = body?.message
        const msg = Array.isArray(raw) ? raw.join(',') : (raw || `HTTP ${status}`)
        const detail = isApiDebug()
          ? `${msg} | ${method} ${url} | ${ms}ms`
          : msg
        reject(new Error(detail))
      },
      fail: (err) => {
        const ms = Date.now() - started
        const raw = pickFailMessage(err)
        logApiFail(`✗ [${reqId}]`, raw, `${ms}ms`, err)
        const hint = isApiDebug()
          ? `${raw} | ${method} ${url} | ${ms}ms`
          : `${raw}（${ms}ms）`
        reject(new Error(`网络请求失败：${hint}`))
      },
    })
  })
}
