import json
import subprocess
import sys
import tempfile
import os
import shutil


def main():
    temp_dir = None
    try:
        # Read the structured JSON from standard input
        payload = json.load(sys.stdin)
        user_code = payload.get("userCode", "")
        user_input = payload.get("input", "")

        # Setup temp dir
        temp_dir = tempfile.mkdtemp()
        code_path = os.path.join(temp_dir, "solution.c")
        bin_path = os.path.join(temp_dir, "solution")

        with open(code_path, "w", encoding="utf-8") as f:
            f.write(user_code)

        # Compile
        compile_result = subprocess.run(
            ["gcc", code_path, "-o", bin_path],
            capture_output=True,
            text=True
        )

        if compile_result.returncode != 0:
            # Output marked compilation error to stderr so the host can identify it
            sys.stderr.write("[COMPILATION ERROR]\n" + compile_result.stderr)
            sys.exit(1)

        # Run binary
        run_result = subprocess.run(
            [bin_path],
            input=user_input,
            capture_output=True,
            text=True
        )

        # Output the stdout and stderr of the compiled binary
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
