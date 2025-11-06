#!/usr/bin/env python3
import json
import random
import math

def generate_star_catalog(num_stars=50000):
    """
    Generate a realistic star catalog with 3D coordinates,
    brightness (magnitude), and color information.
    """
    stars = []

    for i in range(num_stars):
        # Generate spherical coordinates
        # Right Ascension: 0 to 360 degrees (uniform distribution)
        ra = random.uniform(0, 360)

        # Declination: -90 to +90 degrees (weighted towards galactic plane)
        # Use a mix of uniform and concentrated distribution
        if random.random() < 0.6:  # 60% concentrated near galactic plane
            dec = random.gauss(0, 30)  # Gaussian distribution
            dec = max(-90, min(90, dec))  # Clamp to valid range
        else:
            dec = random.uniform(-90, 90)

        # Distance: logarithmic distribution (parsecs)
        # Most stars are closer, fewer are far away
        distance = 10 ** random.uniform(0, 3)  # 1 to 1000 parsecs

        # Convert spherical to Cartesian coordinates
        ra_rad = math.radians(ra)
        dec_rad = math.radians(dec)

        x = distance * math.cos(dec_rad) * math.cos(ra_rad)
        y = distance * math.cos(dec_rad) * math.sin(ra_rad)
        z = distance * math.sin(dec_rad)

        # Apparent magnitude (brightness)
        # Brighter stars have lower magnitude values
        # Range from -1.5 (very bright) to 6.5 (faint, naked eye limit)
        magnitude = random.triangular(-1.5, 6.5, 4.0)

        # B-V Color Index (determines star color)
        # Range: -0.4 (blue) to +2.0 (red)
        # Most stars are around 0.6 (yellow-white)
        color_index = random.triangular(-0.4, 2.0, 0.6)

        star = {
            "id": i,
            "ra": round(ra, 6),
            "dec": round(dec, 6),
            "x": round(x, 4),
            "y": round(y, 4),
            "z": round(z, 4),
            "magnitude": round(magnitude, 2),
            "colorIndex": round(color_index, 3)
        }

        stars.append(star)

    return stars

# Generate the catalog
print("Generating 50,000 stars...")
catalog = generate_star_catalog(50000)

# Save to JSON
output = {
    "metadata": {
        "count": len(catalog),
        "description": "Synthetic star catalog with realistic distribution",
        "units": {
            "ra": "degrees",
            "dec": "degrees",
            "coordinates": "parsecs",
            "magnitude": "apparent magnitude",
            "colorIndex": "B-V color index"
        }
    },
    "stars": catalog
}

with open('data.json', 'w') as f:
    json.dump(output, f, separators=(',', ':'))

print(f"Successfully generated {len(catalog)} stars!")
print(f"File size: {len(json.dumps(output)) / 1024 / 1024:.2f} MB")
