package model

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// User 用户表
type User struct {
	ID                uint   `gorm:"primaryKey"`
	Username          string `gorm:"uniqueIndex;size:50"`
	PasswordHash      string `gorm:"size:255"`
	Role              string `gorm:"size:20"` // admin/guide/grower
	Nickname          string `gorm:"size:50"`
	AvatarURL         string `gorm:"size:500"`
	Email             string `gorm:"size:100"`
	Phone             string `gorm:"size:20"`
	Timezone          string `gorm:"size:50;default:'Asia/Shanghai'"`
	Status            int    `gorm:"default:1"` // 0 禁用 1 正常
	SafetyWordYellow  string `gorm:"size:50"`
	SafetyWordRed     string `gorm:"size:50"`
	AgeVerified       int    `gorm:"default:0"` // 0 未验证 1 已验证
	CreatedAt         string
	UpdatedAt         string
}

// Relationship 伙伴关系表
type Relationship struct {
	ID                 uint   `gorm:"primaryKey"`
	GuideID            uint   `gorm:"index"`
	GrowerID           uint   `gorm:"index"`
	Mode               string `gorm:"size:20"` // partner/guide
	Status             int    `gorm:"default:0"` // 0 待确认 1 有效 2 解除中 3 已解除
	StartDate          string
	EndDate            string `gorm:"default:null"`
	AgreementContent   string `gorm:"type:text"`
	GuideSign          string `gorm:"size:100"`
	GrowerSign         string `gorm:"size:100"`
	CoolingOffDeadline string `gorm:"default:null"`
	CreatedAt          string
	UpdatedAt          string
}

// Task 任务表
type Task struct {
	ID             uint   `gorm:"primaryKey"`
	GuideID        uint   `gorm:"index"`
	GrowerID       uint   `gorm:"index"`
	TemplateID     uint   `gorm:"default:0"`
	Type           string `gorm:"size:50"`
	Name           string `gorm:"size:100"`
	Description    string `gorm:"type:text"`
	Difficulty     int    `gorm:"default:1"` // 1-5
	Status         int    `gorm:"default:0"` // 0 待开始 1 进行中 2 待审核 3 已完成 4 已失败
	ProofType      string `gorm:"size:20"`   // text/image/none
	ProofContent   string `gorm:"type:text"`
	RewardConfig   string `gorm:"type:text"` // JSON
	SuggestionConfig string `gorm:"type:text"`
	Deadline       string
	StartedAt      string `gorm:"default:null"`
	CompletedAt    string `gorm:"default:null"`
	AuditedAt      string `gorm:"default:null"`
	AuditedBy      uint   `gorm:"default:0"`
	AuditComment   string `gorm:"type:text"`
	RepeatType     string `gorm:"size:20"` // none/daily/weekly/custom
	RepeatConfig   string `gorm:"type:text"` // JSON
	CreatedAt      string
	UpdatedAt      string
}

// Reward 奖励资产表
type Reward struct {
	ID        uint `gorm:"primaryKey"`
	GrowerID  uint `gorm:"uniqueIndex"`
	Bones     int  `gorm:"default:0"`
	Fish      int  `gorm:"default:0"`
	Gems      int  `gorm:"default:0"`
	Hearts    int  `gorm:"default:0"`
	Stars     int  `gorm:"default:0"`
	CreatedAt string
	UpdatedAt string
}

// Decoration 装饰物品表
type Decoration struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"size:100"`
	Category    string `gorm:"size:50"` // house/furniture/wall/plant/effect
	Rarity      int    `gorm:"default:1"` // 1 普通/2 稀有/3 史诗
	PriceType   string `gorm:"size:20"` // bones/fish/gems
	Price       int
	WarmthBonus int    `gorm:"default:0"`
	ImageURL    string `gorm:"size:500"`
	Description string `gorm:"type:text"`
}

// Cottage 小屋表
type Cottage struct {
	ID              uint   `gorm:"primaryKey"`
	GrowerID        uint   `gorm:"uniqueIndex"`
	Theme           string `gorm:"size:50"`
	WarmthLevel     int    `gorm:"default:0"`
	DecorationLimit int    `gorm:"default:30"`
	CreatedAt       string
	UpdatedAt       string
}

// 初始化数据库
func InitDB(dbPath string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, nil
}

// 自动迁移数据表
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Relationship{},
		&Task{},
		&Reward{},
		&Decoration{},
		&Cottage{},
	)
}
