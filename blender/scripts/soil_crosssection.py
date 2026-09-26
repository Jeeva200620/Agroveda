"""
Blender 3D Soil Strata & Root Depth Cross-Section Visualizer
Builds a geological 3D core sample cutaway (Horizon A Topsoil, Horizon B Subsoil, Horizon C Bedrock)
with visible branching 3D root penetration and healthy crop canopy on top.
Fast, clean studio render using Blender Workbench.
"""

import bpy
import sys
import json
import os
import math

def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)

def create_soil_crosssection(config: dict):
    clean_scene()
    
    soil_type = config.get("soil_type", "Loamy Soil")
    crop_name = config.get("crop_name", "Pepper")
    output_path = config.get("output_path", "static/renders/soil_crosssection.png")
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.color_type = 'MATERIAL'
    scene.display.shading.light = 'STUDIO'
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540

    # Soil color calibration based on user's real soil profile
    s_lower = soil_type.lower()
    if "red" in s_lower:
        topsoil_col = (0.42, 0.18, 0.10, 1.0)
        subsoil_col = (0.62, 0.26, 0.12, 1.0)
    elif "black" in s_lower or "clay" in s_lower:
        topsoil_col = (0.14, 0.12, 0.10, 1.0)
        subsoil_col = (0.24, 0.20, 0.16, 1.0)
    else: # Loamy / Alluvial
        topsoil_col = (0.26, 0.18, 0.10, 1.0)
        subsoil_col = (0.46, 0.32, 0.18, 1.0)
    bedrock_col = (0.40, 0.40, 0.38, 1.0)

    block_w = 3.6
    block_d = 2.2
    # The front face is at y = 0, block extends from y = 0 to y = block_d
    y_center = block_d / 2.0

    # 1. Horizon A: Organic Humus Topsoil (0 to -0.7m)
    h_a = 0.7
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_center, -h_a / 2.0))
    topsoil = bpy.context.active_object
    topsoil.scale = (block_w, block_d, h_a)
    m1 = bpy.data.materials.new(name="TopsoilMat")
    m1.diffuse_color = topsoil_col
    topsoil.data.materials.append(m1)

    # 2. Horizon B: Dense Subsoil (-0.7 to -1.8m)
    h_b = 1.1
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_center, -h_a - (h_b / 2.0)))
    subsoil = bpy.context.active_object
    subsoil.scale = (block_w, block_d, h_b)
    m2 = bpy.data.materials.new(name="SubsoilMat")
    m2.diffuse_color = subsoil_col
    subsoil.data.materials.append(m2)

    # 3. Horizon C: Bedrock (-1.8 to -2.6m)
    h_c = 0.8
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_center, -h_a - h_b - (h_c / 2.0)))
    bedrock = bpy.context.active_object
    bedrock.scale = (block_w, block_d, h_c)
    m3 = bpy.data.materials.new(name="BedrockMat")
    m3.diffuse_color = bedrock_col
    bedrock.data.materials.append(m3)

    # 4. Visible Root System on the Front Cutaway Profile (at y = -0.02)
    r_mat = bpy.data.materials.new(name="RootMat")
    r_mat.diffuse_color = (0.94, 0.90, 0.78, 1.0) # Ivory root fiber

    # Main Taproot descending through Horizon A into Horizon B (from z=0 to z=-1.6)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=1.6, location=(0, -0.02, -0.8))
    taproot = bpy.context.active_object
    taproot.name = "MainTaproot"
    taproot.data.materials.append(r_mat)

    # Lateral Feeder Roots branching out from the taproot across Topsoil & Subsoil
    # (z_origin, length, angle_degrees, side: 1 for right, -1 for left)
    branches = [
        (-0.25, 0.65, 40, 1),
        (-0.35, 0.60, -42, -1),
        (-0.55, 0.75, 48, 1),
        (-0.65, 0.70, -50, -1),
        (-0.95, 0.55, 35, 1),
        (-1.05, 0.50, -38, -1),
        (-1.30, 0.40, 25, 1),
        (-1.35, 0.35, -28, -1)
    ]
    for z_orig, length, ang_deg, side in branches:
        ang_rad = math.radians(ang_deg)
        # Branch extends outward and slightly downward
        dx = (length / 2.0) * math.sin(math.radians(abs(ang_deg))) * side
        dz = -(length / 2.0) * math.cos(math.radians(abs(ang_deg)))
        bx = dx
        bz = z_orig + dz
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=length, location=(bx, -0.02, bz))
        b_obj = bpy.context.active_object
        b_obj.rotation_euler = (0, -ang_rad, 0)
        b_obj.data.materials.append(r_mat)

    # 5. Crop Canopy on Top Surface (centered at x=0, y=0.1, directly above taproot)
    plant_y = 0.12
    p_mat = bpy.data.materials.new(name="PlantMat")
    p_mat.diffuse_color = (0.12, 0.65, 0.18, 1.0)

    f_mat = bpy.data.materials.new(name="FruitMat")
    f_mat.diffuse_color = (0.85, 0.18, 0.10, 1.0)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.85, location=(0, plant_y, 0.42))
    stem = bpy.context.active_object
    stem.name = "CropStem"
    stem.data.materials.append(p_mat)
    
    # Healthy foliage leaves
    for ang in [0, 1.25, 2.5, 3.75, 5.0]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.45, location=(math.cos(ang)*0.22, plant_y + math.sin(ang)*0.22, 0.55))
        lf = bpy.context.active_object
        lf.scale = (1.2, 0.3, 0.7)
        lf.rotation_euler = (0.35, ang, 0.3)
        lf.data.materials.append(p_mat)
        lf.select_set(True)

    # Fruit (Pepper or Tomato)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.25, location=(0.14, plant_y + 0.1, 0.42))
    fruit = bpy.context.active_object
    fruit.rotation_euler = (math.radians(160), 0, 0)
    fruit.data.materials.append(f_mat)
    fruit.select_set(True)

    stem.select_set(True)
    bpy.context.view_layer.objects.active = stem
    bpy.ops.object.join()

    # 6. Camera Framing - High clarity isometric framing covering full canopy and full root depth
    target = bpy.data.objects.new("CamTarget", None)
    target.location = (0, 0.4, -0.45)
    bpy.context.collection.objects.link(target)

    bpy.ops.object.camera_add(location=(4.2, -8.2, 1.8))
    cam = bpy.context.active_object
    track = cam.constraints.new(type='TRACK_TO')
    track.target = target
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    scene.camera = cam

    scene.render.filepath = os.path.abspath(output_path)
    scene.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
    print(f"[Blender] Clean soil cross-section rendered: {output_path}")

if __name__ == "__main__":
    cfg = {"soil_type": "Loamy Soil", "crop_name": "Pepper"}
    if "--" in sys.argv:
        idx = sys.argv.index("--")
        args = sys.argv[idx + 1:]
        if args:
            try:
                cfg = json.loads(args[0])
            except Exception as e:
                print(f"[Blender Error] JSON parse error: {e}")
    create_soil_crosssection(cfg)

