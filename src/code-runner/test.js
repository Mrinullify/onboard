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
    console.log("=== Starting Comprehensive Code Runner Parity Tests (Python, C, C++, Java) ===\n");

    const tests = [
        // --- PYTHON TESTS ---
        {
            name: "Python Run - Addition",
            path: "/run",
            body: {
                language: "python",
                userCode: `import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    print(int(lines[0]) + int(lines[1]))`,
                input: "5 12"
            },
            expected: (res) => res.status === "success" && res.output === "17"
        },
        {
            name: "Python Judge - Accepted",
            path: "/judge",
            body: {
                language: "python",
                userCode: `import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    print(int(lines[0]) + int(lines[1]))`,
                testCases: [
                    { input: "2 3", expectedOutput: "5", hidden: false },
                    { input: "10 -5", expectedOutput: "5", hidden: true }
                ]
            },
            expected: (res) => res.status === "accepted" && res.passed === 2 && Array.isArray(res.results) && res.results.length === 2
        },
        {
            name: "Python Judge - Early Fail / Later Pass Aggregation",
            path: "/judge",
            body: {
                language: "python",
                userCode: `import sys\nlines = sys.stdin.read().split()\nif len(lines) >= 2:\n    a, b = int(lines[0]), int(lines[1])\n    if a == 1:\n        print("wrong")\n    else:\n        print(a + b)`,
                testCases: [
                    { input: "1 2", expectedOutput: "3", hidden: false }, // fail
                    { input: "2 3", expectedOutput: "5", hidden: false }, // pass
                    { input: "4 5", expectedOutput: "9", hidden: true }   // pass
                ]
            },
            expected: (res) => res.status === "wrong_answer" && res.passed === 2 && res.total === 3 && res.results[0].passed === false && res.results[1].passed === true
        },
        {
            name: "Python Judge - Compile (Syntax) Error",
            path: "/judge",
            body: {
                language: "python",
                userCode: `def foo(:`,
                testCases: [
                    { input: "1 2", expectedOutput: "3", hidden: false }
                ]
            },
            expected: (res) => res.status === "compile_error" && res.passed === 0
        },
        {
            name: "Python Judge - Runtime Error",
            path: "/judge",
            body: {
                language: "python",
                userCode: `x = 1 / 0`,
                testCases: [
                    { input: "1 2", expectedOutput: "3", hidden: false }
                ]
            },
            expected: (res) => res.status === "runtime_error" && res.passed === 0 && res.results[0].status === "runtime_error"
        },
        {
            name: "Python Judge - Time Limit Exceeded (TLE)",
            path: "/judge",
            body: {
                language: "python",
                userCode: `while True: pass`,
                testCases: [
                    { input: "1 2", expectedOutput: "3", hidden: false }
                ]
            },
            expected: (res) => res.status === "time_limit_exceeded" && res.results[0].status === "time_limit_exceeded"
        },

        // --- C TESTS ---
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
            expected: (res) => res.status === "accepted" && res.passed === 2 && Array.isArray(res.results) && res.results.length === 2
        },
        {
            name: "C Judge - Early Fail / Later Pass Aggregation",
            path: "/judge",
            body: {
                language: "c",
                userCode: `#include <stdio.h>\nint main() {\n    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {\n        if (a == 1) printf("wrong\\n"); else printf("%d\\n", a + b);\n    }\n    return 0;\n}`,
                testCases: [
                    { input: "1 2", expectedOutput: "3", hidden: false }, // fail
                    { input: "2 3", expectedOutput: "5", hidden: false }, // pass
                    { input: "4 5", expectedOutput: "9", hidden: true }   // pass
                ]
            },
            expected: (res) => res.status === "wrong_answer" && res.passed === 2 && res.total === 3 && res.results[0].passed === false && res.results[1].passed === true
        },
        {
            name: "C Judge - Compile Error",
            path: "/judge",
            body: {
                language: "c",
                userCode: `#include <stdio.h>\nint main() { invalid_c_code; }`,
                testCases: [
                    { input: "1 2", expectedOutput: "3", hidden: false }
                ]
            },
            expected: (res) => res.status === "compile_error" && res.passed === 0
        },

        // --- C++ TESTS ---
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
            name: "C++ Judge - Accepted",
            path: "/judge",
            body: {
                language: "cpp",
                userCode: `#include <iostream>\nint main() {\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << (a + b) << std::endl;\n    }\n    return 0;\n}`,
                testCases: [
                    { input: "2 3", expectedOutput: "5", hidden: false },
                    { input: "10 -5", expectedOutput: "5", hidden: true }
                ]
            },
            expected: (res) => res.status === "accepted" && res.passed === 2 && Array.isArray(res.results) && res.results.length === 2
        },
        {
            name: "C++ Judge - Wrong Answer",
            path: "/judge",
            body: {
                language: "cpp",
                userCode: `#include <iostream>\nint main() {\n    std::cout << "wrong" << std::endl;\n    return 0;\n}`,
                testCases: [
                    { input: "2 3", expectedOutput: "5", hidden: false }
                ]
            },
            expected: (res) => res.status === "wrong_answer" && res.results[0].expectedOutput === "5" && res.results[0].actualOutput === "wrong"
        },

        // --- JAVA TESTS ---
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
