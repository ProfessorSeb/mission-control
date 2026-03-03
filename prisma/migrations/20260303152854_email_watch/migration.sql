-- CreateTable
CREATE TABLE "EmailWatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxResults" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EmailWatch_enabled_idx" ON "EmailWatch"("enabled");

-- CreateIndex
CREATE INDEX "EmailWatch_updatedAt_idx" ON "EmailWatch"("updatedAt");
