/** 后端 API 根地址；可在 `.env.development` / `.env.production` 中设置 `VITE_API_BASE_URL` */
export function getApiBaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL
  if (typeof v === 'string' && v.length > 0)
    return v.replace(/\/$/, '')
  return 'http://127.0.0.1:3000'
}

/** 展示头像：支持 https 外链或本地上传后的 `/uploads/...` 相对路径 */
export function resolveMediaUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl)
    return ''
  const s = pathOrUrl.trim()
  if (s.startsWith('http://') || s.startsWith('https://'))
    return s
  const base = getApiBaseUrl()
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`
}
