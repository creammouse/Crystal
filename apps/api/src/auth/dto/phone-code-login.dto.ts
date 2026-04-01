import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/** 其他手机号登录：手机号 + 验证码 */
export class PhoneCodeLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  code!: string;
}
