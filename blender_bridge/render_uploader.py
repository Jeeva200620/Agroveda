"""
Render Uploader & Asset Manager
Manages persistence of rendered MP4 videos and images to Supabase Cloud Storage.
Gracefully falls back to serving from local Flask /static/renders/ if Supabase is offline.
"""

import os
import requests
from blender_bridge.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET, LOCAL_RENDER_DIR

def upload_render_file(file_path: str, user_id: str = "guest", render_id: str = "0000") -> str:
    """
    Uploads a rendered MP4 or image to Supabase Storage.
    Returns the public streaming URL or local fallback URL.
    """
    if not os.path.isfile(file_path):
        print(f"[RenderUploader] Error: File does not exist at {file_path}")
        return ""

    filename = os.path.basename(file_path)
    extension = os.path.splitext(filename)[1].lower()
    content_type = "video/mp4" if extension == ".mp4" else "image/png"

    # Fallback to local static URL if Supabase is not configured
    if not SUPABASE_URL or not SUPABASE_KEY or "supabase.co" not in SUPABASE_URL:
        # Move or ensure file is inside static/renders/
        dest_path = os.path.join(LOCAL_RENDER_DIR, filename)
        if os.path.abspath(file_path) != os.path.abspath(dest_path):
            import shutil
            shutil.copyfile(file_path, dest_path)
        print(f"[RenderUploader] Serving from local static endpoint: /static/renders/{filename}")
        return f"/static/renders/{filename}"

    # Target storage path in Supabase bucket
    storage_path = f"renders/{user_id}/{render_id}_{filename}"
    upload_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{SUPABASE_BUCKET}/{storage_path}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
        "Content-Type": content_type,
        "x-upsert": "true"
    }

    try:
        with open(file_path, "rb") as f:
            resp = requests.post(upload_url, headers=headers, data=f, timeout=15)
        
        if resp.status_code in (200, 201):
            public_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{SUPABASE_BUCKET}/{storage_path}"
            print(f"[RenderUploader] Successfully uploaded to Supabase: {public_url}")
            return public_url
        else:
            print(f"[RenderUploader] Supabase upload failed ({resp.status_code}): {resp.text}")
            # Fallback to local
            return f"/static/renders/{filename}"

    except Exception as e:
        print(f"[RenderUploader] Exception uploading to Supabase: {e}")
        return f"/static/renders/{filename}"
