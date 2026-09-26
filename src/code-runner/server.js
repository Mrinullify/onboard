import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "100kb" }));

const EXECUTION_TIMEOUT = 5000;

function executeLanguageRun(language, userCode, input = "") {
    return new Promise((resolve) => {
        let imageName = "onboard-python-runner";
        const lowerLang = language.toLowerCase();
        if (lowerLang === "c") {
            imageName = "onboard-c-runner";
        } else if (lowerLang === "cpp" || lowerLang === "c++") {
            imageName = "onboard-cpp-runner";
        } else if (lowerLang === "java") {
            imageName = "onboard-java-runner";
        } else if (lowerLang === "python") {
            imageName = "onboard-python-runner";
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

        const runTimeout = (lowerLang === "java") ? 7500 : 5000;

        const timeoutId = setTimeout(() => {
            child.kill("SIGKILL");

            finish({
                status: "time_limit_exceeded",
                output: stdout.trim(),
                error: `Execution exceeded ${runTimeout}ms`
            });
        }, runTimeout);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.stdin.on("error", () => { });

        // Structured JSON transfer over stdin
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
        let runnerDir = "python-runner";
        const lowerLang = language.toLowerCase();
        if (lowerLang === "c") {
            imageName = "onboard-c-runner";
            runnerDir = "c-runner";
        } else if (lowerLang === "cpp" || lowerLang === "c++") {
            imageName = "onboard-cpp-runner";
            runnerDir = "cpp-runner";
        } else if (lowerLang === "java") {
            imageName = "onboard-java-runner";
            runnerDir = "java-runner";
        }

        const hostJudgePath = path.resolve(__dirname, "..", runnerDir, "judge.py");

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

        if (fs.existsSync(hostJudgePath)) {
            dockerArgs.push("-v", `${hostJudgePath}:/sandbox/judge.py:ro`);
        }

        dockerArgs.push(imageName, "python3", "judge.py");

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

        const perTestMs = (lowerLang === "java") ? 6000 : 3000;
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

        // Send submission payload to judge.py
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
                if (exitCode === 137 || stderr.includes("OutOfMemoryError") || stderr.includes("out of memory") || stderr.includes("MemoryError")) {
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

    const result = await executeLanguageRun(language, userCode, input);
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