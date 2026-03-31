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

### 鉴权（微信登录）

- 在 `.env` 中配置 `WECHAT_MINI_APPID`、`WECHAT_MINI_SECRET`（[微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置），与小程序 `manifest.json` 中 AppID 一致。
- `JWT_SECRET`：生产环境务必改为长随机串。
- `POST /auth/wechat`、`GET /auth/me`：见 `src/auth/`。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm run start:dev` | 开发热重载 |
| `pnpm run build` / `pnpm run start:prod` | 构建与生产启动 |
| `pnpm exec prisma migrate dev` | 开发环境迁移 |
| `pnpm exec prisma studio` | Prisma 数据浏览器 |

## 环境变量

见根目录 `.env.example`。**勿将含真实密钥的 `.env` 提交到 Git**（已在 `.gitignore` 中忽略）。

## 技术栈说明

- **Prisma 5.x**：与常见 Nest 集成方式一致（`PrismaService` 继承 `PrismaClient`）。若将来升级到 Prisma 7，需按官方迁移指南调整客户端与配置。
