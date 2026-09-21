import { spawn } from "child_process";

function runJudge(userCode, testCases) {
    return new Promise((resolve) => {
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
            "-v", `${process.cwd()}/src/java-runner/judge.py:/sandbox/judge.py:ro`,
            "onboard-java-runner"
        ];

        let stdout = "";
        let stderr = "";

        const child = spawn("docker", dockerArgs);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.stdin.write(JSON.stringify({ userCode, testCases }));
        child.stdin.end();

        child.on("close", (exitCode) => {
            try {
                const res = JSON.parse(stdout.trim());
                resolve(res);
            } catch (e) {
                resolve({ status: "system_error", stdout, stderr, error: e.message, exitCode });
            }
        });
    });
}

async function runAllTests() {
    console.log("=================================================");
    console.log("    JAVA EXECUTION SYSTEM TEST SUITE (A - F)     ");
    console.log("=================================================\n");

    let passCount = 0;
    let totalCount = 6;

    // ─── Test A — Accepted ───
    console.log("--- Test A: Accepted ---");
    const codeA = `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`;
    const resA = await runJudge(codeA, [
        { input: "3 4", expectedOutput: "7" },
        { input: "10 20", expectedOutput: "30" }
    ]);
    console.log("Result A:", resA.status, "| passed:", resA.passed, "/", resA.total);
    if (resA.status === "accepted" && resA.passed === 2) {
        console.log("✅ Test A PASSED\n");
        passCount++;
    } else {
        console.error("❌ Test A FAILED:", resA, "\n");
    }

    // ─── Test B — Wrong Answer ───
    console.log("--- Test B: Wrong Answer ---");
    const codeB = `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a * b); // Incorrect logic
    }
}`;
    const resB = await runJudge(codeB, [
        { input: "3 4", expectedOutput: "7" }
    ]);
    console.log("Result B:", resB.status, "| passed:", resB.passed, "/", resB.total);
    if (resB.status === "wrong_answer" && resB.passed === 0) {
        console.log("✅ Test B PASSED\n");
        passCount++;
    } else {
        console.error("❌ Test B FAILED:", resB, "\n");
    }

    // ─── Test C — Compilation Error ───
    console.log("--- Test C: Compilation Error ---");
    const codeC = `
public class Main {
    public static void main(String[] args) {
        int x = 10
        System.out.println(x);
    }
}`;
    const resC = await runJudge(codeC, [
        { input: "", expectedOutput: "10" }
    ]);
    console.log("Result C status:", resC.status, "| Error msg:", resC.error?.split("\n")[0]);
    if (resC.status === "compile_error" && resC.error && resC.error.includes(";")) {
        console.log("✅ Test C PASSED (Compilation Error returned cleanly without System Error)\n");
        passCount++;
    } else {
        console.error("❌ Test C FAILED:", resC, "\n");
    }

    // ─── Test D — Runtime Error ───
    console.log("--- Test D: Runtime Error ---");
    const codeD = `
public class Main {
    public static void main(String[] args) {
        int x = 10 / 0;
        System.out.println(x);
    }
}`;
    const resD = await runJudge(codeD, [
        { input: "", expectedOutput: "0" }
    ]);
    const errD = resD.error || resD.results?.[0]?.error || "";
    console.log("Result D status:", resD.status, "| Error msg:", errD.split("\n")[0]);
    if (resD.status === "runtime_error" && errD.includes("ArithmeticException")) {
        console.log("✅ Test D PASSED (Runtime Error returned with ArithmeticException message)\n");
        passCount++;
    } else {
        console.error("❌ Test D FAILED:", resD, "\n");
    }

    // ─── Test E — Time Limit Exceeded ───
    console.log("--- Test E: Time Limit Exceeded ---");
    const codeE = `
public class Main {
    public static void main(String[] args) {
        while (true) {} // Infinite loop
    }
}`;
    const resE = await runJudge(codeE, [
        { input: "", expectedOutput: "done" }
    ]);
    console.log("Result E status:", resE.status);
    if (resE.status === "time_limit_exceeded") {
        console.log("✅ Test E PASSED (Time Limit Exceeded returned cleanly)\n");
        passCount++;
    } else {
        console.error("❌ Test E FAILED:", resE, "\n");
    }

    // ─── Test F — Negative Values / Edge Cases ───
    console.log("--- Test F: Negative Values / Edge Cases ---");
    const codeF = `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        if (n <= 0) return;
        int maxVal = sc.nextInt();
        for (int i = 1; i < n; i++) {
            int val = sc.nextInt();
            if (val > maxVal) {
                maxVal = val;
            }
        }
        System.out.println(maxVal);
    }
}`;
    const resF = await runJudge(codeF, [
        { input: "5\n-10 -3 -25 -7 -2", expectedOutput: "-2" }
    ]);
    const actualF = resF.results?.[0]?.actualOutput;
    console.log("Result F status:", resF.status, "| Output:", actualF);
    if (resF.status === "accepted" && (actualF === "-2" || resF.passed === 1)) {
        console.log("✅ Test F PASSED (Negative Values handled correctly, answer is -2)\n");
        passCount++;
    } else {
        console.error("❌ Test F FAILED:", resF, "\n");
    }

    console.log(`=================================================`);
    console.log(` SUMMARY: ${passCount} / ${totalCount} tests passed!`);
    console.log(`=================================================`);
}

runAllTests();
