import json
import subprocess
import sys
import tempfile
import os
import shutil


def normalize_output(output):
    lines = output.replace("\r\n", "\n").split("\n")
    return "\n".join(line.rstrip() for line in lines).strip()


def main():
    temp_dir = None
    try:
        submission = json.load(sys.stdin)

        user_code = submission.get("userCode")
        test_cases = submission.get("testCases", [])

        if not user_code:
            print(json.dumps({
                "status": "system_error",
                "message": "userCode is required"
            }))
            return

        if not test_cases:
            print(json.dumps({
                "status": "system_error",
                "message": "At least one test case is required"
            }))
            return

        # Create a unique temporary directory
        temp_dir = tempfile.mkdtemp()
        code_path = os.path.join(temp_dir, "solution.cpp")
        bin_path = os.path.join(temp_dir, "solution")

        with open(code_path, "w", encoding="utf-8") as code_file:
            code_file.write(user_code)

        # Compile the C++ code
        compile_result = subprocess.run(
            ["g++", code_path, "-o", bin_path],
            capture_output=True,
            text=True
        )

        # Compilation failed
        if compile_result.returncode != 0:
            print(json.dumps({
                "status": "compile_error",
                "passed": 0,
                "total": len(test_cases),
                "failedTestCase": 1,
                "error": compile_result.stderr.strip()
            }))
            return

        passed = 0
        total = len(test_cases)

        for index, test_case in enumerate(test_cases):
            test_input = str(test_case.get("input", ""))
            expected_output = normalize_output(
                str(test_case.get("expectedOutput", ""))
            )
            is_hidden = test_case.get("hidden", False)

            try:
                result = subprocess.run(
                    [bin_path],
                    input=test_input,
                    text=True,
                    capture_output=True,
                    timeout=2
                )

            except subprocess.TimeoutExpired:
                print(json.dumps({
                    "status": "time_limit_exceeded",
                    "passed": passed,
                    "total": total,
                    "failedTestCase": index + 1
                }))
                return

            stdout = result.stdout
            stderr = result.stderr

            # Binary exited with an error
            if result.returncode != 0:
                response = {
                    "status": "runtime_error",
                    "passed": passed,
                    "total": total,
                    "failedTestCase": index + 1
                }

                # Don't expose internal errors for hidden test cases
                if not is_hidden:
                    response["error"] = stderr.strip() or f"Process exited with code {result.returncode}"

                print(json.dumps(response))
                return

            actual_output = normalize_output(stdout)

            if actual_output != expected_output:
                response = {
                    "status": "wrong_answer",
                    "passed": passed,
                    "total": total,
                    "failedTestCase": index + 1
                }

                # Show details only for visible test cases
                if not is_hidden:
                    response["expectedOutput"] = expected_output
                    response["actualOutput"] = actual_output

                print(json.dumps(response))
                return

            passed += 1

        # All test cases passed
        print(json.dumps({
            "status": "accepted",
            "passed": passed,
            "total": total
        }))

    except Exception as error:
        print(json.dumps({
            "status": "system_error",
            "message": str(error)
        }))

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


if __name__ == "__main__":
    main()
