import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchMe, loginWithWechatCode } from '../api/auth'
import { getStoredToken, setStoredToken } from '../utils/request'

export const useUserStore = defineStore('user', () => {
  const userId = ref('')
  /** 展示用昵称：微信资料授权或登录后的默认文案 */
  const nickname = ref('未登录')
  /** 展示用头像（来自 getUserProfile，仅本次会话有效；持久化需后端） */
  const avatarUrl = ref('')
  const loading = ref(false)

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

  /**
   * 仅在有本地 token 时请求 /auth/me，用于冷启动恢复登录态；不会调 uni.login。
   */
  async function tryRestoreSession() {
    if (!getStoredToken()) {
      clearSession()
      return
    }
    await loadProfile()
  }

  /**
   * 用户主动登录：先弹出微信「获取你的昵称、头像」说明（getUserProfile），再 uni.login 换 code。
   * 用户拒绝头像昵称授权时，仍可用 code 完成基础登录（openid）。
   */
  async function ensureLogin() {
    loading.value = true
    let profileNick = ''
    let profileAvatar = ''
    try {
      try {
        const prof = await new Promise<UniApp.GetUserProfileRes>((resolve, reject) => {
          uni.getUserProfile({
            desc: '用于完善个人资料与会员展示',
            success: resolve,
            fail: reject,
          })
        })
        const u = prof.userInfo
        if (u) {
          profileNick = u.nickName || ''
          profileAvatar = u.avatarUrl || ''
        }
      }
      catch {
        uni.showToast({
          title: '未授权头像昵称，将使用基础登录',
          icon: 'none',
          duration: 2000,
        })
      }

      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject,
        })
      })
      if (!loginRes.code) {
        uni.showToast({ title: '未获取到登录凭证', icon: 'none' })
        return
      }
      const data = await loginWithWechatCode(loginRes.code)
      setStoredToken(data.accessToken)
      userId.value = data.user.id
      nickname.value = profileNick || '微信用户'
      avatarUrl.value = profileAvatar
      await loadProfile()
    }
    catch (e) {
      console.error(e)
      clearSession()
      const msg = normalizeLoginError(e)
      showLoginErrorDetail(msg)
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
      if (!nickname.value || nickname.value === '未登录')
        nickname.value = '微信用户'
    }
    catch {
      clearSession()
    }
  }

  return {
    userId,
    nickname,
    avatarUrl,
    loading,
    isLoggedIn,
    tryRestoreSession,
    ensureLogin,
    loadProfile,
    clearSession,
  }
})
