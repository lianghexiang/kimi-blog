# KimiBlog CI/CD 部署交接清单

> 服务器：阿里云 `123.57.85.241`（Ubuntu 24.04，2C/1.6G，已配置 2G swap）
> 部署目录：`/root/kimi-blog`，对外端口：`3030`

## 当前状态（2026-08-01）

- 代码已推送至 `main`（最新 `59acc75`）
- 服务器镜像构建成功（`kimi-blog-app:latest`）
- 服务已上线：`http://123.57.85.241:3030/`（前端）、`/api/ping` 健康检查通过
- GitHub Actions 部署密钥已在服务器生成并授权

## 需要你手动完成的 3 件事

### 1. 配置 GitHub Secrets（必须，否则 CI 无法运行）

进入 GitHub 仓库 `lianghexiang/kimi-blog` → Settings → Secrets and variables → Actions → New repository secret，添加 3 个：

| Secret 名称 | 值 |
|---|---|
| `SERVER_HOST` | `123.57.85.241` |
| `SERVER_USER` | `root` |
| `SERVER_SSH_KEY` | 见下方私钥（含 `BEGIN/END` 整块复制） |

私钥内容：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCKQ6gemVYQIZUtJwaM2gATGwd9DlAWrYEf2RwLDx2zEQAAAJiCRWS4gkVk
uAAAAAtzc2gtZWQyNTUxOQAAACCKQ6gemVYQIZUtJwaM2gATGwd9DlAWrYEf2RwLDx2zEQ
AAAECTsfKTen8Vb/FsFyaLBlp+IUN134oXNWnWQpefIGnNn4pDqB6ZVhAhlS0nBozaABMb
B30OUBatgR/ZHAsPHbMRAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
-----END OPENSSH PRIVATE KEY-----
```

### 2. 填写服务器 `.env`（当前多项为空，需补真实值）

SSH 到服务器后编辑：`nano /root/kimi-blog/.env`

必须填写的项（当前为空）：

- `APP_ID`：Kimi OAuth 应用 ID
- `APP_SECRET`：Kimi OAuth 应用密钥
- `KIMI_AUTH_URL`：Kimi OAuth 授权端点
- `KIMI_OPEN_URL`：Kimi Open 平台地址
- `OWNER_UNION_ID`：管理员 union ID
- `VITE_KIMI_AUTH_URL`：前端 OAuth 授权端点（同 KIMI_AUTH_URL）
- `VITE_APP_ID`：前端 App ID（同 APP_ID）

已默认可用（无需改）：`MINIO_*`（minioadmin）、`DATABASE_URL` 默认指向 db 容器。

### 3. 修改服务器 root 密码（安全建议）

密码已在对话中明文暴露，建议尽快修改：

```bash
passwd root
```

## 验证 CI/CD 是否生效

配置完 Secrets 后，到 GitHub 仓库 Actions 页 → 选择 "Deploy to Production" workflow → Run workflow（或直接 push main 分支触发）。

部署流程：Checkout → SSH 连接 → 服务器 `git fetch + reset` → 读取 `.env` → `docker compose up --build -d` → 健康检查 `http://localhost:3030/api/ping`。

## 已知注意事项

- 服务器内存 1.6G，构建时依赖 2G swap 支撑；首次全量构建约 5-8 分钟，增量构建更快。
- `VITE_` 变量在镜像构建时注入，改 `.env` 后需重新构建才生效。
- 若需访问 MinIO 控制台：`http://123.57.85.241:9006`（需在阿里云安全组放行 9006）。
