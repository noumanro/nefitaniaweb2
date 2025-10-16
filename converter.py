#!/usr/bin/env python3
"""
Conversor de imágenes PNG a WebP para optimizar el peso de las imágenes del sitio web.
Escanea recursivamente las carpetas y convierte PNG a WebP manteniendo la estructura.
"""

import os
import sys
from PIL import Image
import argparse

def convert_png_to_webp(png_path, quality=85, delete_original=False):
    """
    Convierte una imagen PNG a WebP
    
    Args:
        png_path (str): Ruta al archivo PNG
        quality (int): Calidad de compresión WebP (0-100)
        delete_original (bool): Si eliminar el archivo PNG original
    
    Returns:
        tuple: (success, webp_path, original_size, new_size)
    """
    try:
        # Generar ruta del archivo WebP
        webp_path = os.path.splitext(png_path)[0] + '.webp'
        
        # Obtener tamaño original
        original_size = os.path.getsize(png_path)
        
        # Abrir y convertir la imagen
        with Image.open(png_path) as img:
            # Convertir RGBA a RGB si es necesario (WebP funciona mejor con RGB)
            if img.mode in ('RGBA', 'LA'):
                # Crear fondo blanco para transparencias
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])  # Usar canal alpha como máscara
                else:
                    background.paste(img)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Guardar como WebP
            img.save(webp_path, 'WebP', quality=quality, optimize=True)
        
        # Obtener nuevo tamaño
        new_size = os.path.getsize(webp_path)
        
        # Eliminar original si se solicita
        if delete_original:
            os.remove(png_path)
            print(f"  ✓ Eliminado: {os.path.basename(png_path)}")
        
        return True, webp_path, original_size, new_size
        
    except Exception as e:
        print(f"  ✗ Error convirtiendo {png_path}: {e}")
        return False, None, 0, 0

def scan_and_convert(directory, quality=85, delete_original=False, exclude_files=None):
    """
    Escanea un directorio y convierte todos los PNG a WebP
    
    Args:
        directory (str): Directorio a escanear
        quality (int): Calidad de compresión
        delete_original (bool): Si eliminar archivos originales
        exclude_files (list): Lista de nombres de archivos a excluir
    """
    if exclude_files is None:
        exclude_files = []
    
    total_original = 0
    total_new = 0
    converted_count = 0
    failed_count = 0
    
    print(f"\n🔍 Escaneando directorio: {directory}")
    print(f"📊 Configuración: Calidad {quality}%, {'Eliminar originales' if delete_original else 'Mantener originales'}")
    print("-" * 60)
    
    # Recorrer todos los archivos
    for root, dirs, files in os.walk(directory):
        png_files = [f for f in files if f.lower().endswith('.png') and f not in exclude_files]
        png_files.sort()  # Orden alfabético para consistencia
        if not png_files:
            continue
        print(f"\n📁 {os.path.relpath(root, directory)}/")
        # Buscar el mayor número de WebP existente
        existing_webps = [f for f in files if f.lower().endswith('.webp')]
        max_num = 0
        for w in existing_webps:
            try:
                n = int(os.path.splitext(w)[0])
                if n > max_num:
                    max_num = n
            except ValueError:
                continue
        # Numerar los nuevos WebP a partir del siguiente número
        for i, filename in enumerate(png_files, 1):
            png_path = os.path.join(root, filename)
            webp_num = max_num + i
            webp_name = f"{webp_num}.webp"
            webp_path = os.path.join(root, webp_name)
            print(f"  🖼️  {filename} → {webp_name}")
            try:
                with Image.open(png_path) as img:
                    if img.mode in ('RGBA', 'LA'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'RGBA':
                            background.paste(img, mask=img.split()[-1])
                        else:
                            background.paste(img)
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    img.save(webp_path, 'WebP', quality=quality, optimize=True)
                original_size = os.path.getsize(png_path)
                new_size = os.path.getsize(webp_path)
                if delete_original:
                    os.remove(png_path)
                    print(f"      ✓ Eliminado: {os.path.basename(png_path)}")
                converted_count += 1
                total_original += original_size
                total_new += new_size
                reduction = ((original_size - new_size) / original_size) * 100 if original_size > 0 else 0
                print(f"      {format_bytes(original_size)} → {format_bytes(new_size)} (-{reduction:.1f}%)")
            except Exception as e:
                print(f"      ✗ Error convirtiendo {filename}: {e}")
                failed_count += 1
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📈 RESUMEN DE CONVERSIÓN")
    print("=" * 60)
    print(f"✅ Archivos convertidos: {converted_count}")
    print(f"❌ Archivos fallidos: {failed_count}")
    
    if total_original > 0:
        total_reduction = ((total_original - total_new) / total_original) * 100
        print(f"📦 Tamaño original total: {format_bytes(total_original)}")
        print(f"📦 Tamaño nuevo total: {format_bytes(total_new)}")
        print(f"💾 Espacio ahorrado: {format_bytes(total_original - total_new)} ({total_reduction:.1f}%)")

def format_bytes(bytes_val):
    """Formatea bytes en unidades legibles"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_val < 1024.0:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.1f} TB"

def main():
    parser = argparse.ArgumentParser(description='Convertir imágenes PNG a WebP para optimización')
    parser.add_argument('directory', nargs='?', default='.', 
                       help='Directorio a escanear (por defecto: directorio actual)')
    parser.add_argument('-q', '--quality', type=int, default=85, 
                       help='Calidad de compresión WebP (0-100, por defecto: 85)')
    parser.add_argument('-d', '--delete', action='store_true', 
                       help='Eliminar archivos PNG originales después de la conversión')
    parser.add_argument('-e', '--exclude', nargs='*', default=['logo.png'], 
                       help='Archivos a excluir de la conversión (por defecto: logo.png)')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Mostrar qué archivos se convertirían sin hacer cambios')
    
    args = parser.parse_args()
    
    # Verificar que el directorio existe
    if not os.path.isdir(args.directory):
        print(f"❌ Error: El directorio '{args.directory}' no existe")
        sys.exit(1)
    
    # Verificar que Pillow está instalado
    try:
        from PIL import Image
    except ImportError:
        print("❌ Error: Se requiere la biblioteca Pillow")
        print("💡 Instálala con: pip install Pillow")
        sys.exit(1)
    
    # Modo dry-run
    if args.dry_run:
        print("🔍 MODO SIMULACIÓN - No se realizarán cambios")
        print(f"📁 Directorio: {os.path.abspath(args.directory)}")
        print(f"🚫 Archivos excluidos: {args.exclude}")
        
        count = 0
        for root, dirs, files in os.walk(args.directory):
            png_files = [f for f in files if f.lower().endswith('.png') and f not in args.exclude]
            if png_files:
                print(f"\n📁 {os.path.relpath(root, args.directory)}/")
                for filename in png_files:
                    count += 1
                    file_path = os.path.join(root, filename)
                    size = os.path.getsize(file_path)
                    print(f"  🖼️  {filename} ({format_bytes(size)})")
        
        print(f"\n📊 Se convertirían {count} archivos PNG")
        return
    
    # Ejecutar conversión
    scan_and_convert(args.directory, args.quality, args.delete, args.exclude)

if __name__ == "__main__":
    main()