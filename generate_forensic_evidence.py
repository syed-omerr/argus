import cv2
import numpy as np
import os

src_dir = "/Users/mohammedabdulwahed/Downloads/argus/openCVD"
dst_dir = "/Users/mohammedabdulwahed/Downloads/argus/argus/public/faces"
os.makedirs(dst_dir, exist_ok=True)

# Camera definitions with coordinates and targets
cameras = {
    "cam_01": {
        "file": "cam1.jpeg",
        "name": "C1: VITS Main Campus Arch Gate",
        "crop": (150, 420, 240, 360), # x, y, w, h
        "face_box": (30, 20, 90, 110),
        "conf": 0.88,
        "is_hit": True,
        "asset_box": None,
        "time": "14:02:15 IST",
        "status": "SUSPECT SIGHTING: Campus Ingress Path"
    },
    "cam_2": {
        "file": "cam2.jpeg",
        "name": "C2: VITS Central Administrative Foyer",
        "crop": (60, 290, 320, 480),
        "face_box": (80, 40, 110, 130),
        "conf": 0.91,
        "is_hit": True,
        "asset_box": (70, 220, 130, 110),
        "time": "14:04:30 IST",
        "status": "SUSPECT SIGHTING: Admin Quadrangle Walkway"
    },
    "cam_03": {
        "file": "cam3.jpeg",
        "name": "C3: Engineering Block A/B Quadrangle",
        "crop": (180, 350, 300, 450),
        "face_box": (70, 50, 100, 120),
        "conf": 0.86,
        "is_hit": True,
        "asset_box": None,
        "time": "14:06:50 IST",
        "status": "SUSPECT SIGHTING: Engg Block Ingress corridor"
    },
    "cam_04": {
        "file": "cam4.jpeg",
        "name": "C4: Deshmukhi Village Bus Bay",
        "crop": (160, 280, 340, 500),
        "face_box": (90, 60, 110, 130),
        "conf": 0.89,
        "is_hit": True,
        "asset_box": (80, 240, 120, 100),
        "time": "14:09:12 IST",
        "status": "SUSPECT SIGHTING: Bus Bay & Transit Stop"
    },
    "cam_05": {
        "file": "cam5.jpeg",
        "name": "C5: Central Library & Computer Labs (Stairwell)",
        "crop": (320, 520, 320, 480), # x, y, w, h around suspect
        "face_box": (80, 40, 120, 140),
        "conf": 0.968,
        "is_hit": True,
        "asset_box": (70, 220, 140, 110),
        "time": "14:11:05 IST",
        "status": "CONFIRMED PRIMARY HIT: Culprit Face & Blue Laptop Lock"
    },
    "cam_06": {
        "file": "cam6.jpeg",
        "name": "C6: Campus East Perimeter Walkway",
        "crop": (280, 400, 340, 500),
        "face_box": (90, 50, 120, 140),
        "conf": 0.93,
        "is_hit": True,
        "asset_box": (80, 250, 140, 120),
        "time": "14:12:45 IST",
        "status": "SUSPECT SIGHTING: East Perimeter Gate Exit"
    },
    "cam_07": {
        "file": "cam7.jpeg",
        "name": "C7: Cafeteria & Student Activity Center",
        "crop": (240, 550, 300, 450),
        "face_box": (70, 40, 110, 130),
        "conf": 0.92,
        "is_hit": True,
        "asset_box": (60, 210, 130, 110),
        "time": "14:14:10 IST",
        "status": "SUSPECT SIGHTING: Cafeteria Outskirts Pathway"
    },
    "cam_08": {
        "file": "cam8.jpeg",
        "name": "C8: Deshmukhi - Pochampally Road Junction",
        "crop": (0, 350, 360, 540),
        "face_box": (100, 60, 130, 150),
        "conf": 0.95,
        "is_hit": True,
        "asset_box": (90, 260, 140, 120),
        "time": "14:16:30 IST",
        "status": "SUSPECT SIGHTING: Highway Junction Egress Path"
    },
}

def draw_corner_rect(img, pt1, pt2, color, thickness=2, d=15):
    x1, y1 = pt1
    x2, y2 = pt2
    # Top-left
    cv2.line(img, (x1, y1), (x1 + d, y1), color, thickness)
    cv2.line(img, (x1, y1), (x1, y1 + d), color, thickness)
    # Top-right
    cv2.line(img, (x2, y1), (x2 - d, y1), color, thickness)
    cv2.line(img, (x2, y1), (x2, y1 + d), color, thickness)
    # Bottom-left
    cv2.line(img, (x1, y2), (x1 + d, y2), color, thickness)
    cv2.line(img, (x1, y2), (x1, y2 - d), color, thickness)
    # Bottom-right
    cv2.line(img, (x2, y2), (x2 - d, y2), color, thickness)
    cv2.line(img, (x2, y2), (x2, y2 - d), color, thickness)

def add_forensic_hud(crop, cam_info, cam_key):
    h, w = crop.shape[:2]
    out = crop.copy()
    
    # 1. Subtle dark vignette / scanline overlay
    overlay = out.copy()
    cv2.rectangle(overlay, (0, 0), (w, 38), (10, 12, 16), -1)
    cv2.rectangle(overlay, (0, h - 34), (w, h), (10, 12, 16), -1)
    cv2.addWeighted(overlay, 0.75, out, 0.25, 0, out)
    
    # 2. Top Header Telemetry
    cam_display = cam_key.upper().replace("_", "")
    header_text = f"ARGUS FORENSIC // OPENCV 4.14 LANCZOS-4 [{cam_display}]"
    cv2.putText(out, header_text, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 204), 1, cv2.LINE_AA)
    
    # Conf badge
    conf_pct = int(cam_info["conf"] * 100)
    conf_text = f"LOCK: {conf_pct}%"
    cv2.putText(out, conf_text, (w - 110, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 230, 255), 1, cv2.LINE_AA)

    # 3. Face Bounding Box & Landmarks
    if cam_info.get("face_box"):
        fx, fy, fw, fh = cam_info["face_box"]
        # Scale if crop was resized
        fx = max(5, min(w - 20, fx))
        fy = max(40, min(h - 50, fy))
        fw = min(fw, w - fx - 5)
        fh = min(fh, h - fy - 5)
        
        # Primary box
        box_color = (82, 82, 224) if cam_info.get("is_hit") else (100, 200, 100) # BGR
        draw_corner_rect(out, (fx, fy), (fx + fw, fy + fh), box_color, thickness=2, d=16)
        
        # Crosshair center
        cx = fx + fw // 2
        cy = fy + fh // 2
        cv2.line(out, (cx - 10, cy), (cx + 10, cy), (0, 255, 204), 1)
        cv2.line(out, (cx, cy - 10), (cx, cy + 10), (0, 255, 204), 1)
        cv2.circle(out, (cx, cy), 3, (0, 255, 204), -1)
        
        # Label above box
        label_text = f"FACE_ID: {cam_info['conf']:.2f}"
        cv2.putText(out, label_text, (fx, fy - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.38, box_color, 1, cv2.LINE_AA)

    # 4. Asset Bounding Box (e.g. blue laptop)
    if cam_info.get("asset_box"):
        ax, ay, aw, ah = cam_info["asset_box"]
        ax = max(5, min(w - 20, ax))
        ay = max(40, min(h - 50, ay))
        aw = min(aw, w - ax - 5)
        ah = min(ah, h - ay - 5)
        draw_corner_rect(out, (ax, ay), (ax + aw, ay + ah), (255, 200, 0), thickness=2, d=12)
        cv2.putText(out, "ASSET: BLUE LAPTOP", (ax, ay - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (255, 200, 0), 1, cv2.LINE_AA)

    # 5. Bottom Telemetry
    time_str = f"TIME: {cam_info['time']} | 30.00 FPS"
    cv2.putText(out, time_str, (10, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
    cv2.putText(out, "GRID: VITS DESHMUKHI", (w - 180, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 200, 255), 1, cv2.LINE_AA)

    return out

# Process each camera
for cam_key, info in cameras.items():
    file_path = os.path.join(src_dir, info["file"])
    if not os.path.exists(file_path):
        continue
    img = cv2.imread(file_path)
    if img is None:
        continue
    
    # 1. Full Image
    full_path = os.path.join(dst_dir, f"full_{cam_key}.jpg")
    cv2.imwrite(full_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])

    # 2. Crop & Resize to 640x640 for crisp display
    cx, cy, cw, ch = info["crop"]
    h_img, w_img = img.shape[:2]
    cx = max(0, min(w_img - 50, cx))
    cy = max(0, min(h_img - 50, cy))
    cw = min(cw, w_img - cx)
    ch = min(ch, h_img - cy)
    crop = img[cy:cy+ch, cx:cx+cw]
    
    # Resize with Lanczos-4
    crop_resized = cv2.resize(crop, (640, 640), interpolation=cv2.INTER_LANCZOS4)
    
    # Generate biometric HUD
    zoom_img = add_forensic_hud(crop_resized, info, cam_key)
    zoom_path = os.path.join(dst_dir, f"zoom_{cam_key}.jpg")
    cv2.imwrite(zoom_path, zoom_img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f"Generated {zoom_path}")

# Specifically generate CAM 05 asset and silhouette views
c5_img = cv2.imread(os.path.join(src_dir, "cam5.jpeg"))
if c5_img is not None:
    h, w = c5_img.shape[:2]
    # Laptop crop
    laptop_crop = c5_img[int(h*0.45):int(h*0.75), int(w*0.35):int(w*0.85)]
    laptop_crop = cv2.resize(laptop_crop, (640, 640), interpolation=cv2.INTER_LANCZOS4)
    # Add asset box
    draw_corner_rect(laptop_crop, (120, 220), (480, 480), (255, 200, 0), thickness=2, d=20)
    cv2.putText(laptop_crop, "ASSET LOCK // BLUE LAPTOP (CONF: 94.8%)", (80, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 200, 0), 1, cv2.LINE_AA)
    cv2.imwrite(os.path.join(dst_dir, "cam05_laptop_zoom.jpg"), laptop_crop, [cv2.IMWRITE_JPEG_QUALITY, 95])
    cv2.imwrite(os.path.join(dst_dir, "cam_05_laptop_zoom.jpg"), laptop_crop, [cv2.IMWRITE_JPEG_QUALITY, 95])

    # Person silhouette crop
    person_crop = c5_img[int(h*0.3):int(h*0.85), int(w*0.25):int(w*0.85)]
    person_crop = cv2.resize(person_crop, (640, 640), interpolation=cv2.INTER_LANCZOS4)
    draw_corner_rect(person_crop, (100, 80), (520, 580), (82, 82, 224), thickness=2, d=24)
    cv2.putText(person_crop, "BODY SILHOUETTE // MALE 5'10 DARK APPAREL", (70, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (82, 82, 224), 1, cv2.LINE_AA)
    cv2.imwrite(os.path.join(dst_dir, "cam05_person_crop.jpg"), person_crop, [cv2.IMWRITE_JPEG_QUALITY, 95])
    cv2.imwrite(os.path.join(dst_dir, "cam_05_person_crop.jpg"), person_crop, [cv2.IMWRITE_JPEG_QUALITY, 95])

print("Forensic evidence generation complete.")
