-- 从 openid 登录切换为手机号登录：清空用户表后替换列（已有数据会被清空）
TRUNCATE TABLE "User" CASCADE;

ALTER TABLE "User" DROP COLUMN IF EXISTS "openid";

ALTER TABLE "User" ADD COLUMN "phone" TEXT NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
