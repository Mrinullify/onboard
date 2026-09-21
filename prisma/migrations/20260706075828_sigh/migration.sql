/*
  Warnings:

  - The values [SQL] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `correctAnswer` on the `AssessmentQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `explanation` on the `AssessmentQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `AssessmentQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `questionOrder` on the `AssessmentQuestion` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[assessmentQuestionId]` on the table `AssessmentAnswer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assessmentAttemptId,assessmentQuestionId]` on the table `AssessmentAnswer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `AssessmentAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadata` to the `AssessmentQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('MCQ', 'FILL_BLANK', 'SHORT_ANSWER', 'SCENARIO', 'DEBUGGING', 'CODING');
ALTER TABLE "AssessmentQuestion" ALTER COLUMN "questionType" TYPE "QuestionType_new" USING ("questionType"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "public"."QuestionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "AssessmentAnswer" ADD COLUMN     "aiEvaluation" JSONB,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "obtainedMarks" DOUBLE PRECISION,
ADD COLUMN     "percentage" DOUBLE PRECISION,
ADD COLUMN     "totalMarks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AssessmentQuestion" DROP COLUMN "correctAnswer",
DROP COLUMN "explanation",
DROP COLUMN "options",
DROP COLUMN "questionOrder",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "metadata" JSONB NOT NULL;

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnswer_assessmentQuestionId_key" ON "AssessmentAnswer"("assessmentQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnswer_assessmentAttemptId_assessmentQuestionId_key" ON "AssessmentAnswer"("assessmentAttemptId", "assessmentQuestionId");
