# TODO List

## 1. 账号与登录

- [x] 1.1 登录页只保留用户名密码登录
  - 已处理：删除验证码、记住登录、忘记密码、短信登录、扫码登录和第三方登录入口。

- [x] 1.2 注册仍是前端模拟实现
  - 前端：`apps/web/src/views/login/components/LoginRegist.vue`
  - 后端：`POST /api/register`
  - 已处理：注册只保留用户名、邮箱、密码、确认密码，并调用后端注册接口；注册成功后默认分配 `common` 角色。

- [x] 1.3 手机号登录、忘记密码、二维码登录入口已移除
  - 已处理：删除 `LoginPhone.vue`、`LoginUpdate.vue`、`LoginQrCode.vue` 及其入口配置。


## 2. 个人中心 / 账号设置

- [x] 2.1 头像上传仍调用外部 mock
  - 前端：`apps/web/src/views/account-settings/components/Profile.vue`
  - 已处理：个人信息页头像上传已改为调用本项目 `/api/upload/avatar`，后端保存到 `public/uploads/avatars` 并通过 `/api/uploads/avatars/*` 访问。

- [x] 2.2 个人资料保存未接后端
  - 前端：`apps/web/src/views/account-settings/components/Profile.vue`
  - 已处理：个人信息页已复用用户更新接口，支持保存用户名、邮箱、角色、状态、简介/备注与头像。

- [x] 2.3 个人简介是后端硬编码
  - 后端：`apps/server/src/service/dashboard.service.ts`
  - 已处理：`description` 不再硬编码，当前映射到用户 `remark` 字段。

- [x] 2.6 个人信息页支持重置密码
  - 前端：`apps/web/src/views/account-settings/components/Profile.vue`
  - 已处理：新增重置密码弹窗，必须输入新密码和确认密码，校验一致后调用后端重置密码接口。

- [x] 2.4 账户管理页未接后端
  - 前端：`apps/web/src/views/account-settings/components/AccountManagement.vue`
  - 已处理：该入口不需要，已从账号设置页移除并删除组件。

- [x] 2.5 偏好设置未持久化
  - 前端：`apps/web/src/views/account-settings/components/Preferences.vue`
  - 已处理：该入口不需要，已从账号设置页移除并删除组件。

## 3. AI 聊天

- [x] 3.1 AI Chat 功能已删除
  - 已处理：删除 `apps/web/src/views/chatai`、`deep-chat` 依赖、初始化菜单和角色权限。

## 4. 首页 / Dashboard

- [ ] 4.1 首页统计数据是前端静态随机数据
  - 前端：`apps/web/src/views/welcome/data.ts`
  - 现状：需求人数、提问数量、解决数量、满意度、表格数据均由前端静态/随机生成。
  - 后端：存在 `POST /api/get-card-list` 和 `GET /api/get-map-info`，但当前首页未调用。
  - 需要：明确首页数据模型，新增或复用后端统计接口，并让首页从后端加载。

- [ ] 4.2 后端 dashboard 示例接口未被前端使用
  - 后端：`apps/server/src/routes/dashboard/dashboard.handlers.ts`
  - 现状：`/api/get-card-list` 使用静态 cardList；`/api/get-map-info` 使用 faker 随机数据；前端未接入。
  - 需要：删除无用示例接口，或改造成真实首页接口后接入前端。

## 5. 系统管理

- [x] 5.1 用户管理基础 CRUD 已接后端
- [x] 5.2 角色管理基础 CRUD 与菜单授权已接后端
- [x] 5.3 菜单管理基础 CRUD 已接后端
- [x] 5.4 菜单启用/停用已接后端
- [x] 5.5 在线用户强退已联动 Redis 凭证失效

- [ ] 5.6 用户头像上传仍未接本项目后端
  - 前端：`apps/web/src/views/system/user/utils/hook.tsx`
  - 现状：个人信息页头像上传已接后端；用户管理更多菜单中的“上传头像”弹窗仍只裁剪并刷新列表，尚未调用 `/api/upload/avatar` 和用户更新接口。
  - 需要：复用个人信息页的头像上传接口，上传成功后调用用户更新接口写入目标用户 `avatar`。

- [x] 5.7 用户管理仍有调试/遗留函数
  - 前端：`apps/web/src/views/system/user/utils/hook.tsx`
  - 已处理：移除 `handleUpdate`、已无入口的角色分配弹窗函数、相关未使用导入/初始化，以及用户管理页调试输出。

- [x] 5.8 菜单/角色/在线用户列表存在选择回调只打印日志
  - 前端：
    - `apps/web/src/views/system/menu/utils/hook.tsx`
    - `apps/web/src/views/system/role/utils/hook.tsx`
    - `apps/web/src/views/monitor/online/hook.tsx`
  - 已处理：这些列表没有批量操作入口，也没有选择列，已删除无效的 `@selection-change` 绑定、`handleSelectionChange` 函数和返回项。

## 6. 系统监控 / 日志

- [x] 6.1 在线用户列表、强退已接后端
- [x] 6.2 登录日志列表、删除、清空已接后端
- [x] 6.3 系统日志列表、详情、删除、清空已接后端

- [x] 6.4 安全日志分页未真正接后端分页
  - 前端：`apps/web/src/views/account-settings/components/SecurityLog.vue`
  - 后端：`GET /api/mine-logs`
  - 已处理：该入口不需要，已删除前端组件、`getMineLogs` API、后端 `/api/mine-logs` 路由、`sys_mine_logs` schema 与初始化 SQL。

## 7. 类型与工程化

- [x] 7.1 前端 composite/declaration 模式暴露声明类型错误
  - 已处理：新增 `apps/web/tsconfig.typecheck.json`，让日常 `vue-tsc --noEmit` 不走 declaration emit，同时保留 `apps/web/tsconfig.json` 的 `composite: true` 给项目引用使用。
  - 验证：`pnpm --filter @aicustomer/admin-web typecheck` 已通过。

- [x] 7.2 后端 Drizzle/OpenAPI 类型检查仍未通过
  - 已处理：修正 Scalar OpenAPI 配置；为 Hono 用户上下文读取和 zod-openapi handler 入参补类型边界；Drizzle insert/update 写入使用表 insert 类型约束。
  - 验证：`pnpm --filter @aicustomer/server typecheck` 已通过。

- [x] 7.3 `pnpm-lock.yaml` 曾被依赖安装整理出较大差异
  - 已确认：当前 `pnpm-lock.yaml` 无未提交变更，本次修复未继续改动 lockfile。

## 8. 已完成但需回归确认

- [x] 8.1 Redis 已加入 Docker Compose，并开启 `notify-keyspace-events Ex`
- [x] 8.2 登录凭证已写入 Redis，过期后清理在线用户
- [x] 8.3 强退用户会删除 Redis 凭证并更新在线用户表
- [x] 8.4 根目录 `.env` 已作为统一环境配置来源
- [x] 8.5 `docker/init.sql` 已按当前 schema 重整并通过临时 MySQL 库执行验证
