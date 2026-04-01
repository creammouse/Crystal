# Crystal API

NestJS + **PostgreSQL** + **Prisma** 后端，与小程序 `apps/miniapp` 并列；**未使用** pnpm workspace，本目录独立 `pnpm install`。

## 本地依赖

- Node.js LTS（建议 20+）
- Docker Desktop（用于本机 PostgreSQL；亦可自行安装 PostgreSQL 并改 `DATABASE_URL`）

## 首次 setup

```bash
cd apps/api
pnpm install
copy .env.example .env   # Windows；或手动复制后编辑 DATABASE_URL
docker compose up -d       # 启动 Postgres（端口 5432）
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run start:dev
```

- 健康检查：<http://localhost:3000/health>  
- 数据库连通：<http://localhost:3000/health/db>（需数据库已启动且迁移已执行）

### 鉴权（小程序手机号快捷登录 + JWT）

- **环境变量**（见 `.env.example`）  
  - `WECHAT_MINI_APPID`、`WECHAT_MINI_SECRET`：[微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置，与小程序 `manifest.json` 中 AppID 一致。用于获取 `access_token` 及调用微信 **`getuserphonenumber`** 换取手机号。  
  - `JWT_SECRET`：生产环境务必使用长随机串。

- **数据模型**：`User` 以 **`phone` 唯一** 标识用户；`nickname`、`avatarUrl` 可选（资料编辑能力可后续接回）。

- **主要 HTTP 接口**（业务路径前若有 Nginx 前缀如 `/crystal`，需一并拼接）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/auth/phone/wechat` | body: `{ "code": "<小程序 getPhoneNumber 返回的 code>" }`。服务端用微信接口换手机号并 upsert 用户，返回 JWT。**路径中 `wechat` 表示走微信服务端换手机号，不是已废弃的 `jscode2session` openid 登录。** |
| `GET` | `/auth/me` | 需 `Authorization: Bearer <token>`，返回用户资料（含 `phone`）。 |
| `PATCH` | `/auth/profile` | 需登录；更新 `nickname` / `avatarUrl`（资料页开放后使用）。 |
| `POST` | `/auth/upload-avatar` | 需登录；multipart 头像上传，返回站内相对路径。 |

- **静态资源**：`main.ts` 挂载 `uploads/`，URL 前缀 `/uploads/`（经反向代理时需与网关路径一致）。

实现见 `src/auth/`。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm run start:dev` | 开发热重载 |
| `pnpm run build` / `pnpm run start:prod` | 构建与生产启动 |
| `pnpm exec prisma migrate dev` | 开发环境迁移 |
| `pnpm exec prisma studio` | Prisma 数据浏览器 |

## 环境变量

见本目录 `.env.example`。**勿将含真实密钥的 `.env` 提交到 Git**（已在 `.gitignore` 中忽略）。

## 技术栈说明

- **Prisma 5.x**：与常见 Nest 集成方式一致（`PrismaService` 继承 `PrismaClient`）。若将来升级到 Prisma 7，需按官方迁移指南调整客户端与配置。
