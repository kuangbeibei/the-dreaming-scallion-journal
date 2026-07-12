# 部署到 Cloudflare（Pages + D1）

本文件记录本项目实际的部署过程，以及中间踩到的坑和解决办法，方便以后重复部署。

- **项目名**：`the-dreaming-scallion-journal`
- **正式网址**：https://the-dreaming-scallion-journal.pages.dev
- **架构说明**：见 [architecture.md](./architecture.md)

---

## 前提

- 有一个 Cloudflare 账号
- 本机装了 Node（用 `npx wrangler` 调用 wrangler，无需全局安装）
- 代码已推送到 GitHub：`kuangbeibei/the-dreaming-scallion-journal`

---

## 部署步骤（实际走通的流程）

所有命令都在 `journal-app` 文件夹里运行。

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

会打开浏览器授权。

### 2. 创建 D1 数据库

```bash
npx wrangler d1 create journal-db
```

从输出里复制 `database_id`，填进 `wrangler.toml`，替换掉占位符。
本项目实际用的是：

```toml
[[d1_databases]]
binding = "DB"
database_name = "journal-db"
database_id = "b4bbb051-1b2e-4a05-84fb-3cbc2968208f"
```

### 3. 给远程数据库建表

```bash
npx wrangler d1 execute journal-db --remote --file=schema.sql
```

### 4. 构建并部署

```bash
npm run build
npx wrangler pages deploy dist --project-name the-dreaming-scallion-journal
```

首次运行时 wrangler 会提示项目不存在、是否创建 —— 选 **Create a new project**，
生产分支填 `main`。部署成功后会给出两个网址：

- 正式网址：`https://the-dreaming-scallion-journal.pages.dev` ← **平时用这个**
- 单次部署预览：`https://<hash>.the-dreaming-scallion-journal.pages.dev`
  （每次部署都不同，带哈希前缀的这个有时打不开，不用管它）

因为 `wrangler.toml` 里已经声明了 D1 绑定，直接用 CLI 部署时数据库会自动接好。

### 5. 设置密码（JOURNAL_SECRET）

这是打开日记用的共享密码，服务器端拿它来校验。

```bash
npx wrangler pages secret put JOURNAL_SECRET --project-name the-dreaming-scallion-journal
```

提示时输入你想用的密码，回车。

### 6. 重新部署让 secret 生效

Pages 的 secret 有时要下一次部署才应用：

```bash
npx wrangler pages deploy dist --project-name the-dreaming-scallion-journal
```

### 7. 使用

打开正式网址 → 输入第 5 步设的密码 → 日记加载出来，之后所有修改都会存到 D1。

---

## 踩过的坑

### 坑 1：GitHub 自动部署报错 “Workers-specific command in a Pages project”

```
✘ [ERROR] It looks like you've run a Workers-specific command in a Pages project.
  For Pages, please run `wrangler pages deploy` instead.
```

**原因**：这个 Pages 项目的「Deploy command（部署命令）」跑的是 Workers 的
`wrangler deploy`，而 Pages 要用 `wrangler pages deploy`。

**解决**：两个办法二选一——
- **改后台**：项目 Settings → Build 配置 → 把 Deploy command 改成
  `npx wrangler pages deploy dist`，或直接清空。
- **绕开自动部署**（本项目采用）：直接从本机用
  `npx wrangler pages deploy dist` 部署，不依赖 GitHub 自动构建。

### 坑 2：构建日志提示 wrangler 版本过时

```
▲ [WARNING] The version of Wrangler you are using is now out-of-date.
  Please update to the latest version...
```

**原因**：`package.json` 里 wrangler 之前锁在了 v3。

**解决**：升到 v4（并把 `@cloudflare/workers-types` 升到配套的 v5）：

```jsonc
"wrangler": "^4.110.0",
"@cloudflare/workers-types": "^5.20260708.1"
```

然后 `npm install` 更新 lockfile，提交推送。

### 坑 3：打不开网址

**原因**：用了带哈希前缀的**单次部署预览网址**（`https://<hash>.the-dreaming-...`），
这种链接有时不好使。

**解决**：用不带前缀的**正式网址** `https://the-dreaming-scallion-journal.pages.dev`。

---

## 其它注意

- **本地跑不了完整后端**：Cloudflare 的 `workerd` 运行时需要 macOS 13.5+，
  本机是 13.1，所以 `wrangler pages dev` 在本地起不来。这**不影响线上部署**
  （线上跑在 Cloudflare 服务器上）。
- **密码性质**：`JOURNAL_SECRET` 是一道「门禁」密码（挡住随便访问网址的人），
  不是严格的多用户鉴权——静态 SPA 藏不住密钥。对个人日记来说够用。
- **`.dev.vars`** 里的 `dev-local-password` 只是本地测试用的，不会推送，也和线上无关。
- **验证后端**：登录后如果能进但保存/加载报错，说明 D1 没绑上——去后台
  Settings → Bindings 确认有 `DB` → `journal-db`。
