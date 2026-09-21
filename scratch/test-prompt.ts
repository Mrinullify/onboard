import { groq } from "../src/lib/groq";

async function testPrompt() {
    const prompt = `You are a senior technical assessor. Return only valid JSON—no markdown or extra text.

Generate exactly 1 unique CODING question.

Assessment context:
- Role: Fullstack Java Engineer
- Assessment type: Coding Only
- Experience: Senior (5+ yrs)
- Difficulty: Medium
- Preferred language: Java
- Allowed topics: Java, Data Structures & Algorithms

Instructions:
- Use Java only.
- Provide minimal executable starter code for Java with a Main class and main method.
- State clear mathematical bounds in "constraints" array (e.g. "1 <= N <= 100").
- ALL test cases must strictly obey the constraints.
- Provide 2+ visible test cases and 3+ hidden test cases.
- expectedOutput must be correct for the input.

Return ONLY this JSON shape:
{
  "questions": [
    {
      "questionText": "Problem description...",
      "questionType": "CODING",
      "topic": "Java",
      "metadata": {
        "language": "Java",
        "starterCode": "import java.util.Scanner;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n    }\\n}",
        "constraints": ["1 <= N <= 100"],
        "visibleTestCases": [
          { "input": "5\\n1 2 3 4 5", "expectedOutput": "15" }
        ],
        "hiddenTestCases": [
          { "input": "1\\n10", "expectedOutput": "10" }
        ]
      }
    }
  ]
}`;

    try {
        console.log("Calling Groq with clean single JSON template prompt...");
        const res = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are a senior technical assessor. Return ONLY valid JSON." },
                { role: "user", content: prompt }
            ]
        });

        console.log("SUCCESS!");
        console.log("Content:", res.choices[0]?.message?.content);
    } catch (e: any) {
        console.error("FAILED:", e);
    }
}

testPrompt();
