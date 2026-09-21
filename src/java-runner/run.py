import json
import subprocess
import sys
import tempfile
import os
import shutil
import re


def get_class_name(code):
    # Remove multi-line comments (/* ... */)
    code_clean = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    # Remove single-line comments (// ...)
    code_clean = re.sub(r'//.*', '', code_clean)
    
    # Try to match public class ClassName or class ClassName
    class_match = re.search(r'public\s+class\s+([a-zA-Z0-9_]+)', code_clean)
    if not class_match:
        class_match = re.search(r'class\s+([a-zA-Z0-9_]+)', code_clean)
    return class_match.group(1) if class_match else "Solution"


def main():
    temp_dir = None
    try:
        # Read structured JSON payload from stdin
        payload = json.load(sys.stdin)
        user_code = payload.get("userCode", "")
        user_input = payload.get("input", "")

        # Setup temp dir
        temp_dir = tempfile.mkdtemp()
        class_name = get_class_name(user_code)
        code_path = os.path.join(temp_dir, f"{class_name}.java")

        with open(code_path, "w", encoding="utf-8") as f:
            f.write(user_code)

        # Compile
        compile_result = subprocess.run(
            ["javac", code_path],
            capture_output=True,
            text=True
        )

        if compile_result.returncode != 0:
            # Output marked compilation error to stderr so the host can identify it
            sys.stderr.write("[COMPILATION ERROR]\n" + compile_result.stderr)
            sys.exit(1)

        # Run binary
        run_result = subprocess.run(
            ["java", "-cp", temp_dir, class_name],
            input=user_input,
            capture_output=True,
            text=True
        )

        # Output the stdout and stderr of the Java process
        sys.stdout.write(run_result.stdout)
        sys.stderr.write(run_result.stderr)

        sys.exit(run_result.returncode)

    except Exception as e:
        sys.stderr.write(f"System error in sandbox: {str(e)}\n")
        sys.exit(99)

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


if __name__ == "__main__":
    main()
