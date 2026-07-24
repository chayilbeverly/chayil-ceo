"""Generate simple PNG icons for Chayil CEO PWA."""
import struct
import zlib
import os

def create_png(width, height, filepath):
    """Create a solid-color PNG with 'C' letter centered."""
    # Create image data: dark navy background with gold "C"
    pixels = []
    for y in range(height):
        row = []
        for x in range(width):
            # Dark navy #1A1A2E
            r, g, b, a = 0x1A, 0x1A, 0x2E, 0xFF
            # Draw a simple "C" shape in gold
            cx, cy = width // 2, height // 2
            scale = width / 192.0
            dx = (x - cx) / scale
            dy = (y - cy) / scale
            # Simple C shape
            dist = (dx*dx + dy*dy) ** 0.5
            # Ring between radius 30 and 50
            inner_r = 30
            outer_r = 50
            # Gap on the right side (C shape opening)
            angle = __import__('math').atan2(dy, dx)
            if inner_r <= dist <= outer_r and not (-0.6 < angle < 0.6):
                r, g, b = 0xC9, 0xA8, 0x4F  # Gold #C9A84F
            row.append((r, g, b, a))
        # PNG filter byte (0 = None) + RGB bytes
        raw = b'\x00' + bytes([c for pixel in row for c in pixel])
        pixels.append(raw)
    
    raw_data = b''.join(pixels)
    
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + c + crc
    
    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'
    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    # IDAT
    compressed = zlib.compress(raw_data)
    
    with open(filepath, 'wb') as f:
        f.write(sig)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', compressed))
        f.write(chunk(b'IEND', b''))
    print(f'Created {filepath} ({width}x{height})')

base = r'C:\Users\ajie\WorkBuddy\2026-07-24-11-30-58\chayil-ceo\icons'
create_png(192, 192, os.path.join(base, 'icon-192.png'))
create_png(512, 512, os.path.join(base, 'icon-512.png'))
