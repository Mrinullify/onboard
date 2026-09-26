import json
import subprocess
import sys
import tempfile
import os
import shutil


def main():
    temp_dir = None
    try:
        # Read structured JSON payload from stdin
        payload = json.load(sys.stdin)
        user_code = payload.get("userCode", "")
        user_input = payload.get("input", "")

        # Setup temp dir
        temp_dir = tempfile.mkdtemp()
        code_path = os.path.join(temp_dir, "solution.py")

        with open(code_path, "w", encoding="utf-8") as f:
            f.write(user_code)

        # Check Python syntax compilation
        compile_result = subprocess.run(
            ["python3", "-m", "py_compile", code_path],
            capture_output=True,
            text=True
        )

        if compile_result.returncode != 0:
            # Output marked compilation error to stderr so the host can identify it
            sys.stderr.write("[COMPILATION ERROR]\n" + compile_result.stderr)
            sys.exit(1)

        # Run script
        run_result = subprocess.run(
            ["python3", code_path],
            input=user_input,
            capture_output=True,
            text=True
        )

        # Output stdout and stderr
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
