## Crystal

标准全栈工作区结构（无强制覆写、无冗余模板代码）。

### 目录结构

- `apps/miniapp`：uni-app（Vue3 + TypeScript + Pinia + uview-plus）
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
