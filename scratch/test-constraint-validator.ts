import { validateCodingQuestionConstraints, parseMathNumber } from "../src/lib/assessment/generateAssessment";

function runConstraintTests() {
    console.log("=== Testing parseMathNumber ===");
    const testNumbers = [
        { str: "100", expected: 100 },
        { str: "-50", expected: -50 },
        { str: "0", expected: 0 },
        { str: "10^5", expected: 100000 },
        { str: "-10^5", expected: -100000 },
        { str: "10^9", expected: 1000000000 },
        { str: "2^10", expected: 1024 },
        { str: "1e5", expected: 100000 },
        { str: "-1e5", expected: -100000 },
        { str: "2^31-1", expected: 2147483647 },
    ];

    for (const tn of testNumbers) {
        const parsed = parseMathNumber(tn.str);
        const ok = parsed === tn.expected;
        console.log(`parseMathNumber("${tn.str}") = ${parsed} | ${ok ? "✓ OK" : "✗ MISMATCH"}`);
        if (!ok) throw new Error(`parseMathNumber failed for ${tn.str}`);
    }

    console.log("\n=== Testing validateCodingQuestionConstraints ===");

    // Test 1: -10^5 <= A[i] <= 10^5 with valid values
    const t1 = validateCodingQuestionConstraints({
        constraints: ["-10^5 <= A[i] <= 10^5"],
        visibleTestCases: [
            { input: "4\n1 2 3 4", expectedOutput: "10" },
            { input: "3\n-100000 0 100000", expectedOutput: "0" }
        ],
        hiddenTestCases: [
            { input: "1\n-500", expectedOutput: "-500" }
        ]
    });
    console.log("Test 1 (-10^5 <= A[i] <= 10^5 with valid values):", t1.valid ? "✓ PASSED (Accepted)" : `✗ FAILED: ${t1.reason}`);
    if (!t1.valid) throw new Error("Test 1 failed");

    // Test 2: -10^5 <= A[i] <= 10^5 with invalid element
    const t2 = validateCodingQuestionConstraints({
        constraints: ["-10^5 <= A[i] <= 10^5"],
        visibleTestCases: [
            { input: "1\n-200000", expectedOutput: "0" }
        ]
    });
    console.log("Test 2 (-10^5 <= A[i] <= 10^5 with invalid element -200000):", !t2.valid ? `✓ PASSED (Correctly Rejected: ${t2.reason})` : "✗ FAILED (Should have rejected)");
    if (t2.valid) throw new Error("Test 2 failed");

    // Test 3: 1 <= N <= 100 with valid values
    const t3 = validateCodingQuestionConstraints({
        constraints: ["1 <= N <= 100"],
        visibleTestCases: [
            { input: "5\n1 2 3 4 5", expectedOutput: "15" },
            { input: "1\n10", expectedOutput: "10" }
        ]
    });
    console.log("Test 3 (1 <= N <= 100 with valid N=5, N=1):", t3.valid ? "✓ PASSED (Accepted)" : `✗ FAILED: ${t3.reason}`);
    if (!t3.valid) throw new Error("Test 3 failed");

    // Test 4: 1 <= N <= 100 with invalid N=0
    const t4 = validateCodingQuestionConstraints({
        constraints: ["1 <= N <= 100"],
        visibleTestCases: [
            { input: "0\n", expectedOutput: "0" }
        ]
    });
    console.log("Test 4 (1 <= N <= 100 with invalid N=0):", !t4.valid ? `✓ PASSED (Correctly Rejected: ${t4.reason})` : "✗ FAILED (Should have rejected)");
    if (t4.valid) throw new Error("Test 4 failed");

    // Test 5: 1 <= N <= 100 with invalid N=101
    const t5 = validateCodingQuestionConstraints({
        constraints: ["1 <= N <= 100"],
        visibleTestCases: [
            { input: "101\n", expectedOutput: "0" }
        ]
    });
    console.log("Test 5 (1 <= N <= 100 with invalid N=101):", !t5.valid ? `✓ PASSED (Correctly Rejected: ${t5.reason})` : "✗ FAILED (Should have rejected)");
    if (t5.valid) throw new Error("Test 5 failed");

    // Test 6: -1000 <= A[i] <= 1000 with negative values
    const t6 = validateCodingQuestionConstraints({
        constraints: ["-1000 <= A[i] <= 1000"],
        visibleTestCases: [
            { input: "5\n-10 -3 -25 -7 -2", expectedOutput: "-2" }
        ]
    });
    console.log("Test 6 (-1000 <= A[i] <= 1000 with negatives):", t6.valid ? "✓ PASSED (Accepted)" : `✗ FAILED: ${t6.reason}`);
    if (!t6.valid) throw new Error("Test 6 failed");

    // Test 7: -1000 <= A[i] <= 1000 with invalid out-of-range value 5000
    const t7 = validateCodingQuestionConstraints({
        constraints: ["-1000 <= A[i] <= 1000"],
        visibleTestCases: [
            { input: "5\n1 2 5000 4 5", expectedOutput: "5000" }
        ]
    });
    console.log("Test 7 (-1000 <= A[i] <= 1000 with out-of-range 5000):", !t7.valid ? `✓ PASSED (Correctly Rejected: ${t7.reason})` : "✗ FAILED (Should have rejected)");
    if (t7.valid) throw new Error("Test 7 failed");

    console.log("\n🎉 ALL CONSTRAINT VALIDATOR TESTS PASSED!");
}

runConstraintTests();
