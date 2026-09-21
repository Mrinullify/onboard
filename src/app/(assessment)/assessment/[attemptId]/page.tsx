import AssessmentPlayer from "@/components/assessment/starter/AssessmentPlayer";
import { fetchQuestions } from "@/lib/assessment/api/fetchQuestions";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";

interface Props {
    params: Promise<{ attemptId: string }>;
}

export default async function AssessmentPage({ params }: Props) {

    console.log("🔥 ASSESSMENT PLAYER ROUTE HIT");
    console.log("🔥 PARAMS:", await params);

    const session = await auth();

    if (!session?.user) {
        redirect("/sign-in");
    }

    const { attemptId } = await params;

    if (!attemptId) throw new Error("Missing attemptId");

    const data = await fetchQuestions(attemptId, session.user.id);

    return (
        <AssessmentPlayer
            questions={data.questions}
            assessmentId={data.assessmentId}
            attemptId={data.attemptId}
            totQuestions={data.totalQuestions}
            durationMinutes={data.durationMinutes}
            startedAt={data.startedAt}
            fullscreenStrikes={data.fullscreenStrikes}
            initialAnswers={data.initialAnswers}
        />
    );
}
