"""
Blender 3D Treatment Zone & Containment Buffer Mapper
Visualizes 2-meter and 5-meter bio-fungicide containment barrier rings
centered precisely on Patient Zero and infected crop clusters.
Fast, clean render using Blender Workbench Studio.
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

def create_treatment_map(config: dict):
    clean_scene()
    
    infected_nodes = config.get("infected_nodes", [[5, 5]])
    treatment_type = config.get("treatment_type", "Trichoderma Viride Bio-Fungicide (2m Buffer)")
    output_path = config.get("output_path", "static/renders/treatment_zones.png")
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.color_type = 'MATERIAL'
    scene.display.shading.light = 'STUDIO'
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540

    spacing = 1.35
    rows, cols = 10, 10
    
    # 1. Agricultural Loam Ground Plane
    bpy.ops.mesh.primitive_plane_add(size=22, location=(6.075, 6.075, 0))
    ground = bpy.context.active_object
    ground.name = "GroundSoil"
    g_mat = bpy.data.materials.new(name="GroundMat")
    g_mat.diffuse_color = (0.24, 0.16, 0.09, 1.0)
    ground.data.materials.append(g_mat)

    # 2. Materials
    healthy_mat = bpy.data.materials.new(name="HealthyMat")
    healthy_mat.diffuse_color = (0.13, 0.65, 0.18, 1.0)

    infected_mat = bpy.data.materials.new(name="InfectedMat")
    infected_mat.diffuse_color = (0.85, 0.22, 0.08, 1.0) # Pathogen necrotic red

    beacon_mat = bpy.data.materials.new(name="BeaconMat")
    beacon_mat.diffuse_color = (1.0, 0.15, 0.1, 1.0)

    # Healthy Prototype
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.8, location=(0, 0, 0.4))
    h_stem = bpy.context.active_object
    h_stem.data.materials.append(healthy_mat)
    for ang in [0, 1.3, 2.6, 3.9, 5.2]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.22, depth=0.45, location=(math.cos(ang)*0.2, math.sin(ang)*0.2, 0.5))
        lf = bpy.context.active_object
        lf.scale = (1.2, 0.25, 0.7)
        lf.rotation_euler = (0.35, ang, 0.3)
        lf.data.materials.append(healthy_mat)
        lf.select_set(True)
    h_stem.select_set(True)
    bpy.context.view_layer.objects.active = h_stem
    bpy.ops.object.join()
    healthy_proto = h_stem

    # Infected Prototype
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.7, location=(0, 0, 0.35))
    i_stem = bpy.context.active_object
    i_stem.data.materials.append(infected_mat)
    for ang in [0, 1.4, 2.8, 4.2]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.2, depth=0.4, location=(math.cos(ang)*0.18, math.sin(ang)*0.18, 0.42))
        lf = bpy.context.active_object
        lf.scale = (1.0, 0.22, 0.6)
        lf.rotation_euler = (0.55, ang, 0.2)
        lf.data.materials.append(infected_mat)
        lf.select_set(True)
    i_stem.select_set(True)
    bpy.context.view_layer.objects.active = i_stem
    bpy.ops.object.join()
    infected_proto = i_stem

    infected_set = set(tuple(p) for p in infected_nodes)

    # Place crops
    for r in range(rows):
        for c in range(cols):
            is_inf = (r, c) in infected_set
            proto = infected_proto if is_inf else healthy_proto
            obj = bpy.data.objects.new(f"p_{r}_{c}", proto.data)
            obj.location = (c * spacing, r * spacing, 0)
            bpy.context.collection.objects.link(obj)

            if is_inf:
                # Add floating warning beacon above Patient Zero / infected crop
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(c * spacing, r * spacing, 1.05))
                beacon = bpy.context.active_object
                beacon.name = f"Beacon_{r}_{c}"
                beacon.data.materials.append(beacon_mat)

    bpy.context.collection.objects.unlink(healthy_proto)
    bpy.context.collection.objects.unlink(infected_proto)

    # 3. Concentric 2-Meter and 5-Meter Containment Barrier Zones
    barrier_mat = bpy.data.materials.new(name="BarrierMat")
    barrier_mat.diffuse_color = (0.05, 0.90, 0.95, 1.0) # Cyan bio-ring

    spray_mat = bpy.data.materials.new(name="SprayMat")
    spray_mat.diffuse_color = (0.1, 0.85, 0.95, 0.5) # Cyan spray mist

    buffer_mat = bpy.data.materials.new(name="BufferMat")
    buffer_mat.diffuse_color = (0.95, 0.75, 0.15, 0.8) # Amber 5m outer warning

    for idx, (ir, ic) in enumerate(infected_nodes):
        center_x = ic * spacing
        center_y = ir * spacing

        # Inner 2m Containment Ring (Glowing Cyan Bio-barrier)
        bpy.ops.mesh.primitive_torus_add(
            major_radius=2.2,
            minor_radius=0.1,
            location=(center_x, center_y, 0.15)
        )
        ring2m = bpy.context.active_object
        ring2m.name = f"Ring2M_{idx}"
        ring2m.data.materials.append(barrier_mat)

        # Semi-transparent Spray Zone Disk
        bpy.ops.mesh.primitive_cylinder_add(
            radius=2.2,
            depth=0.04,
            location=(center_x, center_y, 0.06)
        )
        disk = bpy.context.active_object
        disk.data.materials.append(spray_mat)

        # Outer 5m Safety Buffer Perimeter Ring (Amber)
        bpy.ops.mesh.primitive_torus_add(
            major_radius=4.2,
            minor_radius=0.06,
            location=(center_x, center_y, 0.12)
        )
        ring5m = bpy.context.active_object
        ring5m.name = f"Ring5M_{idx}"
        ring5m.data.materials.append(buffer_mat)

    # 4. Isometric Elevated Camera - Perfectly centered on field center using TRACK_TO
    field_cx = (cols - 1) * spacing / 2.0
    field_cy = (rows - 1) * spacing / 2.0
    
    target = bpy.data.objects.new("CamTarget", None)
    target.location = (field_cx, field_cy, 0)
    bpy.context.collection.objects.link(target)

    # Position camera back and high for balanced aerial perspective
    bpy.ops.object.camera_add(location=(field_cx, field_cy - 12.5, 14.5))
    cam = bpy.context.active_object
    track = cam.constraints.new(type='TRACK_TO')
    track.target = target
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    scene.camera = cam

    scene.render.filepath = os.path.abspath(output_path)
    scene.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
    print(f"[Blender] Treatment map rendered cleanly: {output_path}")

if __name__ == "__main__":
    cfg = {"infected_nodes": [[5, 5], [5, 6], [4, 5]]}
    if "--" in sys.argv:
        idx = sys.argv.index("--")
        args = sys.argv[idx + 1:]
        if args:
            try:
                cfg = json.loads(args[0])
            except Exception as e:
                print(f"[Blender Error] JSON parse error: {e}")
    create_treatment_map(cfg)
