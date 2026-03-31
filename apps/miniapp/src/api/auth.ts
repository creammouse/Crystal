import { request } from '../utils/request'

export type LoginResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: { id: string }
}

export async function loginWithWechatCode(code: string) {
  return request<LoginResponse>({
    path: '/auth/wechat',
    method: 'POST',
    data: { code },
    auth: false,
  })
}

export async function fetchMe() {
  return request<{ id: string }>({
    path: '/auth/me',
    method: 'GET',
  })
}
