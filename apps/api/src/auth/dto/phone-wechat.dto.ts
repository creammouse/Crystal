import { IsNotEmpty, IsString, Length } from 'class-validator';

/** 小程序 getPhoneNumber 返回的 code，用于服务端换取手机号 */
export class PhoneWechatDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 512)
  code!: string;
}
