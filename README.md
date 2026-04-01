## Crystal

标准全栈工作区结构（无强制覆写、无冗余模板代码）。

### 目录结构

- `apps/miniapp`：uni-app（Vue3 + TypeScript + Pinia + uview-plus）
- `apps/api`：**NestJS + Prisma + PostgreSQL** 后端（鉴权见 `apps/api/README.md`；登录为**手机号快捷登录**，非 openid）
- `apps/backend`：后端预留
- `packages/shared`：前后端共享代码预留
- `services`：基础设施预留
- `docs`：项目文档
- `scripts`：脚本

### 前端启动

```bash
cd apps/miniapp
pnpm install
pnpm dev:wx
```

微信开发者工具导入目录：

`apps/miniapp/dist/dev/mp-weixin`

生产构建：`cd apps/miniapp && pnpm run build:wx`，导入 `dist/build/mp-weixin`。生产环境 API 根地址在 `.env.production` 中配置 `VITE_API_BASE_URL`（通常为 HTTPS 网关前缀，如 `https://<域名>/crystal`）。

更多占位与联调项见 **`docs/TODO-PLACEHOLDERS.md`**。
