/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** 为 true 时登录/请求失败弹窗会附带完整请求 URL，便于真机排查 */
  readonly VITE_API_DEBUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
