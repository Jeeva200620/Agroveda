"""
Scene Generator & Simulation Orchestrator
Coordinates disease spreading math, Blender execution (MCP socket or headless CLI),
animated WebP compilation via Pillow, and cloud upload of generated 3D visual assets.
"""

import os
import uuid
from glob import glob
from PIL import Image

from blender_bridge.config import BASE_DIR, LOCAL_RENDER_DIR
from blender_bridge.blender_mcp_client import BlenderMCPClient
from blender_bridge.headless_executor import run_blender_headless
from blender_bridge.render_uploader import upload_render_file

mcp_client = BlenderMCPClient()

def generate_disease_simulation_video(
    job_id: str,
    disease_name: str,
    tamil_label: str,
    timeline: dict,
    wind_speed: float = 12.0,
    wind_deg: float = 90.0,
    user_id: str = "guest"
) -> str:
    """
    Renders high-resolution 3D simulation frames in Blender,
    compiles them into an animated WebP, and uploads to Supabase or serves locally.
    """
    output_filename = f"{job_id}_spread.webp"
    final_output_path = os.path.join(LOCAL_RENDER_DIR, output_filename)
    frames_dir = os.path.join(LOCAL_RENDER_DIR, f"temp_{job_id}")
    os.makedirs(frames_dir, exist_ok=True)

    script_path = os.path.join(BASE_DIR, "blender", "scripts", "disease_spread.py")

    payload = {
        "disease_name": disease_name,
        "tamil_label": tamil_label,
        "timeline": timeline,
        "wind_speed": wind_speed,
        "wind_deg": wind_deg,
        "frames_dir": frames_dir
    }

    print(f"[SceneGenerator] Starting simulation for job '{job_id}'...")

    # Dual-Mode Execution: Check MCP Socket first, fallback to Headless CLI
    executed = False
    if mcp_client.is_available():
        print("[SceneGenerator] Blender MCP socket detected. Sending script...")
        res = mcp_client.execute_script_file(script_path, payload)
        if res.get("status") == "success":
            executed = True

    if not executed:
        print("[SceneGenerator] Launching Headless Blender CLI...")
        res = run_blender_headless(script_path, payload, timeout_sec=40)
        if res.get("status") == "success":
            executed = True

    # Stitch rendered frame PNGs into high-performance animated WebP using Pillow
    frame_files = sorted(glob(os.path.join(frames_dir, "frame_*.png")))
    if frame_files:
        try:
            print(f"[SceneGenerator] Stitching {len(frame_files)} frames into {output_filename}...")
            frames = [Image.open(f) for f in frame_files]
            frames[0].save(
                final_output_path,
                save_all=True,
                append_images=frames[1:],
                duration=400,
                loop=0,
                quality=90
            )
            print(f"[SceneGenerator] Animated WebP created: {final_output_path}")

            # Clean up temp frames
            for f in frame_files:
                try: os.remove(f)
                except: pass
            try: os.rmdir(frames_dir)
            except: pass

        except Exception as e:
            print(f"[SceneGenerator] Error compiling animated WebP: {e}")

    if os.path.isfile(final_output_path):
        media_url = upload_render_file(final_output_path, user_id=user_id, render_id=job_id)
        return media_url
    else:
        print(f"[SceneGenerator] Render output file was not created: {final_output_path}")
        return ""

def generate_soil_visualization(
    soil_type: str = "Clay Loam",
    moisture_level: float = 68.0,
    user_id: str = "guest"
) -> str:
    """Renders a 3D soil strata cross-section."""
    render_id = str(uuid.uuid4())[:8]
    filename = f"{render_id}_soil.png"
    output_path = os.path.join(LOCAL_RENDER_DIR, filename)
    script_path = os.path.join(BASE_DIR, "blender", "scripts", "soil_crosssection.py")

    payload = {
        "soil_type": soil_type,
        "moisture_level": moisture_level,
        "output_path": output_path
    }

    run_blender_headless(script_path, payload, timeout_sec=45)
    if os.path.isfile(output_path):
        return upload_render_file(output_path, user_id=user_id, render_id=render_id)
    return ""

def generate_treatment_zone_map(
    infected_nodes: list,
    treatment_type: str = "Trichoderma Harzianum (Bio-Fungicide)",
    user_id: str = "guest"
) -> str:
    """Renders 2m spray containment rings."""
    render_id = str(uuid.uuid4())[:8]
    filename = f"{render_id}_treatment.png"
    output_path = os.path.join(LOCAL_RENDER_DIR, filename)
    script_path = os.path.join(BASE_DIR, "blender", "scripts", "treatment_mapper.py")

    payload = {
        "infected_nodes": infected_nodes,
        "treatment_type": treatment_type,
        "output_path": output_path
    }

    run_blender_headless(script_path, payload, timeout_sec=45)
    if os.path.isfile(output_path):
        return upload_render_file(output_path, user_id=user_id, render_id=render_id)
    return ""
