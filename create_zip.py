#!/usr/bin/env python3
import zipfile
import os

def zip_directory(folder_path, output_path):
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(folder_path))
                zipf.write(file_path, arcname)

# Crear extensión simple solo para facturas
zip_directory('extension_modules/ncf_facturas_simple', 'ncf_facturas_simple.zip')
print('Extensión simple para facturas creada exitosamente: ncf_facturas_simple.zip')