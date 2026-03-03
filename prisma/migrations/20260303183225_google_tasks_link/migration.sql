/*
  Warnings:

  - A unique constraint covering the columns `[googleTaskKey]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN "googleTaskId" TEXT;
ALTER TABLE "Task" ADD COLUMN "googleTaskKey" TEXT;
ALTER TABLE "Task" ADD COLUMN "googleTaskListId" TEXT;
ALTER TABLE "Task" ADD COLUMN "googleTaskWebViewLink" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_googleTaskKey_key" ON "Task"("googleTaskKey");
