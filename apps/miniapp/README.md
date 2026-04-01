## Miniapp

uni-app 微信小程序（Vue 3 + Pinia）。

### 安装依赖

```bash
pnpm install
```

### 微信小程序开发

```bash
pnpm dev:wx
```

微信开发者工具导入目录：`dist/dev/mp-weixin`。

### 生产构建

```bash
pnpm run build:wx
```

导入目录：`dist/build/mp-weixin`。在 **`.env.production`** 中配置 `VITE_API_BASE_URL`（HTTPS，与微信公众平台 **request 合法域名** 一致；若网关带路径前缀需包含，如 `https://api.example.com/crystal`）。

### 登录说明

- **手机号快捷登录**：`components/LoginSheet.vue` 内 **`open-type="getPhoneNumber"`**，服务端接口 `POST /auth/phone/wechat`（详见 `apps/api/README.md`）。
- 登录弹层挂载在 **`pages/mine/index.vue`**（微信小程序下 **`App.vue` 的 template 不参与页面渲染**，勿只把弹层写在 `App.vue`）。

### H5 开发

```bash
pnpm dev:h5
```
