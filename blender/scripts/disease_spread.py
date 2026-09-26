"""
Blender 3D Farm Field & Disease Spread Simulation Script
Executed inside Blender (Headless CLI or interactive MCP)
Builds a species-specific 10x10 botanical crop grid (Pepper, Tomato, Potato)
with authentic morphological structure and animated pathological progression.
"""

import bpy
import sys
import json
import os
import math

def clean_scene():
    """Removes default objects, meshes, and materials."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)

def build_botanical_prototype(disease_name: str):
    """
    Constructs a species-specific botanical prototype (Pepper, Tomato, Potato).
    """
    d = disease_name.lower()
    crop_type = "pepper" if "pepper" in d else ("potato" if "potato" in d else "tomato")

    if crop_type == "pepper":
        # === BELL PEPPER (Upright bush with hanging bell peppers) ===
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.85, location=(0, 0, 0.42))
        stem = bpy.context.active_object
        stem.name = "PepperStem"

        # Broad ovate leaves
        for ang in [0, 1.2, 2.4, 3.6, 4.8]:
            bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.45, location=(math.cos(ang)*0.22, math.sin(ang)*0.22, 0.55))
            leaf = bpy.context.active_object
            leaf.scale = (1.2, 0.25, 0.8)
            leaf.rotation_euler = (0.35, ang, 0.4)
            leaf.select_set(True)

        # Hanging 3D Bell Pepper
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.28, location=(0.14, 0.1, 0.38))
        fruit = bpy.context.active_object
        fruit.rotation_euler = (math.radians(160), 0, 0)
        fruit.select_set(True)

        stem.select_set(True)
        bpy.context.view_layer.objects.active = stem
        bpy.ops.object.join()
        prototype = stem

    elif crop_type == "potato":
        # === POTATO (Low dense spreading canopy) ===
        bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.15, location=(0, 0, 0.08))
        base_mound = bpy.context.active_object
        base_mound.name = "PotatoMound"

        for ang in [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4]:
            bpy.ops.mesh.primitive_cone_add(radius1=0.24, depth=0.5, location=(math.cos(ang)*0.28, math.sin(ang)*0.28, 0.32))
            fol = bpy.context.active_object
            fol.scale = (1.0, 0.3, 0.7)
            fol.rotation_euler = (0.4, ang, 0.2)
            fol.select_set(True)

        base_mound.select_set(True)
        bpy.context.view_layer.objects.active = base_mound
        bpy.ops.object.join()
        prototype = base_mound

    else:
        # === TOMATO (Tall vine with clustered round tomatoes) ===
        bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=1.05, location=(0, 0, 0.52))
        stem = bpy.context.active_object
        stem.name = "TomatoStem"

        for i, ang in enumerate([0, 1.4, 2.8, 4.2, 5.6]):
            bpy.ops.mesh.primitive_cone_add(radius1=0.2, depth=0.45, location=(math.cos(ang)*0.24, math.sin(ang)*0.24, 0.3 + i*0.12))
            lf = bpy.context.active_object
            lf.scale = (1.3, 0.2, 0.6)
            lf.rotation_euler = (0.3, ang, 0.25)
            lf.select_set(True)

        # Round tomatoes
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(0.12, 0.12, 0.45))
        tom = bpy.context.active_object
        tom.select_set(True)

        stem.select_set(True)
        bpy.context.view_layer.objects.active = stem
        bpy.ops.object.join()
        prototype = stem

    prototype.name = "BotanicalPrototype"
    return prototype

def create_farm_simulation(config: dict):
    clean_scene()
    
    timeline = config.get("timeline", {})
    frames_dir = os.path.abspath(config.get("frames_dir", "static/renders/temp_frames"))
    disease_name = config.get("disease_name", "Pepper__bell___Bacterial_spot")
    clean_dis = disease_name.replace('___', ' ').replace('__', ' ')
    tamil_label = config.get("tamil_label", "")
    wind_speed = config.get("wind_speed", 10.0)
    wind_deg = config.get("wind_deg", 90.0)
    
    os.makedirs(frames_dir, exist_ok=True)

    scene = bpy.context.scene
    sim_days = [1, 3, 6, 9, 12, 15, 18, 21, 25, 30]
    total_frames = len(sim_days)
    scene.frame_start = 1
    scene.frame_end = total_frames
    
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100

    # 1. Build Species-Specific Botanical Prototype
    prototype = build_botanical_prototype(disease_name)

    # Pathological Colors: Healthy vibrant green vs Disease necrotic rust
    healthy_color = (0.12, 0.62, 0.16, 1.0)
    diseased_color = (0.68, 0.24, 0.06, 1.0) # Necrotic pathogen rust

    rows, cols = 10, 10
    spacing = 1.35

    for r in range(rows):
        for c in range(cols):
            plant_key = f"plant_{r}_{c}"
            obj = bpy.data.objects.new(plant_key, prototype.data)
            obj.location = (c * spacing, r * spacing, 0)
            bpy.context.collection.objects.link(obj)

            mat = bpy.data.materials.new(name=f"Mat_{plant_key}")
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if not bsdf:
                bsdf = mat.node_tree.nodes.new(type="ShaderNodeBsdfPrincipled")
            obj.data.materials.append(mat)

            # Determine keyframe for infection
            day_infected = timeline.get(plant_key)
            
            for frame_idx, cur_day in enumerate(sim_days, start=1):
                scene.frame_set(frame_idx)
                if day_infected is not None and day_infected <= cur_day:
                    bsdf.inputs[0].default_value = diseased_color
                else:
                    bsdf.inputs[0].default_value = healthy_color
                bsdf.inputs[0].keyframe_insert("default_value")

    bpy.context.collection.objects.unlink(prototype)

    # 2. Agricultural Loam Ground Plane
    bpy.ops.mesh.primitive_plane_add(size=22, location=(5.85, 5.85, 0))
    ground = bpy.context.active_object
    ground.name = "GroundSoil"
    g_mat = bpy.data.materials.new(name="SoilMat")
    g_bsdf = g_mat.node_tree.nodes.get("Principled BSDF")
    if g_bsdf:
        g_bsdf.inputs[0].default_value = (0.24, 0.16, 0.08, 1.0) # Rich loam brown
    ground.data.materials.append(g_mat)

    # 3. Sunlight
    bpy.ops.object.light_add(type='SUN', location=(10, -5, 15))
    sun = bpy.context.active_object
    sun.data.energy = 3.8
    sun.rotation_euler = (math.radians(45), math.radians(15), math.radians(25))

    # 4. Clean Cinematic Isometric Camera centered with TRACK_TO
    field_cx = (cols - 1) * spacing / 2.0
    field_cy = (rows - 1) * spacing / 2.0
    target = bpy.data.objects.new("CamTarget", None)
    target.location = (field_cx, field_cy, 0)
    bpy.context.collection.objects.link(target)

    bpy.ops.object.camera_add(location=(field_cx, field_cy - 12.5, 14.5))
    cam = bpy.context.active_object
    track = cam.constraints.new(type='TRACK_TO')
    track.target = target
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    scene.camera = cam

    # 6. Render frame sequence as PNG
    frame_prefix = os.path.join(frames_dir, "frame_")
    scene.render.filepath = frame_prefix
    scene.render.image_settings.file_format = 'PNG'

    print(f"[Blender] Rendering {total_frames} frames of {clean_dis} to {frames_dir}...")
    bpy.ops.render.render(animation=True)
    print(f"[Blender] Botanical render batch complete.")

if __name__ == "__main__":
    config_data = {}
    if "--" in sys.argv:
        idx = sys.argv.index("--")
        args = sys.argv[idx + 1:]
        if args:
            try:
                config_data = json.loads(args[0])
            except Exception as e:
                print(f"[Blender Script Error] Failed to parse CLI args: {e}")

    if not config_data:
        config_data = {
            "disease_name": "Pepper__bell___Bacterial_spot",
            "wind_speed": 12.0,
            "wind_deg": 90.0,
            "timeline": {f"plant_{r}_{c}": (r + c) for r in range(10) for c in range(10)},
            "frames_dir": "static/renders/temp_frames"
        }

    create_farm_simulation(config_data)
