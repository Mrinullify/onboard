import json
import subprocess
import sys
import tempfile
import os


def normalize_output(output):
    lines = output.replace("\r\n", "\n").split("\n")
    return "\n".join(line.rstrip() for line in lines).strip()


def main():
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

        # Store user code once inside this temporary sandbox
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            delete=False
        ) as code_file:
            code_file.write(user_code)
            code_path = code_file.name

        passed = 0
        total = len(test_cases)

        try:
            for index, test_case in enumerate(test_cases):
                test_input = str(test_case.get("input", ""))
                expected_output = normalize_output(
                    str(test_case.get("expectedOutput", ""))
                )
                is_hidden = test_case.get("hidden", False)

                try:
                    result = subprocess.run(
                        ["python", code_path],
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

                # Python exited with an error
                if result.returncode != 0:

                    if "SyntaxError" in stderr:
                        status = "compile_error"
                    else:
                        status = "runtime_error"

                    response = {
                        "status": status,
                        "passed": passed,
                        "total": total,
                        "failedTestCase": index + 1
                    }

                    # Don't expose internal errors for hidden test cases
                    if not is_hidden:
                        response["error"] = stderr.strip()

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

        finally:
            if os.path.exists(code_path):
                os.remove(code_path)

    except Exception as error:
        print(json.dumps({
            "status": "system_error",
            "message": str(error)
        }))


if __name__ == "__main__":
    main()