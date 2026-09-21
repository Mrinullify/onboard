import { spawn } from "child_process";

function runJudge(userCode, testCases) {
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
                resolve({ status: "parse_error", stdout, stderr, error: e.message });
            }
        });
    });
}

async function testAll() {
    console.log("=== Testing Java Docker Judge (Phase 2 & Step 3) ===\n");

    // 1. Accepted solution
    console.log("1. Testing Accepted Solution...");
    const codeAccepted = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}`;
    const res1 = await runJudge(codeAccepted, [
        { input: "2 3", expectedOutput: "5" },
        { input: "10 20", expectedOutput: "30" }
    ]);
    console.log("Result 1:", JSON.stringify(res1, null, 2));

    // 2. Wrong Answer
    console.log("\n2. Testing Wrong Answer...");
    const codeWrong = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a * b); // Wrong operation
    }
}`;
    const res2 = await runJudge(codeWrong, [
        { input: "2 3", expectedOutput: "5" }
    ]);
    console.log("Result 2:", JSON.stringify(res2, null, 2));

    // 3. Compile Error
    console.log("\n3. Testing Compile Error...");
    const codeCompileErr = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello" // Missing semicolon and closing brace
`;
    const res3 = await runJudge(codeCompileErr, [
        { input: "", expectedOutput: "Hello" }
    ]);
    console.log("Result 3:", JSON.stringify(res3, null, 2));

    // 4. Runtime Error
    console.log("\n4. Testing Runtime Error...");
    const codeRuntimeErr = `
public class Main {
    public static void main(String[] args) {
        int[] arr = new int[2];
        System.out.println(arr[5]); // Exception: ArrayIndexOutOfBoundsException
    }
}`;
    const res4 = await runJudge(codeRuntimeErr, [
        { input: "", expectedOutput: "0" }
    ]);
    console.log("Result 4:", JSON.stringify(res4, null, 2));

    // 5. Time Limit Exceeded
    console.log("\n5. Testing Time Limit Exceeded...");
    const codeTLE = `
public class Main {
    public static void main(String[] args) {
        while (true) {} // Infinite loop
    }
}`;
    const res5 = await runJudge(codeTLE, [
        { input: "", expectedOutput: "done" }
    ]);
    console.log("Result 5:", JSON.stringify(res5, null, 2));

    // 6. Multiple test cases where an early test fails but later tests pass
    console.log("\n6. Testing Multiple Test Cases (Early fail + Later pass)...");
    const codePartial = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (n == 1) {
            System.out.println("wrong"); // Fails for input 1
        } else {
            System.out.println(n * 2); // Correct for input 2 & 3
        }
    }
}`;
    const res6 = await runJudge(codePartial, [
        { input: "1", expectedOutput: "2" }, // Fails
        { input: "2", expectedOutput: "4" }, // Passes
        { input: "3", expectedOutput: "6" }  // Passes
    ]);
    console.log("Result 6:", JSON.stringify(res6, null, 2));

    console.log("\n✅ All Java Docker Judge Tests Executed Successfully!");
}

testAll();
