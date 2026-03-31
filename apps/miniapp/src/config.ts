/** 后端 API 根地址；可在 `.env.development` 中设置 `VITE_API_BASE_URL` */
export function getApiBaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL
  if (typeof v === 'string' && v.length > 0)
    return v.replace(/\/$/, '')
  return 'http://127.0.0.1:3000'
}
