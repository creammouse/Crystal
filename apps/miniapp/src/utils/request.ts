import { getApiBaseUrl } from '../config'

const TOKEN_KEY = 'crystal_access_token'

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

export type ApiErrorBody = {
  message?: string | string[]
  statusCode?: number
}

export async function request<T>(options: {
  path: string
  method?: 'GET' | 'POST'
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

  return new Promise((resolve, reject) => {
    uni.request({
      url: joinUrl(path),
      method,
      data,
      header,
      success: (res) => {
        const status = res.statusCode ?? 0
        if (status >= 200 && status < 300) {
          resolve(res.data as T)
          return
        }
        const body = res.data as ApiErrorBody
        const raw = body?.message
        const msg = Array.isArray(raw) ? raw.join(',') : (raw || `HTTP ${status}`)
        reject(new Error(msg))
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}
