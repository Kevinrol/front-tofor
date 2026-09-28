# Documentación de Diseño: EduStock Dashboard

Este documento detalla los lineamientos de diseño, la paleta de colores, la tipografía y otros elementos visuales utilizados en el proyecto de Dashboard "EduStock". El diseño se enfoca en crear una experiencia moderna, limpia, altamente legible y funcional.

## Tipografía (Fuentes)

El proyecto utiliza la familia tipográfica **Inter** como fuente principal. "Inter" es una fuente sans-serif geométrica, diseñada específicamente para pantallas y para proporcionar una excelente legibilidad en interfaces de usuario complejas.

*   **Fuente Principal:** `Inter` (importada desde Google Fonts).
*   **Fuentes de Respaldo (Fallback):** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
*   **Pesos Utilizados (Font Weights):**
    *   **300 (Light):** Utilizado para textos grandes muy sutiles o decorativos.
    *   **400 (Regular):** Utilizado para el texto base, cuerpo del documento y descripciones.
    *   **500 (Medium):** Utilizado en elementos de la interfaz de usuario, botones y textos que requieren un ligero énfasis sobre el texto regular.
    *   **600 (SemiBold):** Utilizado para subtítulos, etiquetas importantes y títulos secundarios en tarjetas.
    *   **700 (Bold):** Utilizado para títulos principales y datos estadísticos destacados.
    *   **800 (ExtraBold):** Utilizado para elementos de marca de altísimo contraste, como la letra "P" en el logotipo/favicon temporal.

## Paleta de Colores

La paleta de colores está estructurada utilizando variables nativas CSS (Custom Properties) definidas en `:root` dentro de `index.css`. Esto asegura la consistencia en toda la aplicación y facilita la escalabilidad o creación de temas (theming).

### Color Principal (Brand / Primary)
El color principal de la marca es un naranja/rojo vibrante. Se utiliza para resaltar acciones primarias (Call to Action), botones principales, estados activos en menús y el logotipo de la aplicación.

*   **Primary:** `#FD3706` (Color base)
*   **Primary Hover:** `#E32E00` (Utilizado al interactuar/hacer hover sobre elementos primarios)
*   **Primary Light:** `rgba(253, 55, 6, 0.12)` (Fondo semitransparente para estados activos en ítems de menú)
*   **Primary Glow:** `rgba(253, 55, 6, 0.25)` (Utilizado para sombras dinámicas e iluminaciones asociadas al color principal)

### Fondos (Backgrounds)
Colores neutros utilizados para la estructura general de la aplicación, separando visualmente las capas de profundidad.

*   **Background Viewport (Fondo general de la pantalla):** `#E4E7EB` (Un gris azulado muy suave que enmarca la aplicación)
*   **Background App (Fondo interior de la aplicación):** `#F7F8FA`
*   **Background Superficie / Tarjetas:** `#FFFFFF` (Blanco puro para las tarjetas de contenido y componentes frontales, creando contraste con el fondo)
*   **Background Sutil:** `#F3F4F7` (Fondo para elementos secundarios como inputs o barras laterales)
*   **Background Hover:** `#EEF0F4` (Fondo que aparece al pasar el cursor sobre elementos interactivos como filas de tablas)

### Texto y Tipografía (Text Colors)
Se utiliza una escala de grises azulados fríos para el texto, estableciendo una clara jerarquía visual y manteniendo un buen contraste (WCAG).

*   **Text Heading (Títulos principales):** `#18171C` (Casi negro, muy contrastante)
*   **Text Body (Texto normal/Cuerpo):** `#3F434E` (Gris oscuro para legibilidad sin fatiga visual)
*   **Text Secondary (Texto secundario):** `#747986` (Gris medio para descripciones o datos menos críticos)
*   **Text Muted (Texto atenuado):** `#9DA2AE` (Gris claro para iconos secundarios, labels o timestamps)
*   **Text Placeholder:** `#B1B5C0` (Texto indicativo dentro de campos de formulario vacíos)

### Bordes y Líneas Divisorias (Borders)
Para separar sutilmente los componentes, secciones y filas de tablas sin recargar visualmente la interfaz.

*   **Border Normal:** `#DBDBDB` (Bordes generales de inputs o tarjetas)
*   **Border Sutil:** `#EBEBEB` (Separadores internos de listas o tablas)
*   **Border Claro:** `#F0F0F2` (Separadores muy delicados en encabezados)

### Colores Semánticos (Status Indicators)
Usados para comunicar el estado del sistema, alertas, y métricas financieras o de inventario (tendencias positivas/negativas).

*   🟢 **Éxito (Success):** `#059669` (Texto/Iconos) | *Fondo Éxito:* `#E6F7ED` (Para badges y alertas positivas)
*   🟡 **Advertencia (Warning):** `#D97706` (Texto/Iconos) | *Fondo Advertencia:* `#FEF3C7` (Para stock bajo o alertas de atención)
*   🔴 **Peligro / Error (Danger):** `#EF4444` (Texto/Iconos) | *Fondo Peligro:* `#FEE2E2` (Para tendencias a la baja, errores o stock agotado)

### Tonos Oscuros (Dark / High Contrast)
Tonos profundos que pueden usarse para tooltips oscuros, componentes invertidos o futuras bases de un "Modo Oscuro".

*   **Dark Base / Card:** `#222026`
*   **Dark Surface:** `#1B191E`

## Sombras (Shadows) y Elevación

El proyecto utiliza un sistema de sombras estratificado para dar profundidad (Z-index visual) y destacar componentes interactivos o superpuestos.

*   **Shadow Card:** `0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)`
    *   *Uso:* Sombra base para las tarjetas de información (`Cards`) en el panel.
*   **Shadow Hover:** `0 8px 24px rgba(34, 32, 38, 0.08), 0 2px 6px rgba(34, 32, 38, 0.04)`
    *   *Uso:* Elevación interactiva que ocurre cuando el usuario pasa el ratón por encima de una tarjeta clicable.
*   **Shadow Tooltip/Dropdown:** `0 12px 28px -6px rgba(20, 22, 28, 0.35)`
    *   *Uso:* Sombra más intensa y pronunciada para elementos que flotan por encima de toda la interfaz, como menús desplegables o tooltips informativos.
*   **Shadow Mockup:** `0 25px 60px -15px rgba(26, 28, 35, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.12)`
    *   *Uso:* Sombra muy profunda y amplia que enmarca todo el contenedor principal de la aplicación, dando la sensación de que la interfaz de usuario está flotando o contenida dentro de una ventana de sistema operativo.

## Geometría y Radios de Borde (Border Radius)

Se utilizan esquinas redondeadas sistemáticas para brindar un aspecto moderno, suave y consistente (estilo "Squircle").

*   **`--radius-xs` (6px):** Checkboxes, inputs pequeños, badges interiores.
*   **`--radius-sm` (10px):** Botones estándar, inputs de texto, avatares cuadrados.
*   **`--radius-md` (16px):** Tarjetas de estadísticas (`StatCards`), contenedores internos.
*   **`--radius-lg` (22px):** Paneles y secciones más grandes dentro del dashboard.
*   **`--radius-xl` (32px):** Utilizado para el radio externo del marco/contenedor general de la aplicación (`mockup-frame`).
*   **`--radius-pill` (9999px):** Totalmente redondeado. Utilizado para badges circulares, scrollbars personalizados e indicadores de notificaciones.
