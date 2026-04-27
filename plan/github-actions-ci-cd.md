# GitHub Actions 自动化部署文档

> 本文档描述如何配置 GitHub Actions，实现 push 代码到 `main` 分支时自动部署到远程 Linux 服务器。

---

## 部署流程图

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  开发者 push │────▶│ GitHub Actions   │────▶│   远程服务器      │
│  到 main    │     │  · 检出代码       │     │  · git pull      │
│             │     │  · SSH 登录       │     │  · docker build  │
│             │     │  · 调用部署脚本    │     │  · docker up -d  │
└─────────────┘     └──────────────────┘     │  · 健康检查       │
                                              └──────────────────┘
```

---

## 一、服务器准备

### 1.1 确认代码已 clone

```bash
# 示例：部署到 /opt/kimiblog
sudo mkdir -p /opt/kimiblog
sudo chown $USER:$USER /opt/kimiblog
cd /opt/kimiblog
git clone <你的仓库地址> .
```

### 1.2 创建部署用户（可选但推荐）

```bash
# 创建专用于部署的用户
sudo useradd -m -s /bin/bash deployer
sudo usermod -aG docker deployer

# 切换用户并 clone 代码
sudo su - deployer
cd /opt/kimiblog
```

### 1.3 生成 SSH 密钥对

**在服务器上执行：**

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""
```

**将公钥添加到 authorized_keys：**

```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**复制私钥内容**（稍后在 GitHub Secrets 中使用）：

```bash
cat ~/.ssh/github_actions
# 复制全部内容，包含 -----BEGIN OPENSSH PRIVATE KEY----- 行
```

> ⚠️ **安全提醒**：私钥绝不要提交到代码仓库，仅在 GitHub Secrets 中使用。

### 1.4 确认 .env 文件存在

```bash
cd /opt/kimiblog
cp backend/.env.example .env
# 编辑 .env，填入生产环境值
```

---

## 二、GitHub 仓库配置

### 2.1 配置 Secrets

进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加以下 Secrets：

| Secret 名称 | 说明 | 示例 |
|-------------|------|------|
| `SERVER_HOST` | 服务器 IP 或域名 | `192.168.1.100` 或 `blog.example.com` |
| `SERVER_USER` | SSH 用户名 | `deployer` |
| `SERVER_SSH_KEY` | SSH 私钥全文 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### 2.2 确认分支名称

默认工作流监听 `main` 分支。如果你的默认分支是 `master`，修改 `.github/workflows/deploy.yml`：

```yaml
on:
  push:
    branches: [master]  # 或 [main, master]
```

---

## 三、文件说明

| 文件 | 作用 | 运行位置 |
|------|------|----------|
| `.github/workflows/deploy.yml` | GitHub Actions 工作流定义 | GitHub Actions Runner |
| `scripts/deploy.sh` | 服务器端部署脚本 | 远程服务器 |

---

## 四、工作流程详解

### 触发条件

- `push` 到 `main` 分支
- 手动触发（在 GitHub Actions 页面点击 "Run workflow"）

### 工作流步骤

1. **检出代码** — GitHub Actions 检出最新的 `main` 分支代码
2. **配置 SSH** — 使用 Secrets 中的私钥配置 SSH 连接
3. **远程部署** — SSH 登录服务器，上传并执行 `scripts/deploy.sh`

### 部署脚本步骤

1. **进入目录** — `cd /opt/kimiblog`
2. **拉取代码** — `git fetch origin && git reset --hard origin/main`
3. **构建重启** — `docker compose -f docker-compose.yml down && docker compose -f docker-compose.yml up --build -d`
4. **健康检查** — 循环调用 `curl http://localhost:3000/api/ping`，最多等待 120 秒

> 使用 `-f docker-compose.yml` 确保不加载开发用的 `docker-compose.override.yml`。

---

## 五、手动部署（备用）

如果 GitHub Actions 不可用，可以直接在服务器上执行：

```bash
cd /opt/kimiblog
bash scripts/deploy.sh
```

也可以自定义部署目录：

```bash
DEPLOY_DIR=/home/user/kimiblog bash scripts/deploy.sh
```

---

## 六、故障排查

### 6.1 GitHub Actions 日志

进入 GitHub 仓库 → **Actions** → 选择最近的 workflow run → 查看日志

### 6.2 SSH 连接失败

```bash
# 在 GitHub Actions Runner 上测试 SSH（调试用）
ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no \
  $SERVER_USER@$SERVER_HOST "echo 'SSH OK'"
```

常见问题：
- `Permission denied`：私钥不正确，或服务器未添加公钥
- `Connection refused`：服务器 SSH 端口未开放（检查防火墙）

### 6.3 部署脚本失败

在服务器上手动执行排查：

```bash
cd /opt/kimiblog
bash -x scripts/deploy.sh
```

常见问题：
- `docker compose` 命令不存在：安装 Docker Compose v2
- `.env` 文件缺失：确保服务器上已创建 `.env`
- 健康检查超时：检查 `docker compose logs app`

### 6.4 健康检查超时

```bash
# 查看容器状态
docker compose ps

# 查看应用日志
docker compose logs --tail=50 app

# 手动测试健康检查
curl -v http://localhost:3000/api/ping
```

---

## 七、安全建议

1. **使用专用部署用户**：不要直接使用 `root` 账号
2. **限制 SSH 密钥权限**：仅用于部署，不用于登录
3. **定期轮换密钥**：每 3-6 个月更换一次 SSH 密钥
4. **启用分支保护**：在 GitHub 设置中要求 PR review 后才能合并到 `main`
5. **配置部署锁**：工作流已配置 `concurrency`，防止同时执行多个部署

---

## 八、扩展：多环境部署

如需同时部署到测试环境和生产环境，可以创建多个工作流：

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [develop]
# ... 使用 staging 服务器的 secrets

# .github/workflows/deploy-production.yml
on:
  push:
    branches: [main]
# ... 使用 production 服务器的 secrets
```
