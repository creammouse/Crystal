/** 手机号脱敏展示 */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length >= 11)
    return `${d.slice(0, 3)}****${d.slice(-4)}`
  if (d.length >= 7)
    return phone
  return phone
}
