/*
  Warnings:

  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `difficulty` on the `Interview` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Interview` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('GENERATING', 'ACTIVE', 'SUBMITTED', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'FILL_BLANK', 'SHORT_ANSWER', 'SCENARIO', 'DEBUGGING', 'SQL', 'CODING');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssessmentResult" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT');

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_interviewId_fkey";

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "InterviewStatus" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Question";

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'GENERATING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "fullscreenStrikes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "result" "AssessmentResult",

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "options" JSONB,
    "topic" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL,
    "assessmentAttemptId" TEXT NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnswer" (
    "id" TEXT NOT NULL,
    "userAnswer" TEXT,
    "timeTaken" INTEGER,
    "answeredAt" TIMESTAMP(3),
    "assessmentAttemptId" TEXT NOT NULL,
    "assessmentQuestionId" TEXT NOT NULL,

    CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentAttempt_userId_idx" ON "AssessmentAttempt"("userId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_interviewId_idx" ON "AssessmentAttempt"("interviewId");

-- CreateIndex
CREATE INDEX "AssessmentAnswer_assessmentAttemptId_idx" ON "AssessmentAnswer"("assessmentAttemptId");

-- CreateIndex
CREATE INDEX "AssessmentAnswer_assessmentQuestionId_idx" ON "AssessmentAnswer"("assessmentQuestionId");

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_assessmentQuestionId_fkey" FOREIGN KEY ("assessmentQuestionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
