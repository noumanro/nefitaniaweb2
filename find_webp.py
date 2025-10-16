import os

# Carpeta base donde buscar
base_dir = os.path.join(os.path.dirname(__file__), 'image')

print('Archivos .webp encontrados:')
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.lower().endswith('.webp'):
            rel_path = os.path.relpath(os.path.join(root, file), os.path.dirname(__file__))
            print(rel_path)
