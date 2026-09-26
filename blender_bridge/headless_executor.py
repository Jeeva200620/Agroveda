"""
Blender Headless CLI Executor
Executes Blender scripts via background CLI command line (`blender -b -P ...`)
Used in production environments, Docker containers, and when no interactive GUI is open.
"""

import subprocess
import json
import os
import sys
from blender_bridge.config import BLENDER_EXECUTABLE

def run_blender_headless(script_path: str, payload: dict, timeout_sec: int = 35) -> dict:
    """
    Executes a script headlessly in Blender with a JSON payload.
    """
    if not os.path.isfile(script_path):
        return {"status": "error", "message": f"Script not found: {script_path}"}

    payload_str = json.dumps(payload)
    cmd = [
        BLENDER_EXECUTABLE,
        "--background",
        "--factory-startup",
        "--python", script_path,
        "--",
        payload_str
    ]

    print(f"[HeadlessExecutor] Spawning Blender: {' '.join(cmd[:5])} ...")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_sec
        )

        if result.returncode == 0:
            print("[HeadlessExecutor] Blender process completed successfully.")
            return {"status": "success", "stdout": result.stdout}
        else:
            print(f"[HeadlessExecutor] Blender exited with code {result.returncode}:\n{result.stderr}")
            return {"status": "error", "returncode": result.returncode, "stderr": result.stderr}

    except subprocess.TimeoutExpired:
        print(f"[HeadlessExecutor] Timeout of {timeout_sec}s expired while rendering.")
        return {"status": "error", "message": f"Blender execution exceeded {timeout_sec}s timeout."}
    except FileNotFoundError:
        print(f"[HeadlessExecutor] Blender binary not found at '{BLENDER_EXECUTABLE}'.")
        return {"status": "error", "message": f"Blender binary not found: {BLENDER_EXECUTABLE}"}
    except Exception as e:
        print(f"[HeadlessExecutor] Exception running Blender: {e}")
        return {"status": "error", "message": str(e)}
