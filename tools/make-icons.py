"""Genera los iconos PNG de la PWA sin dependencias externas.

Dibuja un círculo aqua sobre fondo oscuro con la silueta de una tienda.
Uso:  python3 tools/make-icons.py
"""

import struct
import zlib

BG = (11, 14, 19)      # --color-bg
FG = (47, 214, 196)    # --color-brand


def pixel(x, y, size):
    cx = cy = size / 2
    dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5

    # Fuera del disco: fondo
    if dist >= size * 0.46:
        return BG

    nx = x / size
    ny = y / size

    # Techo de la tienda (trazo horizontal)
    if 0.24 < nx < 0.76 and 0.30 < ny < 0.38:
        return FG
    # Cuerpo de la tienda
    if 0.29 < nx < 0.71 and 0.38 < ny < 0.68:
        return FG
    # Puerta (hueco en el cuerpo)
    if 0.44 < nx < 0.56 and 0.50 < ny < 0.68:
        return BG

    return BG


def chunk(tag, data):
    body = struct.pack(">I", len(data)) + tag + data
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return body + struct.pack(">I", crc)


def make_png(path, size):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filtro "none" por fila
        for x in range(size):
            raw.extend(pixel(x, y, size))

    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as fh:
        fh.write(png)
    print(f"{path}  {size}x{size}  {len(png)} bytes")


if __name__ == "__main__":
    make_png("icons/icon-192.png", 192)
    make_png("icons/icon-512.png", 512)
