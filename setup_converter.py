#!/usr/bin/env python3
"""
Script de configuración para el conversor de imágenes.
Instala dependencias y ejecuta pruebas básicas.
"""

import subprocess
import sys
import os

def install_pillow():
    """Instala Pillow si no está disponible"""
    try:
        import PIL
        print("✅ Pillow ya está instalado")
        return True
    except ImportError:
        print("📦 Instalando Pillow...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
            print("✅ Pillow instalado correctamente")
            return True
        except subprocess.CalledProcessError:
            print("❌ Error instalando Pillow")
            return False

def test_converter():
    """Prueba básica del conversor"""
    try:
        from PIL import Image
        print("✅ Pillow funciona correctamente")
        
        # Verificar formatos soportados
        if 'WEBP' in Image.EXTENSION:
            print("✅ Soporte WebP disponible")
        else:
            print("⚠️  Advertencia: Soporte WebP limitado")
        
        return True
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        return False

def main():
    print("🔧 CONFIGURACIÓN DEL CONVERSOR PNG→WebP")
    print("=" * 50)
    
    # Instalar dependencias
    if not install_pillow():
        sys.exit(1)
    
    # Probar funcionalidad
    if not test_converter():
        sys.exit(1)
    
    print("\n🎉 ¡Configuración completada!")
    print("\n📖 CÓMO USAR EL CONVERSOR:")
    print("=" * 50)
    print("1. Simulación (ver qué se convertiría):")
    print("   python converter.py --dry-run")
    print("")
    print("2. Conversión básica (mantener originales):")
    print("   python converter.py")
    print("")
    print("3. Conversión con eliminación de originales:")
    print("   python converter.py --delete")
    print("")
    print("4. Conversión con calidad específica:")
    print("   python converter.py --quality 75")
    print("")
    print("5. Ayuda completa:")
    print("   python converter.py --help")

if __name__ == "__main__":
    main()