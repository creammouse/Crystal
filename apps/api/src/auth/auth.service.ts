import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

type WechatCode2Session = {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

const ACCESS_EXPIRES_SEC = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async loginWithWechatCode(code: string) {
    const appid = this.config.get<string>('WECHAT_MINI_APPID');
    const secret = this.config.get<string>('WECHAT_MINI_SECRET');
    if (!appid || !secret) {
      throw new ServiceUnavailableException(
        '未配置 WECHAT_MINI_APPID / WECHAT_MINI_SECRET，无法换取 openid',
      );
    }

    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', appid);
    url.searchParams.set('secret', secret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    const res = await fetch(url.toString());
    const data = (await res.json()) as WechatCode2Session;

    if (data.errcode) {
      throw new BadRequestException(
        `微信接口错误: ${data.errmsg ?? data.errcode}`,
      );
    }
    if (!data.openid) {
      throw new BadRequestException('微信未返回 openid');
    }

    const user = await this.prisma.user.upsert({
      where: { openid: data.openid },
      create: { openid: data.openid },
      update: {},
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id });

    return {
      accessToken,
      tokenType: 'Bearer' as const,
      expiresIn: ACCESS_EXPIRES_SEC,
      user: { id: user.id },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id };
  }
}
