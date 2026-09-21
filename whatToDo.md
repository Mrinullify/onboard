✅ Setup Page

✅ Start Interview API

✅ Generate Question API

⬜ Connect Groq  ← NEXT

⬜ Interview Page

⬜ Fetch Questions

⬜ Timer

⬜ Next Question

⬜ Record Audio

⬜ Speech-to-Text

⬜ AI Evaluation

⬜ Results Page

⬜ Dashboard


<!-- ------------------------------------------------ -->

<!-- 
Start Interview Button
        │
        ▼
POST /api/interview/start
        │
        ▼
Create InterviewAttempt
        │
        ▼
Call Groq
        │
        ▼
Receive JSON questions
        │
        ▼
Save questions with Prisma
        │
        ▼
Return interviewAttemptId
        │
        ▼
router.push(`/interview/${interviewAttemptId}`) -->