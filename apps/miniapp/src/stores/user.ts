import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchMe, loginWithPhoneCode, loginWithPhoneWechatCode, sendPhoneLoginCode } from '../api/auth'
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

  function normalizePhone(phoneRaw: string): string {
    return phoneRaw.replace(/\D/g, '')
  }

  async function completeLogin(accessToken: string, userIdRaw: string) {
    setStoredToken(accessToken)
    userId.value = userIdRaw
    await loadProfile()
    uni.showToast({ title: '登录成功', icon: 'success' })
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
      await completeLogin(data.accessToken, data.user.id)
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

  async function sendOtherPhoneCode(phoneRaw: string) {
    const phone = normalizePhone(phoneRaw)
    if (!/^1\d{10}$/.test(phone)) {
      uni.showToast({ title: '请输入11位手机号', icon: 'none' })
      return false
    }
    try {
      const res = await sendPhoneLoginCode(phone)
      if (res.testCode) {
        uni.showModal({
          title: '开发测试验证码',
          content: `验证码：${res.testCode}`,
          showCancel: false,
          confirmText: '知道了',
        })
      }
      else {
        uni.showToast({ title: '验证码已发送', icon: 'none' })
      }
      return true
    }
    catch (e) {
      showLoginErrorDetail(normalizeLoginError(e))
      return false
    }
  }

  async function loginWithOtherPhone(phoneRaw: string, codeRaw: string) {
    const phone = normalizePhone(phoneRaw)
    const code = codeRaw.trim()
    if (!/^1\d{10}$/.test(phone)) {
      uni.showToast({ title: '请输入11位手机号', icon: 'none' })
      return false
    }
    if (code.length < 4) {
      uni.showToast({ title: '请输入验证码', icon: 'none' })
      return false
    }

    loading.value = true
    try {
      const data = await loginWithPhoneCode(phone, code)
      await completeLogin(data.accessToken, data.user.id)
      endLoginFlow()
      return true
    }
    catch (e) {
      clearSession()
      showLoginErrorDetail(normalizeLoginError(e))
      return false
    }
    finally {
      loading.value = false
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
    sendOtherPhoneCode,
    loginWithOtherPhone,
    endLoginFlow,
    loadProfile,
    clearSession,
    logout,
  }
})
