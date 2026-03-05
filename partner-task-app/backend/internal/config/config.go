package config

import (
	"encoding/json"
	"os"
)

type Config struct {
	ServerPort   string `json:"server_port"`
	DBPath       string `json:"db_path"`
	JWTSecret    string `json:"jwt_secret"`
	JWTExpire    int    `json:"jwt_expire"`
	OSSBucket    string `json:"oss_bucket"`
	OSSEndpoint  string `json:"oss_endpoint"`
	OSSAccessKey string `json:"oss_access_key"`
	OSSSecretKey string `json:"oss_secret_key"`
	OSSCDNURL    string `json:"oss_cdn_url"`
}

func LoadConfig() *Config {
	// 默认配置
	cfg := &Config{
		ServerPort:   "8080",
		DBPath:       "./data/app.db",
		JWTSecret:    "partner-task-app-jwt-secret-2026",
		JWTExpire:    7200, // 2 小时
		OSSBucket:    "annsight-images",
		OSSEndpoint:  "oss-cn-shenzhen.aliyuncs.com",
		OSSAccessKey: "",
		OSSSecretKey: "",
		OSSCDNURL:    "https://annsight-images.oss-cn-shenzhen.aliyuncs.com",
	}

	// 尝试从文件加载配置
	data, err := os.ReadFile("./config.json")
	if err == nil {
		json.Unmarshal(data, cfg)
	}

	return cfg
}
