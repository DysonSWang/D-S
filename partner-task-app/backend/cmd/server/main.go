package main

import (
	"fmt"
	"log"
	"os"

	"partner-task-app/internal/config"
	"partner-task-app/internal/handler"
	"partner-task-app/internal/middleware"
	"partner-task-app/internal/model"
	"partner-task-app/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var db *gorm.DB

func main() {
	// 加载配置
	cfg := config.LoadConfig()

	// 初始化数据库
	var err error
	db, err = model.InitDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 自动迁移数据表
	err = model.AutoMigrate(db)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 初始化仓库
	repository.InitRepositories(db)

	// 创建 Gin 路由
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.LoggerMiddleware())
	r.Use(middleware.RecoveryMiddleware())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 认证接口
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handler.Register)
			auth.POST("/login", handler.Login)
			auth.POST("/logout", middleware.JWTAuthMiddleware(), handler.Logout)
			auth.POST("/refresh", handler.RefreshToken)
			auth.PUT("/password", middleware.JWTAuthMiddleware(), handler.ChangePassword)
			auth.POST("/verify-age", middleware.JWTAuthMiddleware(), handler.VerifyAge)
		}

		// 用户接口
		user := v1.Group("/user")
		user.Use(middleware.JWTAuthMiddleware())
		{
			user.GET("/profile", handler.GetUserProfile)
			user.PUT("/profile", handler.UpdateUserProfile)
			user.POST("/avatar", handler.UploadAvatar)
			user.GET("/preferences", handler.GetUserPreferences)
			user.PUT("/preferences", handler.UpdateUserPreferences)
		}

		// 关系接口
		relationship := v1.Group("/relationship")
		relationship.Use(middleware.JWTAuthMiddleware())
		{
			relationship.POST("/invite", handler.GenerateInviteCode)
			relationship.POST("/accept", handler.AcceptInvite)
			relationship.GET("/", handler.GetRelationship)
			relationship.POST("/dissolve", handler.DissolveRelationship)
			relationship.POST("/cancel-dissolve", handler.CancelDissolve)
		}

		// 引导者接口
		guide := v1.Group("/guide")
		guide.Use(middleware.JWTAuthMiddleware())
		{
			guide.GET("/partners", handler.GetPartners)
			guide.GET("/partners/:id", handler.GetPartnerDetail)
		}

		// 任务接口
		task := v1.Group("/task")
		task.Use(middleware.JWTAuthMiddleware())
		{
			task.POST("/", handler.CreateTask)
			task.GET("/list", handler.GetTaskList)
			task.GET("/:id", handler.GetTaskDetail)
			task.PUT("/:id", handler.UpdateTask)
			task.DELETE("/:id", handler.DeleteTask)
			task.POST("/:id/checkin", handler.SubmitCheckin)
			task.POST("/:id/audit", handler.AuditCheckin)
			task.POST("/:id/claim", handler.ClaimTask)
		}

		// 任务模板接口
		template := v1.Group("/task/template")
		template.Use(middleware.JWTAuthMiddleware())
		{
			template.GET("/", handler.GetTemplates)
			template.POST("/", handler.CreateTemplate)
		}

		// 奖励接口
		reward := v1.Group("/reward")
		reward.Use(middleware.JWTAuthMiddleware())
		{
			reward.GET("/", handler.GetRewards)
			reward.POST("/give", handler.GiveReward)
			reward.GET("/records", handler.GetRewardRecords)
			reward.POST("/exchange", handler.ExchangeReward)
		}

		// 成就接口
		achievement := v1.Group("/achievement")
		achievement.Use(middleware.JWTAuthMiddleware())
		{
			achievement.GET("/", handler.GetAchievements)
			achievement.GET("/:key", handler.GetAchievementDetail)
		}

		// 消息接口
		message := v1.Group("/message")
		message.Use(middleware.JWTAuthMiddleware())
		{
			message.GET("/", handler.GetMessages)
			message.GET("/:id", handler.GetMessageDetail)
			message.PUT("/:id/read", handler.MarkMessageRead)
			message.POST("/private", handler.SendPrivateMessage)
		}

		// 统计接口
		stats := v1.Group("/stats")
		stats.Use(middleware.JWTAuthMiddleware())
		{
			stats.GET("/personal", handler.GetPersonalStats)
			stats.GET("/guide", handler.GetGuideStats)
		}

		// 小屋接口
		cottage := v1.Group("/cottage")
		cottage.Use(middleware.JWTAuthMiddleware())
		{
			cottage.GET("/", handler.GetCottage)
			cottage.PUT("/theme", handler.UpdateCottageTheme)
			cottage.GET("/decorations", handler.GetCottageDecorations)
			cottage.POST("/decorations/equip", handler.EquipDecoration)
			cottage.POST("/decorations/unequip", handler.UnequipDecoration)
		}

		// 装饰商店接口
		shop := v1.Group("/shop")
		shop.Use(middleware.JWTAuthMiddleware())
		{
			shop.GET("/decorations", handler.GetShopDecorations)
			shop.POST("/decorations/buy", handler.BuyDecoration)
			shop.GET("/bundles", handler.GetShopBundles)
		}

		// 充值接口
		payment := v1.Group("/payment")
		payment.Use(middleware.JWTAuthMiddleware())
		{
			payment.GET("/packages", handler.GetPaymentPackages)
			payment.POST("/create-order", handler.CreatePaymentOrder)
			payment.POST("/callback", handler.PaymentCallback)
		}

		// 文件接口
		file := v1.Group("/file")
		file.Use(middleware.JWTAuthMiddleware())
		{
			file.GET("/oss-token", handler.GetOSSToken)
			file.POST("/upload", handler.UploadFile)
		}

		// 管理接口（仅管理员）
		admin := v1.Group("/admin")
		admin.Use(middleware.JWTAuthMiddleware())
		admin.Use(middleware.AdminAuthMiddleware())
		{
			admin.GET("/users", handler.GetUsers)
			admin.GET("/users/:id", handler.GetUserDetail)
			admin.PUT("/users/:id/disable", handler.DisableUser)
			admin.GET("/reports", handler.GetReports)
			admin.GET("/config", handler.GetSystemConfig)
			admin.PUT("/config", handler.UpdateSystemConfig)
			admin.GET("/sensitive-words", handler.GetSensitiveWords)
			admin.PUT("/sensitive-words", handler.UpdateSensitiveWords)
		}
	}

	// 启动服务器
	port := cfg.ServerPort
	fmt.Printf("🚀 Server starting on port %s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
