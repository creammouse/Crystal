# 占位与临时效果 TODO（Crystal / DIY 等）

> 来自开发过程中的占位数据、示意级交互与待替换效果。完成后可逐项勾选或删除本文件。  
> **说明**：此前曾另有一份 `diy-conversation-todos.md`，已合并进本文档并删除重复文件，只保留这一份清单。

## 在代码里怎么搜

- 小程序源码目录：`apps/miniapp/src`
- 后端 API 目录：`apps/api`（NestJS + PostgreSQL + Prisma；**未使用** pnpm workspace，在 `apps/api` 内单独 `pnpm install`）
- 建议搜索：`TODO`、`TODO（后端`、`<!-- TODO:`（模板内）
- 收货地址列表页部分注释历史写法为「接入后端」；已逐步统一为含 **`TODO:`** 前缀，便于与上列一并检索

## 后端（Crystal API）

> 技术栈：**Node.js + TypeScript + NestJS**，**PostgreSQL + Prisma 5.x**。本地数据库见 `apps/api/docker-compose.yml` 与 **`apps/api/README.md`**（鉴权与接口表以该文件为准）。

- [x] 工程骨架：`apps/api`（Nest 默认结构 + `PrismaModule` / `PrismaService` + `GET /health`、`GET /health/db`）
- [x] **用户模型**：`User` 以 **`phone` 唯一**（来自微信「手机号快捷登录」）；`nickname`、`avatarUrl` 可选，供后续资料编辑
- [x] **登录（手机号快捷）**：`POST /auth/phone/wechat`，body `{ code }`，`code` 为小程序 **`getPhoneNumber`** 返回；服务端用微信 **`getuserphonenumber`** 换手机号 → upsert `User` → JWT（**非**已废弃的 `jscode2session` / openid 登录）
- [x] **会话**：`GET /auth/me`（Bearer）；`App.vue` `onLaunch` 仅 **有 token 时** 静默 `tryRestoreSession`；小程序端 **`LoginSheet` 挂在 `pages/mine/index.vue`**（微信端 `App.vue` 的 template 不参与页面渲染，勿把弹层只写在 `App.vue`）
- [x] **退出登录**：前端清本地 token / 状态（无服务端 revoke）；「我的」页菜单
- [ ] **其他手机号登录**：短信验证码流程（产品占位，未实现）
- [ ] **可选**：刷新 token、服务端 token 黑名单 / 登出接口
- [ ] **资料**：`PATCH /auth/profile`、`POST /auth/upload-avatar` 已具备；小程序 `pages/mine/profile` 当前为「暂未开放」，与接口并存属预留
- [ ] **商品 / DIY 目录**：与 `TODO-PLACEHOLDERS` 中小程序 DIY、商城条目对齐的 REST 接口
- [ ] **订单 / 支付 / 地址**：与 `pages/mine`、确认订单页规划对齐

## 数据与接口（后端对接）— DIY

- [ ] **大类 Tab**（珠子 / 配饰 / 花托）：`categoryTabs` 静态数组 → 接口返回类别列表（`pages/diy/index.vue` 内 TODO）
- [ ] **子类列表**：`subCategoryMap` 静态映射 → 按大类（及可选筛选）接口返回
- [ ] **商品卡片列表**：`currentGoods` 占位生成（固定条数、名称拼接）→ 接口返回（含 `id`、名称、图、可用尺寸等）
- [ ] **每颗珠可用尺寸**：`buildSizeSet` 基于 id 的稳定随机 → 数据库/接口真实 SKU 尺寸集合
- [ ] **手围 / 单圈双圈**：设置弹窗内 `wristSize`、`wearMode` 仅前端状态 → 参与颗数/绳长计算与下单配方
- [ ] **搜索 / 筛选**：顶部按钮仅占位 → 接搜索词与筛选条件、刷新列表

## 业务页与后端（商城 / 我的 / 订单流）

> 下列页面在源码中均已标注 `TODO`（或等价说明）；此处为清单式汇总，便于排期与联调。

- [ ] **商城** `pages/mall/index.vue`：商城分类、按分类商品列表 → 后端接口（文件内 TODO）
- [ ] **我的** `pages/mine/index.vue`：已接静默恢复、`/auth/me`、手机号快捷登录弹层、退出登录；`profile` 页占位 → 资料编辑与后端 PATCH/上传对齐
- [ ] **我的设计** `pages/mine/designs/index.vue`：设计列表 GET；删除 / 分享 / 加购 / 跳转 DIY 与结算（各 handler TODO）
- [ ] **购物车** `pages/mine/cart/index.vue`：与后端或统一购物车存储同步；结算 → 确认订单页（待建路由，见下）
- [ ] **我的订单** `pages/mine/orders/index.vue`：订单列表与状态筛选；**订单详情页**（路由待建，`onCardTap` TODO）
- [ ] **历史/收藏** `pages/mine/favorites/index.vue`：浏览历史（本地或接口）；收藏列表接口；点击跳转 **商品详情**（页面与路由待建）
- [ ] **联系客服** `pages/mine/service/index.vue`：`open-type="contact"` 与公众平台客服配置（模板 + script TODO）

### 尚未建立的页面（依赖后端/产品定稿）

- [ ] **商品详情**：展示 SKU、库存价格、收藏、写入浏览历史、加购；与商城列表、历史/收藏跳转对齐
- [ ] **确认订单 / 支付结果**：承接购物车结算与设计「购买」流程；对接下单与支付接口

## UI 与交互（示意 → 产品级）

- [ ] **绳圈**：虚线圆为占位 → 真实绳线/材质或与 Canvas 预览对齐
- [ ] **串上珠子视觉**：圆 + `mm` + 名称缩写 → 贴图/真实比例按 `size` 缩放（当前 `size` 为占位 mm，**未改变**示意圆点像素大小）
- [ ] **排布算法**：固定 `BEAD_DIAMETER_RPX` 步进挨排 → 按每颗真实直径 mm 换算后的弧长步进
- [ ] **手串已满**：按固定珠径与圆周估算 → 与手围、单/双圈、**每颗实际珠径**一致
- [ ] **落位预览**（`ring-drop-preview`）：虚线圆示意（代码内已注释）→ 缝隙高亮、引导线、动画等更佳反馈
- [ ] **拖拽**：`touchstart` + 全页 `touchmove` 示意级重排/删 → 边界防抖、与滚动冲突处理、更精细的「插入缝」判定；**插入语义**当前为数组 `moveArrayItem` 重排，非严格物理「只插两粒之间」
- [ ] **删除热区**：依赖「删除」按钮矩形命中 → 可扩大热区或独立拖入垃圾桶 UI
- [ ] **翻转**：按钮占位 → 实现镜像/旋转语义
- [ ] **删除 / 清空**：与拖拽丢弃并存 → 可统一文案与撤销
- [ ] **长按商品详情弹窗**：空白占位，且**未绑定当前长按的 `item`** → 传入商品、展示详情字段、图集、价格库存等
- [ ] **设置弹窗**：小窗位置 `right: 180rpx` 等为手工调参 → 可按设计系统或相对工具栏测量统一

## 收货地址（小程序表单 + 后端）

- [ ] **地址列表 CRUD**：`pages/mine/address/index` 占位数据 → 用户收货地址接口（列表、默认、删除等；源码顶部与各 handler TODO）
- [ ] **新增/编辑保存**：`pages/mine/address/add` 表单字段 → POST/PUT，与订单/用户中心打通（`add.vue` 内 TODO（后端阶段）块与提交 handler）
- [ ] **粘贴框智能解析（后端实现）**：接口接收整段文本 → 解析姓名、手机、省市区、详细地址等 → 小程序回填表单；可考虑开源库（如行政区划词典 + 规则，或现成地址解析方案），**不宜把大词库塞小程序**
- [ ] **地图选址**：小程序端已接 `uni.chooseLocation` + `manifest` 声明；**公众平台侧待办**见下文「微信公众平台（代码外 TODO）」；与后端字段对齐待后端阶段处理

## 微信公众平台（代码外 TODO）

> 以下均在 [微信公众平台](https://mp.weixin.qq.com/) 操作，**无法通过仓库代码提交完成**。与地图选点、定位等能力相关时，请逐项核对。

- [ ] **小程序 AppID**：在 `apps/miniapp/src/manifest.json`（及必要时 `project.config.json`）中填写与后台一致的 AppID，本地用该账号在开发者工具里打开项目
- [ ] **request / uploadFile 合法域名**：将线上 API 根域名（如 `https://api.example.com`，**不含路径**）配置到 **开发** → **开发管理** → **开发设置** → **服务器域名**；小程序请求、上传头像等需 HTTPS 且备案域名
- [ ] **手机号能力**：使用 **手机号快捷登录** 需小程序类目/资质符合平台要求；以当前后台说明为准
- [ ] **接口设置 → 位置相关能力**：**开发** → **开发管理** → **接口设置**，按页面说明开通 **`chooseLocation`（打开地图选择位置）** 等所需项；未开通时真机/提审可能直接失败
- [ ] **用户隐私保护指引**：在后台完善「用户隐私保护指引」，声明**收集位置信息**及用途（例如：用于在地图上选择收货地址）；须与小程序实际调用的隐私接口一致，否则影响审核与用户授权流程
- [ ] **服务类目**：确保所选类目与「电商 / 收货地址 / 位置」等使用场景相符，避免类目与能力不匹配导致审核驳回
- [ ] **提审说明**（若审核问及）：可简要说明「地图选点仅用于用户填写收货地址，不上传无关位置数据」等（以你们法务/产品表述为准）

## 状态与持久化

- [ ] **手串数据**：当前为页面内 `ref` → 可选 Pinia/草稿持久化；与后端 SKU、订单草稿同步

## 页面与工程

- [ ] **manifest / AppID**：`src/manifest.json` 等按需填写正式小程序信息
- [ ] **依赖与构建**：历史上曾有 Vue/uni/sass 与 PowerShell 策略问题；当前以 `pnpm.cmd`、`sass` 等为准 → 长期建议锁 Node LTS 并文档化启动命令
- [ ] **uview-plus / Sass**：构建时可能有 `@import`、legacy API 等弃用警告 → 随组件库或构建链升级收敛

## 关键文件（便于搜索）

| 模块 | 路径 |
|------|------|
| 后端 API | `apps/api`（`prisma/schema.prisma`、`src/auth/`、`src/main.ts`） |
| 登录弹层（小程序） | `apps/miniapp/src/components/LoginSheet.vue`（由「我的」页挂载） |
| 登录态 / Pinia | `apps/miniapp/src/stores/user.ts` |
| 需登录菜单拦截 | `apps/miniapp/src/utils/require-auth.ts` |
| DIY 主逻辑 | `apps/miniapp/src/pages/diy/index.vue` |
| 商城 | `apps/miniapp/src/pages/mall/index.vue` |
| 我的入口 | `apps/miniapp/src/pages/mine/index.vue` |
| 我的设计 | `apps/miniapp/src/pages/mine/designs/index.vue` |
| 购物车 | `apps/miniapp/src/pages/mine/cart/index.vue` |
| 订单 | `apps/miniapp/src/pages/mine/orders/index.vue` |
| 历史/收藏 | `apps/miniapp/src/pages/mine/favorites/index.vue` |
| 收货地址 | `apps/miniapp/src/pages/mine/address/index.vue`、`add.vue` |
| 客服 | `apps/miniapp/src/pages/mine/service/index.vue` |
| 路由与标题 | `apps/miniapp/src/pages.json` |
| 全局样式 | `apps/miniapp/src/uni.scss` |
| 经营者本地资料小工具（非小程序） | `tools/operator-catalog/index.html` — 浏览器打开，导出 JSON 供后端录入 |

## 建议优先级（可选）

1. 业务后端：商品 / DIY 目录等接口；与商城、订单闭环  
2. 资料页：与已有 `PATCH /auth/profile`、上传头像对齐（若产品需要）  
3. 商品与尺寸走后端 + 长按详情绑定具体 `item` 与真实字段  
4. 手围/单双圈参与建议颗数与满串判断  
5. 落位预览与拖拽插入规则按产品定稿优化  
6. 商品详情页 + 购物车/订单/地址联调闭环  
