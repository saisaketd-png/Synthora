import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np

src_path = r"C:\Users\saisa\.gemini\antigravity-ide\brain\0ee2aafe-177f-4c03-81d2-574d9257813c\.user_uploaded\media_1788099022441.png"
public_dir = r"d:\Saisaket\Synthora\frontend\public"
app_dir = r"d:\Saisaket\Synthora\frontend\src\app"

os.makedirs(public_dir, exist_ok=True)
os.makedirs(app_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
arr = np.array(img, dtype=np.uint8)

# 1. Precise Alpha Channel Extraction
# Let's compute luminance and background diff
# The background is a soft vignette between #F2F8F9 (242, 248, 249) and #FCFCFC (252, 252, 252).
# The navy color is roughly (14, 39, 76) #0E274C
# The green nodes are roughly (60, 160, 90) #3CA05A to #10B981
# The dark node is (20, 45, 85)
# Inside the K is pure white (255, 255, 255)

# Bounding boxes:
# Overall: (300, 115, 725, 445)
# K Mark: (400, 115, 625, 338)
# KEMKENDRA text: (302, 368, 722, 414)
# Subtitle: (325, 426, 698, 444)

# Create a clean transparent full logo:
# Let's crop the full logo bounding box with a small margin
full_box = (295, 110, 729, 450)
full_crop = img.crop(full_box)

# Extract transparency with thresholding on the background
crop_arr = np.array(full_crop, dtype=np.float32)
r, g, b, a = crop_arr[:, :, 0], crop_arr[:, :, 1], crop_arr[:, :, 2], crop_arr[:, :, 3]

# In the full logo, background is off-white (r>230 and g>230 and b>230) OUTSIDE the K.
# Let's create an alpha mask:
# Foreground is where color is distinctly dark (navy) or colorful (green).
# Let's calculate color saturation and darkness:
max_c = np.maximum(np.maximum(r, g), b)
min_c = np.minimum(np.minimum(r, g), b)
saturation = max_c - min_c
darkness = 255.0 - (r * 0.299 + g * 0.587 + b * 0.114)

# Alpha matte:
# High darkness (> 25) OR High saturation (> 20) is foreground
# Inside the K (which has white fill surrounded by navy stroke), we preserve the white fill.
# Let's fill the interior of K so it retains its crisp white backdrop.
# Or transparent background everywhere outside the elements.

# Let's build clean RGBA for the full logo
alpha = np.clip((darkness * 2.5 + saturation * 3.0), 0, 255).astype(np.uint8)
# Smooth alpha transition
alpha_img = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
alpha_arr = np.array(alpha_img)

# Cleaned full image
clean_full = Image.new("RGBA", full_crop.size, (0, 0, 0, 0))
clean_full_arr = np.array(full_crop)
clean_full_arr[:, :, 3] = np.clip(alpha_arr * 1.5, 0, 255).astype(np.uint8)
# For pixels that are foreground, preserve their original colors
clean_full = Image.fromarray(clean_full_arr)

# Save standard full logo
clean_full.save(os.path.join(public_dir, "kemkendra-logo.png"), "PNG", optimize=True)
clean_full.save(os.path.join(public_dir, "logo.png"), "PNG", optimize=True)
print("Saved kemkendra-logo.png, size:", clean_full.size)

# 2. Extract the Standalone K Mark (Icon / Favicon)
k_box = (398, 114, 625, 340)
k_crop = img.crop(k_box)
# Make it square
kw, kh = k_crop.size
max_dim = max(kw, kh)
k_sq = Image.new("RGBA", (max_dim + 16, max_dim + 16), (0, 0, 0, 0))
offset_x = (max_dim + 16 - kw) // 2
offset_y = (max_dim + 16 - kh) // 2

k_arr = np.array(k_crop, dtype=np.float32)
kr, kg, kb = k_arr[:, :, 0], k_arr[:, :, 1], k_arr[:, :, 2]
k_dark = 255.0 - (kr * 0.299 + kg * 0.587 + kb * 0.114)
k_sat = np.maximum(np.maximum(kr, kg), kb) - np.minimum(np.minimum(kr, kg), kb)
k_alpha = np.clip(k_dark * 3.0 + k_sat * 3.5, 0, 255).astype(np.uint8)

k_clean_arr = np.array(k_crop)
k_clean_arr[:, :, 3] = np.clip(k_alpha * 1.6, 0, 255).astype(np.uint8)
k_clean = Image.fromarray(k_clean_arr)

k_sq.paste(k_clean, (offset_x, offset_y), k_clean)

# Generate multi-resolution icons
icon_512 = k_sq.resize((512, 512), Image.Resampling.LANCZOS)
icon_256 = k_sq.resize((256, 256), Image.Resampling.LANCZOS)
icon_192 = k_sq.resize((192, 192), Image.Resampling.LANCZOS)
icon_180 = k_sq.resize((180, 180), Image.Resampling.LANCZOS)
icon_128 = k_sq.resize((128, 128), Image.Resampling.LANCZOS)
icon_64 = k_sq.resize((64, 64), Image.Resampling.LANCZOS)
icon_48 = k_sq.resize((48, 48), Image.Resampling.LANCZOS)
icon_32 = k_sq.resize((32, 32), Image.Resampling.LANCZOS)
icon_16 = k_sq.resize((16, 16), Image.Resampling.LANCZOS)

# Save icon sizes
icon_512.save(os.path.join(public_dir, "kemkendra-icon.png"), "PNG", optimize=True)
icon_512.save(os.path.join(public_dir, "icon-512.png"), "PNG", optimize=True)
icon_192.save(os.path.join(public_dir, "icon-192.png"), "PNG", optimize=True)
icon_180.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG", optimize=True)
icon_32.save(os.path.join(public_dir, "favicon.png"), "PNG", optimize=True)
icon_32.save(os.path.join(public_dir, "favicon-32x32.png"), "PNG", optimize=True)
icon_16.save(os.path.join(public_dir, "favicon-16x16.png"), "PNG", optimize=True)

# Next.js App Router icon
icon_512.save(os.path.join(app_dir, "icon.png"), "PNG", optimize=True)

# Multi-resolution ICO
icon_256.save(
    os.path.join(public_dir, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
)
icon_256.save(
    os.path.join(app_dir, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
)

print("Saved all favicon and icon assets successfully!")

# 3. Generate Horizontal Lockup (K Mark on Left + Text on Right)
# Extract KEMKENDRA text + subtitle
text_box = (300, 368, 725, 448)
text_crop = img.crop(text_box)
t_arr = np.array(text_crop, dtype=np.float32)
tr, tg, tb = t_arr[:, :, 0], t_arr[:, :, 1], t_arr[:, :, 2]
t_dark = 255.0 - (tr * 0.299 + tg * 0.587 + tb * 0.114)
t_sat = np.maximum(np.maximum(tr, tg), tb) - np.minimum(np.minimum(tr, tg), tb)
t_alpha = np.clip(t_dark * 3.0 + t_sat * 3.5, 0, 255).astype(np.uint8)

t_clean_arr = np.array(text_crop)
t_clean_arr[:, :, 3] = np.clip(t_alpha * 1.6, 0, 255).astype(np.uint8)
t_clean = Image.fromarray(t_clean_arr)

# Horizontal composition: [Icon (height: 90)] [Gap: 16] [Text (height: 72)]
h_icon = k_sq.resize((90, 90), Image.Resampling.LANCZOS)
t_ratio = 70.0 / t_clean.height
t_scaled = t_clean.resize((int(t_clean.width * t_ratio), 70), Image.Resampling.LANCZOS)

h_canvas = Image.new("RGBA", (h_icon.width + 18 + t_scaled.width, 90), (0, 0, 0, 0))
h_canvas.paste(h_icon, (0, 0), h_icon)
h_canvas.paste(t_scaled, (h_icon.width + 18, (90 - t_scaled.height) // 2), t_scaled)

h_canvas.save(os.path.join(public_dir, "kemkendra-logo-horizontal.png"), "PNG", optimize=True)
print("Saved kemkendra-logo-horizontal.png, size:", h_canvas.size)

# 4. Generate Dark Mode Inverted Variants
# For dark mode, convert dark navy (r<50, g<70, b<110) to bright crisp white (#FFFFFF)
# and preserve the vibrant green (#10b981 / #3CA05A)
def create_dark_variant(rgba_img):
    arr = np.array(rgba_img).copy()
    # Mask navy blue pixels (r < 50, g < 75, b < 130 and alpha > 30)
    is_navy = (arr[:, :, 0] < 60) & (arr[:, :, 1] < 85) & (arr[:, :, 2] < 140) & (arr[:, :, 3] > 30)
    # Convert navy to crisp pure white
    arr[is_navy, 0] = 255
    arr[is_navy, 1] = 255
    arr[is_navy, 2] = 255
    return Image.fromarray(arr)

dark_logo = create_dark_variant(clean_full)
dark_logo.save(os.path.join(public_dir, "kemkendra-logo-dark.png"), "PNG", optimize=True)

dark_h_logo = create_dark_variant(h_canvas)
dark_h_logo.save(os.path.join(public_dir, "kemkendra-logo-horizontal-dark.png"), "PNG", optimize=True)

dark_icon = create_dark_variant(icon_512)
dark_icon.save(os.path.join(public_dir, "kemkendra-icon-dark.png"), "PNG", optimize=True)

print("Generated Dark mode variants successfully!")
