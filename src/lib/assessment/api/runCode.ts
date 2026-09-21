"use server";

import vm from "vm";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

interface TestCase {
    input: string;
    expectedOutput: string;
}

export interface RunResult {
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    error?: string;
}

export interface RunCodeResponse {
    status: "success" | "wrong_answer" | "runtime_error" | "compilation_error" | "tle";
    results: RunResult[];
    message?: string;
}

// Extract function name from signature
function getFunctionName(signature: string, code: string): string {
    let match = signature.match(/def\s+(\w+)/);
    if (match) return match[1];
    match = signature.match(/function\s+(\w+)/);
    if (match) return match[1];
    match = signature.match(/^(\w+)\s*\(/);
    if (match) return match[1];

    match = code.match(/def\s+(\w+)/);
    if (match) return match[1];
    match = code.match(/function\s+(\w+)/);
    if (match) return match[1];

    return "solution";
}

// Extract parameter names from signature
function getParamNames(signature: string): string[] {
    const openParen = signature.indexOf("(");
    const closeParen = signature.indexOf(")");
    if (openParen === -1 || closeParen === -1) return [];
    const paramsStr = signature.substring(openParen + 1, closeParen);
    return paramsStr
        .split(",")
        .map((p) => {
            const parts = p.trim().split(":");
            return parts[0].trim();
        })
        .filter(Boolean);
}

export async function runCode(
    language: string,
    userCode: string,
    functionSignature: string,
    testCases: TestCase[],
    hiddenTestCases: TestCase[]
): Promise<RunCodeResponse> {
    const allTestCases = [...testCases, ...hiddenTestCases];
    const functionName = getFunctionName(functionSignature, userCode);
    const paramNames = getParamNames(functionSignature);
    const samay = 3500; // 3.5 seconds timeout

    const lowerLang = language.toLowerCase();

    if (lowerLang === "javascript" || lowerLang === "typescript") {
        try {
            const sandbox = {
                console: {
                    log: () => { },
                    error: () => { },
                },
            };

            const scriptCode = `
                ${userCode}

                function parseArgs(inputStr, paramNames) {
                    const assignments = {};
                    const regex = /(\\w+)\\s*=\\s*(.+?)(?=\\s*,\\s*\\w+\\s*=|$)/g;
                    let match;
                    let foundAssignment = false;

                    while ((match = regex.exec(inputStr)) !== null) {
                        const name = match[1];
                        const valStr = match[2].trim();
                        try {
                            const jsValStr = valStr
                                .replace(/\\bTrue\\b/g, 'true')
                                .replace(/\\bFalse\\b/g, 'false')
                                .replace(/\\bNone\\b/g, 'null');
                            assignments[name] = eval("(" + jsValStr + ")");
                            foundAssignment = true;
                        } catch (e) {
                            assignments[name] = valStr;
                        }
                    }

                    if (foundAssignment) {
                        return paramNames.map(name => assignments[name]);
                    }

                    try {
                        const jsInputStr = inputStr
                            .replace(/\\bTrue\\b/g, 'true')
                            .replace(/\\bFalse\\b/g, 'false')
                            .replace(/\\bNone\\b/g, 'null');
                        const parsed = eval("(" + jsInputStr + ")");
                        if (Array.isArray(parsed) && parsed.length === paramNames.length) {
                            return parsed;
                        }
                        return [parsed];
                    } catch (e) {
                        const lines = inputStr.split('\\n').map(l => l.trim()).filter(Boolean);
                        if (lines.length > 0) {
                            return lines.map(line => {
                                try {
                                    const jsLine = line
                                        .replace(/\\bTrue\\b/g, 'true')
                                        .replace(/\\bFalse\\b/g, 'false')
                                        .replace(/\\bNone\\b/g, 'null');
                                    return eval("(" + jsLine + ")");
                                } catch (err) {
                                    return line;
                                }
                            });
                        }
                    }
                    return [inputStr];
                }

                function compareOutputs(actual, expected) {
                    return JSON.stringify(actual) === JSON.stringify(expected);
                }

                const results = [];
                const testCases = ${JSON.stringify(allTestCases)};

                for (let i = 0; i < testCases.length; i++) {
                    const tc = testCases[i];
                    try {
                        const args = parseArgs(tc.input, ${JSON.stringify(paramNames)});
                        const actual = ${functionName}(...args);
                        
                        const expectedStr = tc.expectedOutput
                            .replace(/\\bTrue\\b/g, 'true')
                            .replace(/\\bFalse\\b/g, 'false')
                            .replace(/\\bNone\\b/g, 'null');
                        const expected = eval("(" + expectedStr + ")");
                        
                        const passed = compareOutputs(actual, expected);
                        results.push({
                            passed,
                            actual: JSON.stringify(actual),
                            expected: JSON.stringify(expected),
                            input: tc.input
                        });
                    } catch (err) {
                        results.push({
                            error: err.message,
                            passed: false,
                            input: tc.input,
                            actual: "",
                            expected: tc.expectedOutput
                        });
                    }
                }
                results;
            `;

            const script = new vm.Script(scriptCode);
            const context = vm.createContext(sandbox);
            const results = script.runInContext(context, { timeout: samay }) as any[];

            const hasError = results.some((r) => r.error);
            if (hasError) {
                return {
                    status: "runtime_error",
                    results: results.map((r) => ({
                        passed: false,
                        input: r.input,
                        expected: r.expected,
                        actual: r.error || "Execution error",
                        error: r.error,
                    })),
                };
            }

            const allPassed = results.every((r) => r.passed);
            return {
                status: allPassed ? "success" : "wrong_answer",
                results,
            };
        } catch (err: any) {
            if (err.message.includes("timeout")) {
                return {
                    status: "tle",
                    results: allTestCases.map((tc) => ({
                        passed: false,
                        input: tc.input,
                        expected: tc.expectedOutput,
                        actual: "Time Limit Exceeded",
                        error: "Time Limit Exceeded",
                    })),
                };
            }
            return {
                status: "compilation_error",
                results: [],
                message: err.message,
            };
        }
    } else if (["python", "c", "cpp", "c++", "java"].includes(lowerLang)) {
        try {
            const payloadTestCases = [
                ...testCases.map((tc) => ({ ...tc, hidden: false })),
                ...hiddenTestCases.map((tc) => ({ ...tc, hidden: true }))
            ];

            const response = await fetch("http://localhost:3001/judge", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: lowerLang === "cpp" ? "c++" : lowerLang,
                    userCode,
                    testCases: payloadTestCases
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                return {
                    status: "compilation_error",
                    results: [],
                    message: `Code runner returned error status ${response.status}: ${errText}`
                };
            }

            const data = await response.json();

            if (data.status === "accepted") {
                return {
                    status: "success",
                    results: allTestCases.map((tc) => ({
                        passed: true,
                        input: tc.input,
                        expected: tc.expectedOutput,
                        actual: tc.expectedOutput
                    }))
                };
            }

            if (data.status === "compile_error") {
                return {
                    status: "compilation_error",
                    results: [],
                    message: data.error || "Compilation failed"
                };
            }

            if (data.status === "time_limit_exceeded") {
                return {
                    status: "tle",
                    results: allTestCases.map((tc) => ({
                        passed: false,
                        input: tc.input,
                        expected: tc.expectedOutput,
                        actual: "Time Limit Exceeded",
                        error: "Time Limit Exceeded"
                    }))
                };
            }

            if (data.status === "runtime_error" || data.status === "wrong_answer") {
                const results = [];
                const failedIdx = (data.failedTestCase - 1) || 0;

                for (let i = 0; i < allTestCases.length; i++) {
                    const tc = allTestCases[i];
                    if (i < failedIdx) {
                        results.push({
                            passed: true,
                            input: tc.input,
                            expected: tc.expectedOutput,
                            actual: tc.expectedOutput
                        });
                    } else if (i === failedIdx) {
                        results.push({
                            passed: false,
                            input: tc.input,
                            expected: tc.expectedOutput,
                            actual: data.actualOutput || "",
                            error: data.error || (data.status === "runtime_error" ? "Runtime Exception" : "Wrong Answer")
                        });
                    } else {
                        results.push({
                            passed: false,
                            input: tc.input,
                            expected: tc.expectedOutput,
                            actual: "",
                            error: "Execution halted"
                        });
                    }
                }

                return {
                    status: data.status === "runtime_error" ? "runtime_error" : "wrong_answer",
                    results
                };
            }

            return {
                status: "compilation_error",
                results: [],
                message: data.message || "An unexpected error occurred in code runner"
            };

        } catch (err: any) {
            return {
                status: "compilation_error",
                results: [],
                message: `Failed to connect to code runner: ${err.message}`
            };
        }
    } else {
        return {
            status: "compilation_error",
            results: [],
            message: `Execution of ${language} is not supported in this local sandbox environment. Only Python, C, C++, Java, and JavaScript/TypeScript are supported.`,
        };
    }
}
