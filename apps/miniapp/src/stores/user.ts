import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchMe, loginWithWechatCode, updateProfile } from '../api/auth'
import { getApiBaseUrl, isApiDebug } from '../config'
import { getStoredToken, setStoredToken } from '../utils/request'

function logLogin(phase: string, extra?: unknown) {
  const line = extra === undefined ? phase : `${phase} ${JSON.stringify(extra)}`
  console.warn(`[Crystal Login] ${line}`)
}

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
    try {
      await loadProfile()
    }
    catch (e) {
      logLogin('tryRestoreSession failed', normalizeLoginError(e))
    }
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
      logLogin('start', { baseUrl: getApiBaseUrl() })
      try {
        logLogin('getUserProfile …')
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
        logLogin('getUserProfile ok')
      }
      catch (e) {
        logLogin('getUserProfile skipped', e)
        uni.showToast({
          title: '未授权头像昵称，将使用基础登录',
          icon: 'none',
          duration: 2000,
        })
      }

      logLogin('uni.login …')
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
      logLogin('uni.login ok', { codeLen: loginRes.code.length })
      logLogin('POST /auth/wechat …')
      const data = await loginWithWechatCode(loginRes.code)
      logLogin('POST /auth/wechat ok')
      setStoredToken(data.accessToken)
      userId.value = data.user.id
      nickname.value = profileNick || '微信用户'
      avatarUrl.value = profileAvatar
      if (profileNick || profileAvatar) {
        logLogin('PATCH /auth/profile …')
        await updateProfile({
          nickname: profileNick || undefined,
          avatarUrl: profileAvatar || undefined,
        })
      }
      logLogin('GET /auth/me …')
      await loadProfile()
      logLogin('done')
    }
    catch (e) {
      console.error('[Crystal Login] error', e)
      clearSession()
      const msg = normalizeLoginError(e)
      showLoginErrorDetail(
        isApiDebug()
          ? `${msg}\n\n提示：已开启 VITE_API_DEBUG，请同时看控制台 [Crystal Login] / [Crystal API]`
          : `${msg}\n\n若显示 timeout / fail，请检查：微信公众平台 request 合法域名是否已添加 https://api.northstarway.top（勿带路径）；是否已重新上传体验版/正式版。`,
      )
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
      nickname.value = me.nickname?.trim() || '微信用户'
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
    tryRestoreSession,
    ensureLogin,
    loadProfile,
    clearSession,
  }
})
