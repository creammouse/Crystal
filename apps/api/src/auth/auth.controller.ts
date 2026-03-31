import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { WechatLoginDto } from './dto/wechat-login.dto';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('wechat')
  wechat(@Body() dto: WechatLoginDto) {
    return this.auth.loginWithWechatCode(dto.code);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: AuthedRequest) {
    return this.auth.getProfile(req.user.userId);
  }
}
