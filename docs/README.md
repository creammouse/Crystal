## Docs

需求、接口与设计说明目录。

| 文件 | 说明 |
|------|------|
| [TODO-PLACEHOLDERS.md](./TODO-PLACEHOLDERS.md) | 占位功能、业务 TODO、微信公众平台侧待办；**后端鉴权与登录方式以本文档「后端」节及 `apps/api/README.md` 为准** |
| （根目录）`README.md` | 仓库目录结构与小程序启动命令 |

小程序 **鉴权与登录** 要点：

- 登录方式：**微信「手机号快捷登录」**（`getPhoneNumber` → `POST /auth/phone/wechat`），非 openid code 登录。
- 登录弹层组件：`apps/miniapp/src/components/LoginSheet.vue`，**挂载在「我的」页**（`pages/mine/index.vue`），勿仅放在 `App.vue` 的 template（微信小程序不渲染）。
