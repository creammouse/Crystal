import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

type WxAccessTokenRes = {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
};

type WxPhoneNumberRes = {
  errcode?: number;
  errmsg?: string;
  phone_info?: { phoneNumber?: string };
};

const ACCESS_EXPIRES_SEC = 7 * 24 * 60 * 60;
const PHONE_CODE_EXPIRES_MS = 5 * 60 * 1000;
const PHONE_CODE_RESEND_MS = 60 * 1000;

type PhoneCodeRecord = {
  code: string;
  expiresAtMs: number;
  lastSentAtMs: number;
};

@Injectable()
export class AuthService {
  private accessTokenCache: { token: string; expiresAtMs: number } | null = null;
  private phoneCodeStore = new Map<string, PhoneCodeRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async getMiniProgramAccessToken(): Promise<string> {
    const appid = this.config.get<string>('WECHAT_MINI_APPID');
    const secret = this.config.get<string>('WECHAT_MINI_SECRET');
    if (!appid || !secret) {
      throw new ServiceUnavailableException(
        '未配置 WECHAT_MINI_APPID / WECHAT_MINI_SECRET',
      );
    }
    const now = Date.now();
    if (
      this.accessTokenCache &&
      this.accessTokenCache.expiresAtMs > now + 60_000
    ) {
      return this.accessTokenCache.token;
    }
    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', appid);
    url.searchParams.set('secret', secret);
    const res = await fetch(url.toString());
    const data = (await res.json()) as WxAccessTokenRes;
    if (data.errcode) {
      throw new BadRequestException(
        `获取 access_token 失败: ${data.errmsg ?? data.errcode}`,
      );
    }
    if (!data.access_token) {
      throw new BadRequestException('微信未返回 access_token');
    }
    const ttlMs = (data.expires_in ?? 7200) * 1000;
    this.accessTokenCache = {
      token: data.access_token,
      expiresAtMs: now + ttlMs,
    };
    return data.access_token;
  }

  /**
   * 小程序「手机号快捷登录」：getPhoneNumber 返回的 code 换手机号，再签发 JWT。
   */
  async loginWithPhoneWechatCode(phoneCode: string) {
    const accessToken = await this.getMiniProgramAccessToken();
    const url = new URL(
      'https://api.weixin.qq.com/wxa/business/getuserphonenumber',
    );
    url.searchParams.set('access_token', accessToken);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: phoneCode }),
    });
    const data = (await res.json()) as WxPhoneNumberRes;
    if (data.errcode && data.errcode !== 0) {
      throw new BadRequestException(
        `获取手机号失败: ${data.errmsg ?? data.errcode}`,
      );
    }
    const rawPhone = data.phone_info?.phoneNumber?.trim();
    if (!rawPhone) {
      throw new BadRequestException('微信未返回手机号');
    }
    const phone = rawPhone.replace(/\s/g, '');

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });

    const accessTokenJwt = await this.jwt.signAsync({ sub: user.id });

    return {
      accessToken: accessTokenJwt,
      tokenType: 'Bearer' as const,
      expiresIn: ACCESS_EXPIRES_SEC,
      user: { id: user.id },
    };
  }

  /** 其他手机号登录：发送验证码（当前提供开发可用版本，生产环境应接入短信服务商） */
  sendPhoneLoginCode(phoneRaw: string) {
    const phone = phoneRaw.trim();
    if (!/^1\d{10}$/.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    const now = Date.now();
    const prev = this.phoneCodeStore.get(phone);
    if (prev && now - prev.lastSentAtMs < PHONE_CODE_RESEND_MS) {
      const waitSec = Math.ceil((PHONE_CODE_RESEND_MS - (now - prev.lastSentAtMs)) / 1000);
      throw new BadRequestException(`发送过于频繁，请 ${waitSec}s 后重试`);
    }

    const isProd = (this.config.get<string>('NODE_ENV') || '').toLowerCase() === 'production';
    const configured = this.config.get<string>('SMS_LOGIN_TEST_CODE')?.trim();
    const code = configured || `${Math.floor(100000 + Math.random() * 900000)}`;
    this.phoneCodeStore.set(phone, {
      code,
      expiresAtMs: now + PHONE_CODE_EXPIRES_MS,
      lastSentAtMs: now,
    });

    // TODO(production): 接入真实短信服务商发送 code。当前生产仅返回已发送，不回传验证码。
    return {
      sent: true,
      expiresInSec: Math.floor(PHONE_CODE_EXPIRES_MS / 1000),
      ...(isProd ? {} : { testCode: code }),
    };
  }

  /** 其他手机号登录：校验验证码并签发 JWT */
  async loginWithPhoneCode(phoneRaw: string, codeRaw: string) {
    const phone = phoneRaw.trim();
    const code = codeRaw.trim();
    if (!/^1\d{10}$/.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
    const rec = this.phoneCodeStore.get(phone);
    if (!rec) {
      throw new BadRequestException('请先获取验证码');
    }
    const now = Date.now();
    if (rec.expiresAtMs < now) {
      this.phoneCodeStore.delete(phone);
      throw new BadRequestException('验证码已过期，请重新获取');
    }
    if (rec.code !== code) {
      throw new BadRequestException('验证码错误');
    }
    this.phoneCodeStore.delete(phone);

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });
    const accessTokenJwt = await this.jwt.signAsync({ sub: user.id });
    return {
      accessToken: accessTokenJwt,
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
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(
    userId: string,
    dto: { nickname?: string; avatarUrl?: string },
  ) {
    const data: { nickname?: string | null; avatarUrl?: string | null } = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('至少需要提供 nickname 或 avatarUrl');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }

  async setAvatarUrl(userId: string, relativePath: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: relativePath },
    });
    return user;
  }
}
