import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  changeBoundPhoneWithWechat as changeBoundPhoneWithWechatApi,
  fetchMe,
  loginWithPhoneWechatCode,
} from '../api/auth'
import { maskPhone } from '../utils/mask-phone'
import { getStoredToken, setStoredToken } from '../utils/request'

export type RealtimePhoneDetail = {
  errMsg?: string
  code?: string
  errno?: number
}

function consumeRealtimePhoneCode(detail?: RealtimePhoneDetail): string | null {
  if (!detail) {
    uni.showToast({ title: '验证失败', icon: 'none' })
    return null
  }
  const errMsg = detail.errMsg ?? ''
  if (errMsg !== 'getRealtimePhoneNumber:ok') {
    if (detail.errno === 1400001) {
      uni.showToast({
        title: '验证次数已达上限，请稍后再试',
        icon: 'none',
      })
    }
    else {
      uni.showToast({
        title:
          errMsg.includes('deny') || errMsg.includes('cancel')
            ? '已取消'
            : '手机号验证失败',
        icon: 'none',
      })
    }
    return null
  }
  const code = detail.code?.trim()
  if (!code) {
    uni.showToast({ title: '请升级微信版本后重试', icon: 'none' })
    return null
  }
  return code
}

export const useUserStore = defineStore('user', () => {
  const userId = ref('')
  /** 展示用昵称：资料昵称或脱敏手机号 */
  const nickname = ref('未登录')
  /** 资料里的昵称（可空），用于编辑表单 */
  const profileNickname = ref('')
  const phone = ref('')
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
    profileNickname.value = ''
    phone.value = ''
    avatarUrl.value = ''
    setStoredToken('')
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

  /**
   * 微信「手机号实时验证」：getRealtimePhoneNumber → 其他手机号登录。
   * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getRealtimePhoneNumber.html
   */
  async function handleRealtimePhoneLoginDetail(detail?: RealtimePhoneDetail) {
    const code = consumeRealtimePhoneCode(detail)
    if (!code) {
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

  /**
   * 已登录：实时验证组件换绑手机号。
   */
  async function changeBoundPhoneWithWechat(codeRaw: string) {
    const code = codeRaw.trim()
    if (!code) {
      uni.showToast({ title: '未获取到授权', icon: 'none' })
      return false
    }
    loading.value = true
    try {
      const me = await changeBoundPhoneWithWechatApi(code)
      phone.value = me.phone?.replace(/\s/g, '') ?? ''
      profileNickname.value = me.nickname?.trim() ?? ''
      nickname.value = profileNickname.value || maskPhone(phone.value) || '手机用户'
      avatarUrl.value = me.avatarUrl?.trim() || ''
      uni.showToast({ title: '手机号已更新', icon: 'success' })
      return true
    }
    catch (e) {
      uni.showModal({
        title: '换绑失败',
        content: `原因：${normalizeLoginError(e)}`,
        showCancel: false,
        confirmText: '知道了',
      })
      return false
    }
    finally {
      loading.value = false
    }
  }

  async function handleRealtimePhoneBindDetail(detail?: RealtimePhoneDetail) {
    const code = consumeRealtimePhoneCode(detail)
    if (!code)
      return false
    return changeBoundPhoneWithWechat(code)
  }

  async function loadProfile() {
    if (!getStoredToken()) {
      clearSession()
      return
    }
    try {
      const me = await fetchMe()
      userId.value = me.id
      phone.value = me.phone?.replace(/\s/g, '') ?? ''
      profileNickname.value = me.nickname?.trim() ?? ''
      nickname.value = profileNickname.value || maskPhone(phone.value) || '手机用户'
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
    profileNickname,
    phone,
    avatarUrl,
    loading,
    isLoggedIn,
    loginSheetVisible,
    tryRestoreSession,
    ensureLogin,
    handlePhoneLoginDetail,
    handleRealtimePhoneLoginDetail,
    handleRealtimePhoneBindDetail,
    changeBoundPhoneWithWechat,
    endLoginFlow,
    loadProfile,
    clearSession,
    logout,
  }
})
