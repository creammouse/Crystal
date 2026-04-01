import { IsNotEmpty, IsString, Matches } from 'class-validator';

/** 其他手机号登录：发送验证码 */
export class PhoneSendCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone!: string;
}
