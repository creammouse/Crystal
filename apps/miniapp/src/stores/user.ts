import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchMe, loginWithPhoneWechatCode } from '../api/auth'
import { getStoredToken, setStoredToken } from '../utils/request'

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length >= 11)
    return `${d.slice(0, 3)}****${d.slice(-4)}`
  if (d.length >= 7)
    return phone
  return phone
}

export const useUserStore = defineStore('user', () => {
  const userId = ref('')
  /** 展示用昵称：资料昵称或脱敏手机号 */
  const nickname = ref('未登录')
  const avatarUrl = ref('')
  const loading = ref(false)
  const loginSheetVisible = ref(false)

  let pendingEnsureLoginResolve: (() => void) | null = null

  const isLoggedIn = computed(() => Boolean(userId.value))

  function normalizeLoginError(e: unknown): string {
    if (e instanceof Error && e.message)
      return e.message
    if (typeof e === 'string' && e)
      return e
    if (e && typeof e === 'object') {
      const maybe = e as {
        errMsg?: unknown
        message?: unknown
        statusCode?: unknown
        data?: unknown
      }
      if (typeof maybe.errMsg === 'string' && maybe.errMsg)
        return maybe.errMsg
      if (typeof maybe.message === 'string' && maybe.message)
        return maybe.message
      if (maybe.data && typeof maybe.data === 'object') {
        const data = maybe.data as { message?: unknown }
        if (typeof data.message === 'string' && data.message)
          return data.message
      }
      if (typeof maybe.statusCode === 'number')
        return `请求失败（HTTP ${maybe.statusCode}）`
    }
    return '未知错误'
  }

  function showLoginErrorDetail(detail: string) {
    uni.showModal({
      title: '登录失败',
      content: `原因：${detail}`,
      showCancel: false,
      confirmText: '知道了',
    })
  }

  function clearSession() {
    userId.value = ''
    nickname.value = '未登录'
    avatarUrl.value = ''
    setStoredToken('')
  }

  function logout() {
    clearSession()
    uni.showToast({ title: '已退出登录', icon: 'none' })
  }

  function endLoginFlow() {
    loginSheetVisible.value = false
    pendingEnsureLoginResolve?.()
    pendingEnsureLoginResolve = null
  }

  /**
   * 仅在有本地 token 时请求 /auth/me，用于冷启动恢复登录态。
   */
  async function tryRestoreSession() {
    if (!getStoredToken()) {
      clearSession()
      return
    }
    try {
      await loadProfile()
    }
    catch {}
  }

  /**
   * 需要登录时弹出登录弹层；用户完成或取消后结束。
   */
  async function ensureLogin() {
    if (isLoggedIn.value)
      return
    return new Promise<void>((resolve) => {
      pendingEnsureLoginResolve = resolve
      loginSheetVisible.value = true
    })
  }

  /**
   * 微信「手机号快捷登录」：getPhoneNumber 回调中的 detail。
   */
  async function handlePhoneLoginDetail(detail: {
    errMsg?: string
    code?: string
  }) {
    const errMsg = detail.errMsg ?? ''
    if (errMsg !== 'getPhoneNumber:ok') {
      uni.showToast({
        title: errMsg.includes('deny') ? '已取消授权' : '未授权手机号',
        icon: 'none',
      })
      endLoginFlow()
      return
    }
    const code = detail.code
    if (!code) {
      uni.showToast({ title: '请升级微信版本后重试', icon: 'none' })
      endLoginFlow()
      return
    }
    loading.value = true
    try {
      const data = await loginWithPhoneWechatCode(code)
      setStoredToken(data.accessToken)
      userId.value = data.user.id
      await loadProfile()
      uni.showToast({ title: '登录成功', icon: 'success' })
    }
    catch (e) {
      console.error(e)
      clearSession()
      showLoginErrorDetail(normalizeLoginError(e))
    }
    finally {
      loading.value = false
      endLoginFlow()
    }
  }

  async function loadProfile() {
    if (!getStoredToken()) {
      clearSession()
      return
    }
    try {
      const me = await fetchMe()
      userId.value = me.id
      nickname.value = me.nickname?.trim() || maskPhone(me.phone ?? '') || '手机用户'
      avatarUrl.value = me.avatarUrl?.trim() || ''
    }
    catch (e) {
      clearSession()
      throw e
    }
  }

  return {
    userId,
    nickname,
    avatarUrl,
    loading,
    isLoggedIn,
    loginSheetVisible,
    tryRestoreSession,
    ensureLogin,
    handlePhoneLoginDetail,
    endLoginFlow,
    loadProfile,
    clearSession,
    logout,
  }
})
