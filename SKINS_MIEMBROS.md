# 👥 Cómo agregar skins de miembros

Este documento explica cómo agregar skins de Minecraft de los miembros del clan para que aparezcan en el carrusel 3D de la web.

## 📁 Ubicación de las skins

Las skins deben estar en la carpeta: `/image/skin/`

## 📝 Formato de archivos

- **Extensión**: `.png`
- **Nombres**: Numéricos (1.png, 2.png, 3.png, etc.)
- **Tamaño recomendado**: 64x64 píxeles (skin estándar de Minecraft)
- **Transparencia**: Soportada

## 📥 Cómo obtener skins de Minecraft

### Opción 1: Desde NameMC (Recomendado)
1. Ve a https://namemc.com/
2. Busca el nombre de usuario del jugador
3. Haz clic en la skin actual
4. Clic en "Download" para descargar el archivo PNG

### Opción 2: Desde Crafatar API
Usa esta URL para descargar directamente (reemplaza `NOMBRE_USUARIO`):
```
https://crafatar.com/skins/NOMBRE_USUARIO
```

### Opción 3: Desde el juego
Si tienes acceso a los archivos del juego:
1. Abre `.minecraft/versions/[versión]/assets/skins/`
2. Copia la skin correspondiente

### Opción 4: Crear skin personalizada
Usa editores online como:
- https://www.minecraftskins.com/skin-editor/
- https://www.needcoolshoes.com/
- https://www.novaskin.me/

## 🔢 Nombrar las skins

Renombra los archivos de forma numérica secuencial:

```
image/skin/
  ├── 1.png    (Primer miembro)
  ├── 2.png    (Segundo miembro)
  ├── 3.png    (Tercer miembro)
  └── ...
```

**Importante**: Los números deben ser consecutivos sin saltos (1, 2, 3...).

## 🎨 Características del visor 3D

El carrusel mostrará automáticamente:
- ✅ Skin renderizada en 3D
- ✅ Rotación interactiva (click y arrastrar)
- ✅ Auto-rotación suave
- ✅ Animación de idle
- ✅ Navegación con flechas
- ✅ Contador de miembros

## 📤 Subir las skins al repositorio

### Método 1: GitHub Web
1. Ve a tu repositorio en GitHub
2. Navega a `image/skin/`
3. Arrastra los archivos PNG o usa "Add file" > "Upload files"
4. Commit los cambios

### Método 2: Git local
```powershell
# Agrega las skins a la carpeta
Copy-Item "ruta/a/tu/skin.png" "image/skin/1.png"

# Añade al staging
git add image/skin/

# Commit
git commit -m "Agregar skins de miembros"

# Push
git push origin main
```

## 🔄 Actualización automática

Una vez que las skins estén en GitHub:
1. OnRender redesplegará automáticamente
2. El carrusel detectará las nuevas skins
3. Los visitantes verán los miembros actualizados

## 🎯 Ejemplo de uso

Si tienes 5 miembros en el clan:

```
image/skin/
  ├── 1.png    (nefariusAP)
  ├── 2.png    (MiembroX)
  ├── 3.png    (MiembroY)
  ├── 4.png    (MiembroZ)
  └── 5.png    (NuevoMiembro)
```

El carrusel mostrará: "Skin 1 de 5", "Skin 2 de 5", etc.

## 💡 Tips y mejores prácticas

1. **Orden**: Ordena las skins por jerarquía (líderes primero, luego oficiales, luego miembros)
2. **Calidad**: Usa skins de 64x64 o 128x128 para mejor calidad
3. **Actualización**: Mantén las skins actualizadas cuando los miembros cambien su apariencia
4. **Documentación**: Crea un archivo `MIEMBROS.txt` con el nombre real de cada número:
   ```
   1.png - nefariusAP (Líder)
   2.png - Usuario123 (Oficial)
   3.png - Jugador456 (Miembro)
   ```

## 🆘 Solución de problemas

**No se muestran las skins:**
- Verifica que los archivos sean `.png`
- Comprueba que estén numerados correctamente (1.png, 2.png, etc.)
- Asegúrate de que estén en `/image/skin/`
- Revisa la consola del navegador (F12) para errores

**Las skins se ven pixeladas:**
- Usa skins de mayor resolución (128x128 o 256x256)
- Verifica que el archivo PNG tenga buena calidad

**El visor 3D no carga:**
- Verifica la conexión a internet (usa CDN de skinview3d)
- Revisa que el navegador soporte WebGL

## 🔗 Recursos útiles

- [NameMC](https://namemc.com/) - Buscar skins de jugadores
- [Crafatar API](https://crafatar.com/) - API de skins
- [Nova Skin](https://www.novaskin.me/) - Editor de skins
- [Minecraft Skins](https://www.minecraftskins.com/) - Galería de skins

---

**¿Necesitas ayuda?** Consulta la documentación de skinview3d: https://github.com/bs-community/skinview3d
