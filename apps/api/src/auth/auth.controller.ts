import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { PhoneCodeLoginDto } from './dto/phone-code-login.dto';
import { PhoneSendCodeDto } from './dto/phone-send-code.dto';
import { PhoneWechatDto } from './dto/phone-wechat.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 小程序 getPhoneNumber 返回的 code */
  @Post('phone/wechat')
  phoneWechat(@Body() dto: PhoneWechatDto) {
    return this.auth.loginWithPhoneWechatCode(dto.code);
  }

  /** 已登录：getPhoneNumber 的 code 换绑当前账号手机号 */
  @Post('phone/wechat-bind')
  @UseGuards(AuthGuard('jwt'))
  phoneWechatBind(@Req() req: AuthedRequest, @Body() dto: PhoneWechatDto) {
    return this.auth.updatePhoneWithWechatCode(req.user.userId, dto.code);
  }

  /** 短信验证码发送（需接入短信服务商；小程序不使用） */
  @Post('phone/send-code')
  sendPhoneCode(@Body() dto: PhoneSendCodeDto) {
    return this.auth.sendPhoneLoginCode(dto.phone);
  }

  /** 非快捷登录：手机号 + 验证码登录 */
  @Post('phone/code-login')
  phoneCodeLogin(@Body() dto: PhoneCodeLoginDto) {
    return this.auth.loginWithPhoneCode(dto.phone, dto.code);
  }

  /** 已登录：验证码校验通过后更换绑定手机号 */
  @Post('phone/change')
  @UseGuards(AuthGuard('jwt'))
  phoneChange(@Req() req: AuthedRequest, @Body() dto: PhoneCodeLoginDto) {
    return this.auth.changePhoneForUser(req.user.userId, dto.phone, dto.code);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: AuthedRequest) {
    return this.auth.getProfile(req.user.userId);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  patchProfile(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.userId, dto);
  }

  @Post('upload-avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname) || '.jpg';
          cb(null, `${randomBytes(16).toString('hex')}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @Req() req: AuthedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('未收到图片文件');
    }
    const relative = `/uploads/avatars/${file.filename}`;
    await this.auth.setAvatarUrl(req.user.userId, relative);
    return { avatarUrl: relative };
  }
}
