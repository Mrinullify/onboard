import json
import subprocess
import sys
import tempfile
import os
import shutil
import re


def normalize_output(output):
    lines = output.replace("\r\n", "\n").split("\n")
    return "\n".join(line.rstrip() for line in lines).strip()


def sanitize_error(err_str, temp_dir=None):
    if not err_str:
        return ""
    if temp_dir:
        err_str = err_str.replace(temp_dir + os.sep, "").replace(temp_dir, "")
    err_str = re.sub(r'/tmp/tmp[a-zA-Z0-9_]+/', '', err_str)
    err_str = re.sub(r'[A-Z]:\\[^\s]+\\', '', err_str)
    return err_str.strip()


def get_class_name(code):
    # Remove multi-line comments (/* ... */)
    code_clean = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    # Remove single-line comments (// ...)
    code_clean = re.sub(r'//.*', '', code_clean)

    # Try to match public class ClassName or class ClassName
    class_match = re.search(r'public\s+class\s+([a-zA-Z0-9_]+)', code_clean)
    if not class_match:
        class_match = re.search(r'class\s+([a-zA-Z0-9_]+)', code_clean)
    return class_match.group(1) if class_match else "Main"


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

        # Dynamically determine the class name (defaults to Main)
        class_name = get_class_name(user_code)

        # Create a unique temporary directory
        temp_dir = tempfile.mkdtemp()
        code_path = os.path.join(temp_dir, f"{class_name}.java")

        with open(code_path, "w", encoding="utf-8") as code_file:
            code_file.write(user_code)

        # Compile the Java class
        compile_result = subprocess.run(
            ["javac", code_path],
            capture_output=True,
            text=True
        )

        # Compilation failed
        if compile_result.returncode != 0:
            raw_err = compile_result.stderr.strip() or compile_result.stdout.strip()
            clean_err = sanitize_error(raw_err, temp_dir)
            print(json.dumps({
                "status": "compile_error",
                "passed": 0,
                "total": len(test_cases),
                "error": clean_err
            }))
            return

        passed = 0
        total = len(test_cases)
        results = []
        overall_status = None

        for index, test_case in enumerate(test_cases):
            test_input = str(test_case.get("input", ""))
            expected_output = normalize_output(
                str(test_case.get("expectedOutput", ""))
            )

            try:
                result = subprocess.run(
                    ["java", "-cp", temp_dir, class_name],
                    input=test_input,
                    text=True,
                    capture_output=True,
                    timeout=5  # Java JVM startup timeout: 5s per test case
                )

            except subprocess.TimeoutExpired:
                if not overall_status:
                    overall_status = "time_limit_exceeded"
                results.append({
                    "index": index + 1,
                    "passed": False,
                    "status": "time_limit_exceeded",
                    "input": test_input,
                    "expectedOutput": expected_output
                })
                continue

            # Java process runtime error
            if result.returncode != 0:
                raw_err = result.stderr.strip()
                clean_err = sanitize_error(raw_err, temp_dir)
                is_oom = "OutOfMemoryError" in raw_err or "out of memory" in raw_err.lower()
                status_type = "memory_limit_exceeded" if is_oom else "runtime_error"

                if not overall_status:
                    overall_status = status_type

                results.append({
                    "index": index + 1,
                    "passed": False,
                    "status": status_type,
                    "error": clean_err or f"Process exited with code {result.returncode}",
                    "input": test_input,
                    "expectedOutput": expected_output
                })
                continue

            actual_output = normalize_output(result.stdout)

            if actual_output == expected_output:
                passed += 1
                results.append({
                    "index": index + 1,
                    "passed": True,
                    "status": "accepted",
                    "input": test_input,
                    "expectedOutput": expected_output,
                    "actualOutput": actual_output
                })
            else:
                if not overall_status:
                    overall_status = "wrong_answer"
                results.append({
                    "index": index + 1,
                    "passed": False,
                    "status": "wrong_answer",
                    "input": test_input,
                    "expectedOutput": expected_output,
                    "actualOutput": actual_output
                })

        if passed == total:
            overall_status = "accepted"

        print(json.dumps({
            "status": overall_status,
            "passed": passed,
            "total": total,
            "results": results
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
