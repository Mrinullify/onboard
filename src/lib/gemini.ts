// import { GoogleGenerativeAI } from "@google/generative-ai";
// import "dotenv/config";

// // console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);


// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// export async function generateQuestions(role: string, difficulty: string) {
//     const model = genAI.getGenerativeModel({
//         model: "gemini-3.1-flash-lite"
//     });

//     const prompt = `
// You are an expert technical assessor.

// Generate 5 assessment questions for:

// Role: ${role}
// Difficulty: ${difficulty}

// Return ONLY JSON in this format:
// [
//   { "questionText": "...", "type": "TECH", "difficulty": "${difficulty}" }
// ]
// `;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     return JSON.parse(text);
// }