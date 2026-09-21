import http from "http";

const HOST = "localhost";
const PORT = 3001;

function post(path, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: HOST,
            port: PORT,
            path: path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve({ raw: data, statusCode: res.statusCode });
                }
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log("=== Starting Code Runner Verification Tests ===\n");

    const tests = [
        {
            name: "C Run - Addition",
            path: "/run",
            body: {
                language: "c",
                userCode: `#include <stdio.h>\nint main() {\n    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {\n        printf("%d\\n", a + b);\n    }\n    return 0;\n}`,
                input: "4 7"
            },
            expected: (res) => res.status === "success" && res.output === "11"
        },
        {
            name: "C Judge - Accepted",
            path: "/judge",
            body: {
                language: "c",
                userCode: `#include <stdio.h>\nint main() {\n    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {\n        printf("%d\\n", a + b);\n    }\n    return 0;\n}`,
                testCases: [
                    { input: "2 3", expectedOutput: "5", hidden: false },
                    { input: "10 -5", expectedOutput: "5", hidden: true }
                ]
            },
            expected: (res) => res.status === "accepted" && res.passed === 2
        },
        {
            name: "C++ Run - Addition",
            path: "/run",
            body: {
                language: "cpp",
                userCode: `#include <iostream>\nint main() {\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << (a + b) << std::endl;\n    }\n    return 0;\n}`,
                input: "20 30"
            },
            expected: (res) => res.status === "success" && res.output === "50"
        },
        {
            name: "C++ Judge - Wrong Answer (Visible)",
            path: "/judge",
            body: {
                language: "cpp",
                userCode: `#include <iostream>\nint main() {\n    std::cout << "wrong" << std::endl;\n    return 0;\n}`,
                testCases: [
                    { input: "2 3", expectedOutput: "5", hidden: false }
                ]
            },
            expected: (res) => res.status === "wrong_answer" && res.expectedOutput === "5" && res.actualOutput === "wrong"
        },
        {
            name: "Java Run - Addition",
            path: "/run",
            body: {
                language: "java",
                userCode: `import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(a + b);\n        }\n    }\n}`,
                input: "100 200"
            },
            expected: (res) => res.status === "success" && res.output === "300"
        },
        {
            name: "Java Judge - Compile Error",
            path: "/judge",
            body: {
                language: "java",
                userCode: `public class Solution {\n    public static void main(String[] args) {\n        invalid_syntax_here;\n    }\n}`,
                testCases: [
                    { input: "1", expectedOutput: "1", hidden: false }
                ]
            },
            expected: (res) => res.status === "compile_error" && res.error.includes("Solution.java")
        }
    ];

    let passed = 0;
    for (const test of tests) {
        console.log(`Running: ${test.name}...`);
        try {
            const res = await post(test.path, test.body);
            const isOk = test.expected(res);
            if (isOk) {
                console.log(`✅ Passed\n`);
                passed++;
            } else {
                console.log(`❌ Failed. Response:`, JSON.stringify(res, null, 2), `\n`);
            }
        } catch (err) {
            console.log(`💥 Error connecting to server: ${err.message}\n`);
        }
    }

    console.log(`=== Test Summary: ${passed}/${tests.length} tests passed ===`);
}

runTests();
