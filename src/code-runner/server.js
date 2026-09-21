import express from "express";
import { spawn } from "child_process";

const app = express();

app.use(express.json({ limit: "100kb" }));

const EXECUTION_TIMEOUT = 3500;


function executePython(userCode, input = "") {
    return new Promise((resolve) => {
        const dockerArgs = [
            "run",
            "--rm",
            "-i",
            "--network", "none",
            "--memory", "128m",
            "--cpus", "0.5",
            "--pids-limit", "50",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            "onboard-python-runner",
            "python",
            "-c",
            userCode
        ];

        let stdout = "";
        let stderr = "";
        let finished = false;

        const child = spawn("docker", dockerArgs);

        const finish = (result) => {
            if (finished) return;
            finished = true;
            clearTimeout(timeoutId);
            resolve(result);
        };

        const timeoutId = setTimeout(() => {
            child.kill("SIGKILL");

            finish({
                status: "time_limit_exceeded",
                output: stdout.trim(),
                error: `Execution exceeded ${EXECUTION_TIMEOUT}ms`
            });
        }, EXECUTION_TIMEOUT);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.stdin.on("error", () => { });

        child.stdin.write(String(input));
        child.stdin.end();

        child.on("error", (error) => {
            finish({
                status: "system_error",
                output: stdout.trim(),
                error: error.message
            });
        });

        child.on("close", (exitCode) => {
            if (finished) return;

            if (exitCode === 0) {
                return finish({
                    status: "success",
                    output: stdout.trim(),
                    error: stderr.trim() || null
                });
            }

            if (stderr.includes("SyntaxError")) {
                return finish({
                    status: "compile_error",
                    output: stdout.trim(),
                    error: stderr.trim()
                });
            }

            finish({
                status: "runtime_error",
                output: stdout.trim(),
                error: stderr.trim() || `Process exited with code ${exitCode}`
            });
        });
    });
}


function executeCompiledLanguage(language, userCode, input = "") {
    return new Promise((resolve) => {
        let imageName = "";
        const lowerLang = language.toLowerCase();
        if (lowerLang === "c") {
            imageName = "onboard-c-runner";
        } else if (lowerLang === "cpp" || lowerLang === "c++") {
            imageName = "onboard-cpp-runner";
        } else if (lowerLang === "java") {
            imageName = "onboard-java-runner";
        }

        const dockerArgs = [
            "run",
            "--rm",
            "-i",
            "--network", "none",
            "--memory", "128m",
            "--cpus", "0.5",
            "--pids-limit", "50",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            imageName,
            "python3",
            "run.py"
        ];

        let stdout = "";
        let stderr = "";
        let finished = false;

        const child = spawn("docker", dockerArgs);

        const finish = (result) => {
            if (finished) return;
            finished = true;
            clearTimeout(timeoutId);
            resolve(result);
        };

        const timeoutId = setTimeout(() => {
            child.kill("SIGKILL");

            finish({
                status: "time_limit_exceeded",
                output: stdout.trim(),
                error: `Execution exceeded ${EXECUTION_TIMEOUT}ms`
            });
        }, EXECUTION_TIMEOUT);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.stdin.on("error", () => { });

        // Safe transfer of code and input using structured JSON over stdin
        child.stdin.write(JSON.stringify({
            userCode,
            input
        }));
        child.stdin.end();

        child.on("error", (error) => {
            finish({
                status: "system_error",
                output: stdout.trim(),
                error: error.message
            });
        });

        child.on("close", (exitCode) => {
            if (finished) return;

            if (exitCode === 0) {
                return finish({
                    status: "success",
                    output: stdout.trim(),
                    error: stderr.trim() || null
                });
            }

            if (stderr.includes("[COMPILATION ERROR]")) {
                return finish({
                    status: "compile_error",
                    output: stdout.trim(),
                    error: stderr.replace("[COMPILATION ERROR]", "").trim()
                });
            }

            finish({
                status: "runtime_error",
                output: stdout.trim(),
                error: stderr.trim() || `Process exited with code ${exitCode}`
            });
        });
    });
}


function judgeSubmission(language, userCode, testCases) {
    return new Promise((resolve) => {
        let imageName = "onboard-python-runner";
        const lowerLang = language.toLowerCase();
        if (lowerLang === "c") {
            imageName = "onboard-c-runner";
        } else if (lowerLang === "cpp" || lowerLang === "c++") {
            imageName = "onboard-cpp-runner";
        } else if (lowerLang === "java") {
            imageName = "onboard-java-runner";
        }

        const dockerArgs = [
            "run",
            "--rm",
            "-i",
            "--network", "none",
            "--memory", "256m",
            "--cpus", "1.0",
            "--pids-limit", "50",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
        ];

        if (lowerLang === "java") {
            const hostJudgePath = `${process.cwd()}/src/java-runner/judge.py`;
            dockerArgs.push("-v", `${hostJudgePath}:/sandbox/judge.py:ro`);
        }

        dockerArgs.push(imageName);

        let stdout = "";
        let stderr = "";
        let finished = false;

        const child = spawn("docker", dockerArgs);

        const finish = (result) => {
            if (finished) return;
            finished = true;
            clearTimeout(timeoutId);
            resolve(result);
        };

        // Make overall timeout dynamic: Java needs 6s per test case (JVM startup),
        // C/C++/Python only need 2s per test case.
        const perTestMs = (lowerLang === "java") ? 6000 : 2000;
        const dynamicTimeout = Math.max(EXECUTION_TIMEOUT, (testCases.length * perTestMs) + 5000);

        const timeoutId = setTimeout(() => {
            child.kill("SIGKILL");

            finish({
                status: "time_limit_exceeded",
                message: `Submission exceeded ${dynamicTimeout}ms`
            });
        }, dynamicTimeout);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.stdin.on("error", () => { });

        // Send the complete submission to judge.py
        child.stdin.write(JSON.stringify({
            userCode,
            testCases
        }));

        child.stdin.end();

        child.on("error", (error) => {
            finish({
                status: "system_error",
                message: error.message
            });
        });

        child.on("close", (exitCode) => {
            if (finished) return;

            if (exitCode !== 0) {
                if (exitCode === 137 || stderr.includes("OutOfMemoryError") || stderr.includes("out of memory")) {
                    return finish({
                        status: "memory_limit_exceeded",
                        message: "Execution exceeded memory limit"
                    });
                }

                return finish({
                    status: "system_error",
                    message:
                        stderr.trim() ||
                        `Judge exited with code ${exitCode}`
                });
            }

            try {
                const result = JSON.parse(stdout.trim());
                finish(result);
            } catch {
                finish({
                    status: "system_error",
                    message: "Invalid response from judge",
                    rawOutput: stdout.trim(),
                    error: stderr.trim() || null
                });
            }
        });
    });
}


app.get("/", (req, res) => {
    res.json({
        message: "Code runner is running"
    });
});


app.post("/run", async (req, res) => {
    const { language, userCode, input = "" } = req.body;
    const lowerLang = language?.toLowerCase();

    if (!["python", "c", "cpp", "c++", "java"].includes(lowerLang)) {
        return res.status(400).json({
            status: "error",
            message: "Unsupported language"
        });
    }

    if (!userCode || typeof userCode !== "string") {
        return res.status(400).json({
            status: "error",
            message: "userCode is required"
        });
    }

    let result;
    if (lowerLang === "python") {
        result = await executePython(userCode, input);
    } else {
        result = await executeCompiledLanguage(language, userCode, input);
    }

    res.json(result);
});


app.post("/judge", async (req, res) => {
    const { language, userCode, testCases } = req.body;
    const lowerLang = language?.toLowerCase();

    if (!["python", "c", "cpp", "c++", "java"].includes(lowerLang)) {
        return res.status(400).json({
            status: "error",
            message: "Unsupported language"
        });
    }

    if (!userCode || typeof userCode !== "string") {
        return res.status(400).json({
            status: "error",
            message: "userCode is required"
        });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
        return res.status(400).json({
            status: "error",
            message: "At least one test case is required"
        });
    }

    const result = await judgeSubmission(language, userCode, testCases);

    res.json(result);
});


const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Code runner listening on port ${PORT}`);
});