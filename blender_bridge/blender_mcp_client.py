"""
Blender MCP Socket Client
Provides optional connection to a custom socket server if configured,
with instant zero-delay fallback to Headless CLI execution.
"""

import socket
import json
import os
from blender_bridge.config import BLENDER_MCP_HOST, BLENDER_MCP_PORT, SOCKET_TIMEOUT

class BlenderMCPClient:
    def __init__(self, host=BLENDER_MCP_HOST, port=BLENDER_MCP_PORT, timeout=1.0):
        self.host = host
        self.port = port
        self.timeout = timeout

    def is_available(self) -> bool:
        """Only returns True if explicitly configured and responds to handshake."""
        if not self.port or self.port == 0:
            return False
        try:
            with socket.create_connection((self.host, self.port), timeout=0.5) as s:
                s.sendall(b'{"action":"ping"}\n')
                s.settimeout(0.5)
                res = s.recv(128)
                return b"pong" in res or b"ok" in res
        except Exception:
            return False

    def execute_script_file(self, script_path: str, args: dict) -> dict:
        try:
            with socket.create_connection((self.host, self.port), timeout=self.timeout) as s:
                payload = json.dumps({"type": "execute_script_file", "path": script_path, "args": args}) + "\n"
                s.sendall(payload.encode("utf-8"))
                res = s.recv(4096)
                return json.loads(res.decode("utf-8"))
        except Exception as e:
            return {"status": "error", "message": str(e)}
