# Planilla Livosur — Planilla de Vóley Online

**Proyecto:** Planilla digital para partidos de vóley (liga amateur), exportable y con estadísticas.  
**Estado:** Versión local (v30). Preparado para subir a GitHub y continuar desarrollo.

## Descripción breve
Aplicación web para registrar y llevar la planilla de partidos de vóley: carga de jugadores, registro de puntos, rotaciones, cambios, sanciones, tiempos pedidos, líberos y exportación de informes. Ideal para ligas amateur y clubes.

## Demo
- Archivos locales: `index.html`, `js/`, `css/`, `img/`.
- Para probar localmente: abrir `index.html` en un navegador (o usar un servidor local como `python -m http.server`).

## Características principales
- Carga de jugadores y formación inicial.
- Registro en tiempo real de puntos, rotaciones y cambios.
- Exportación de resultados (CSV / PDF según implementación).
- Diseño responsive (escritorio / tablet / móvil).
- Prerrequisitos: navegador moderno.

## Tecnologías
- HTML, CSS, JavaScript (vanilla).
- Estructura actual dentro de la carpeta `planilla_livosur - v30/`.

## Instalación / Ejecución local
1. Clona o descarga el repositorio.
2. Abre una terminal en la carpeta del proyecto.
3. Inicia un servidor local (opcional, recomendado para evitar problemas con importaciones):
```bash
# con Python 3
python -m http.server 8000
# luego abrir http://localhost:8000/ en el navegador
```
4. O simplemente abrir `index.html` en el navegador.

## Estructura del proyecto
```
/planilla_livosur - v30
├─ index.html
├─ css/
├─ js/
└─ img/
```

## Cómo contribuir
1. Fork del repositorio.
2. Crear rama con la feature: `git checkout -b feature/nombre`.
3. Commit de cambios: `git commit -am "Descripción corta"`.
4. Push y abrir Pull Request.

## Licencia
MIT — ver archivo `LICENSE`.

## Contacto
Marina Acerbi — marinaacerbi@hotmail.com

---

