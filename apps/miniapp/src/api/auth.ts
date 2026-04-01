import { buildApiUrl, getStoredToken, request } from '../utils/request'

export type LoginResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: { id: string }
}

export type MeResponse = {
  id: string
  phone?: string | null
  nickname: string | null
  avatarUrl: string | null
}

/** 小程序 getPhoneNumber 返回的 code，用于服务端换取手机号并登录 */
export async function loginWithPhoneWechatCode(code: string) {
  return request<LoginResponse>({
    path: '/auth/phone/wechat',
    method: 'POST',
    data: { code },
    auth: false,
  })
}

export async function sendPhoneLoginCode(phone: string) {
  return request<{ sent: boolean, expiresInSec: number, testCode?: string }>({
    path: '/auth/phone/send-code',
    method: 'POST',
    data: { phone },
    auth: false,
  })
}

export async function loginWithPhoneCode(phone: string, code: string) {
  return request<LoginResponse>({
    path: '/auth/phone/code-login',
    method: 'POST',
    data: { phone, code },
    auth: false,
  })
}

export async function fetchMe() {
  return request<MeResponse>({
    path: '/auth/me',
    method: 'GET',
  })
}

export async function updateProfile(data: {
  nickname?: string
  avatarUrl?: string
}) {
  return request<MeResponse>({
    path: '/auth/profile',
    method: 'PATCH',
    data,
  })
}

/** 微信小程序 `chooseAvatar` 返回的本地临时路径上传为站内 URL */
export function uploadAvatarFromTempPath(localPath: string): Promise<string> {
  const url = buildApiUrl('/auth/upload-avatar')
  const token = getStoredToken()
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url,
      filePath: localPath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        const status = res.statusCode ?? 0
        if (status < 200 || status >= 300) {
          reject(new Error(`上传失败 HTTP ${status}`))
          return
        }
        try {
          const body = JSON.parse(res.data as string) as { avatarUrl?: string }
          if (body.avatarUrl)
            resolve(body.avatarUrl)
          else
            reject(new Error('上传响应无效'))
        }
        catch {
          reject(new Error('上传响应解析失败'))
        }
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}
