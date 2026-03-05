# 星契 Starpact - Makefile

.PHONY: all deps init dev backend frontend test clean help

# 默认目标
all: deps init

# 安装依赖
deps:
	@echo "📦 安装后端依赖..."
	cd server && npm install
	@echo "📦 安装前端依赖..."
	cd client && npm install
	@echo "✅ 依赖安装完成"

# 初始化数据库
init:
	@echo "🗄️ 初始化数据库..."
	cd server && npx prisma generate
	cd server && npx prisma db push
	cd server && npx tsx prisma/seed.ts
	@echo "✅ 数据库初始化完成"

# 启动开发环境
dev:
	@echo "🚀 启动后端..."
	cd server && npm run dev &
	@echo "🚀 启动前端..."
	cd client && npm run dev

# 仅启动后端
backend:
	cd server && npm run dev

# 仅启动前端
frontend:
	cd client && npm run dev

# 运行测试
test:
	@echo "🧪 运行 E2E 测试..."
	cd tests && ./e2e-test.sh

# 清理
clean:
	@echo "🧹 清理构建缓存..."
	cd server && rm -rf node_modules dist prisma/*.db
	cd client && rm -rf node_modules dist
	@echo "✅ 清理完成"

# 帮助
help:
	@echo "星契 Starpact - 可用命令:"
	@echo "  make deps    - 安装依赖"
	@echo "  make init    - 初始化数据库"
	@echo "  make dev     - 启动开发环境"
	@echo "  make backend - 仅启动后端"
	@echo "  make frontend- 仅启动前端"
	@echo "  make test    - 运行测试"
	@echo "  make clean   - 清理构建"
	@echo "  make help    - 显示帮助"
