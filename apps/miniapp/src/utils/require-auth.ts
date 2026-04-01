import { useUserStore } from '../stores/user'

const AUTH_MENU_KEYS = new Set([
  'designs',
  'cart',
  'orders',
  'addresses',
  'favorites',
])

export function menuNeedsAuth(key: string): boolean {
  return AUTH_MENU_KEYS.has(key)
}

/**
 * 未登录时弹窗询问；用户确认后打开登录弹层并完成手机号快捷登录（见 `stores/user.ensureLogin`）。
 */
export async function ensureLoggedInForFeature(): Promise<boolean> {
  const store = useUserStore()
  if (store.isLoggedIn)
    return true

  return await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '需要登录',
      content: '使用该功能需要先完成登录',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) {
          resolve(false)
          return
        }
        void store.ensureLogin().then(() => {
          resolve(store.isLoggedIn)
        })
      },
    })
  })
}
