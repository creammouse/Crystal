import { IsNotEmpty, IsString, Length } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 256)
  code!: string;
}
