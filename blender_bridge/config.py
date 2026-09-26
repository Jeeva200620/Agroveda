"""
AgroVeda 3D Blender Bridge Configuration
Detects Blender executable, Supabase credentials, and output storage locations.
"""

import os
import shutil

# 1. Blender Executable Detection
DEFAULT_WIN_PATHS = [
    r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
    r"C:\Program Files\Blender Foundation\Blender\blender.exe"
]

def find_blender_binary() -> str:
    env_path = os.getenv("BLENDER_PATH")
    if env_path and os.path.isfile(env_path):
        return env_path
    
    # Check system PATH
    path_bin = shutil.which("blender")
    if path_bin:
        return path_bin

    # Check common Windows directories
    for p in DEFAULT_WIN_PATHS:
        if os.path.isfile(p):
            return p
            
    return "blender"

BLENDER_EXECUTABLE = find_blender_binary()

# 2. Network & Socket Configuration (Interactive MCP Mode)
BLENDER_MCP_HOST = os.getenv("BLENDER_MCP_HOST", "localhost")
BLENDER_MCP_PORT = int(os.getenv("BLENDER_MCP_PORT", 9876))
SOCKET_TIMEOUT = 3.0 # seconds before falling back to headless CLI

# 3. Supabase Cloud Storage Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "plant-images")

# 4. Render Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_RENDER_DIR = os.path.join(BASE_DIR, "static", "renders")
os.makedirs(LOCAL_RENDER_DIR, exist_ok=True)
