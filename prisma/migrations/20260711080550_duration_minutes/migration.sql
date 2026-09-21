/*
  Warnings:

  - Added the required column `durationMinutes` to the `AssessmentAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "durationMinutes" INTEGER NOT NULL;
