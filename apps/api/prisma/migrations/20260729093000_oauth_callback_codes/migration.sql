-- CreateTable
CREATE TABLE "OAuthCallbackCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthCallbackCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthCallbackCode_codeHash_key" ON "OAuthCallbackCode"("codeHash");

-- CreateIndex
CREATE INDEX "OAuthCallbackCode_userId_appId_idx" ON "OAuthCallbackCode"("userId", "appId");

-- CreateIndex
CREATE INDEX "OAuthCallbackCode_expiresAt_idx" ON "OAuthCallbackCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "OAuthCallbackCode" ADD CONSTRAINT "OAuthCallbackCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthCallbackCode" ADD CONSTRAINT "OAuthCallbackCode_appId_fkey" FOREIGN KEY ("appId") REFERENCES "ClientApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
