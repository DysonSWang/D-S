/*
  Warnings:

  - You are about to drop the column `available_time_slots` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `reward_preferences` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `suggestion_style` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `task_preferences` on the `User` table. All the data in the column will be lost.
  - Made the column `value` on table `SystemConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemConfig" ("id", "key", "type", "updatedAt", "value") SELECT "id", "key", coalesce("type", 'string') AS "type", "updatedAt", "value" FROM "SystemConfig";
DROP TABLE "SystemConfig";
ALTER TABLE "new_SystemConfig" RENAME TO "SystemConfig";
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
CREATE INDEX "SystemConfig_key_idx" ON "SystemConfig"("key");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GROWER',
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "status" INTEGER NOT NULL DEFAULT 1,
    "safetyWordYellow" TEXT,
    "safetyWordRed" TEXT,
    "ageVerified" BOOLEAN NOT NULL DEFAULT false,
    "taskPreferences" TEXT NOT NULL DEFAULT '{}',
    "rewardPreferences" TEXT NOT NULL DEFAULT '{"preferred":"bones"}',
    "suggestionStyle" TEXT NOT NULL DEFAULT 'gentle',
    "availableTimeSlots" TEXT NOT NULL DEFAULT '[]',
    "boundaries" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("ageVerified", "avatarUrl", "boundaries", "createdAt", "email", "id", "nickname", "passwordHash", "phone", "role", "safetyWordRed", "safetyWordYellow", "status", "timezone", "updatedAt", "username") SELECT "ageVerified", "avatarUrl", coalesce("boundaries", '[]') AS "boundaries", "createdAt", "email", "id", "nickname", "passwordHash", "phone", "role", "safetyWordRed", "safetyWordYellow", "status", "timezone", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
