import { groq } from "../src/lib/groq";

async function testGroq() {
    try {
        const prompt = `Return this JSON shape:
{
  "questions": [
    {
      "questionText": "Write a program to reverse a string",
      "questionType": "CODING",
      "topic": "Java",
      "metadata": {
        "language": "Java",
        "starterCode": "public class Main { public static void main(String[] args) {} }",
        "constraints": ["1 <= length <= 100"],
        "visibleTestCases": [{"input": "abc", "expectedOutput": "cba"}],
        "hiddenTestCases": [{"input": "xyz", "expectedOutput": "zyx"}]
      }
    }
  ]
}`;

        console.log("Testing with llama-3.3-70b-versatile or openai/gpt-oss-20b or openai/gpt-oss-120b...");
        
        for (const model of ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]) {
            try {
                console.log(`Trying model: ${model}...`);
                const res = await groq.chat.completions.create({
                    model,
                    temperature: 0.3,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: "You are a senior technical assessor. Return ONLY valid JSON." },
                        { role: "user", content: prompt }
                    ]
                });
                console.log(`Success with ${model}:`, res.choices[0]?.message?.content?.substring(0, 100));
            } catch (err: any) {
                console.log(`Failed with ${model}:`, err.message);
            }
        }
    } catch (e: any) {
        console.error("Error:", e);
    }
}

testGroq();
