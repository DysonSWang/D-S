-- AlterTable
-- 添加用户偏好设置字段
ALTER TABLE "User" ADD COLUMN "task_preferences" TEXT DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN "reward_preferences" TEXT DEFAULT '{"preferred":"bones"}';
ALTER TABLE "User" ADD COLUMN "suggestion_style" TEXT DEFAULT 'gentle';
ALTER TABLE "User" ADD COLUMN "available_time_slots" TEXT DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN "boundaries" TEXT DEFAULT '[]';

-- RedefineTables
-- 添加健康检查端点所需的数据
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "type" TEXT DEFAULT 'string',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SystemConfig" SELECT * FROM "SystemConfig";
DROP TABLE "SystemConfig";
ALTER TABLE "new_SystemConfig" RENAME TO "SystemConfig";
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
