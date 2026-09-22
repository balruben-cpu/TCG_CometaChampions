# ☄️ Cometa Champions: Official TCG

¡Bienvenido al repositorio oficial del diseño y estrategia del **Juego de Cartas Coleccionables (TCG)** de Cometa Champions! Este proyecto define la expansión digital y física que llevará el universo de los trompos a un nuevo nivel de coleccionismo y estrategia.

---

## 🌀 El Círculo Cometa (Sistema de Clanes)

El núcleo del juego reside en la interacción entre los 4 grandes clanes. Cada uno posee una identidad única y una ventaja estratégica sobre otro, creando un ecosistema equilibrado de **"Piedra, Papel o Tijera"** avanzado.

> **Mecánica de Ventaja:** Atacar a un clan débil otorga **+1 de Daño (⚔️)** adicional.

*   **Milenarios (🌳)** > Ventaja sobre **Fugitivos (⛓️)**
*   **Fugitivos (⛓️)** > Ventaja sobre **Depredadores (🪓)**
*   **Depredadores (🪓)** > Ventaja sobre **Míticos (🐉)**
*   **Míticos (🐉)** > Ventaja sobre **Milenarios (🌳)**

---

## 🃏 Categorías de Colección (Set Base: 80 Cartas)

La colección inicial se divide en 4 pilares fundamentales, con 20 cartas cada uno (5 por clan):

1.  **Héroes Champions**: Los protagonistas del juego actual en alta fidelidad.
2.  **Bestias Kombat**: Las formas ancestrales y míticas de los personajes. Arte agresivo y stats superiores.
3.  **Trompos Físicos**: El puente entre el juguete real y el mundo digital. Funcionan como objetos y hechizos.
4.  **Arenas / Locaciones**: Escenarios dinámicos que cambian las reglas del campo de batalla.

---

## ✨ Galería de Prototipos (Mockups)

### Campeones Legendarios
Diseños premium con shaders holográficos y acabados metálicos.

| Milenarios | Depredadores | Fugitivos | Míticos |
| :---: | :---: | :---: | :---: |
| ![Azteca](assets/mockups/azteca_card_milenarios_mockup_1773452793855.png) | ![Turbo Dragón](assets/mockups/turbo_dragon_card_mockup_1773452690799.png) | ![Jumbo Cobra](assets/mockups/jumbo_cobra_card_fugitivos_mockup_1773452806022.png) | ![Rex](assets/mockups/rex_card_miticos_mockup_1773452819283.png) |

### Bestias Kombat (Formas Evolucionadas)
Arte 2D detallado para las cartas más poderosas de la colección.

| Azteca Guardián | Panther Cazadora | Diamante Leviatán | Fénix Ave Ígnea |
| :---: | :---: | :---: | :---: |
| ![Azteca B](assets/mockups/azteca_guardian_bestia_milenarios_mockup_1773453577040.png) | ![Panther B](assets/mockups/panther_cazadora_bestia_depredadores_mockup_1773453590450.png) | ![Diamante B](assets/mockups/diamante_leviatan_bestia_fugitivos_mockup_1773453664321_1773453604986.png) | ![Fénix B](assets/mockups/fenix_ave_ignea_bestia_miticos_mockup_1773453692456_png_1773453621317.png) |

### Arenas / Locaciones (Zonas de Batalla)
Panorámicas inmersivas que definen las reglas de combate por clan.

| Templo Milenario | Ruinas de Draconia | Red de la Viuda | Santuario del Sol |
| :---: | :---: | :---: | :---: |
| ![Templo](assets/mockups/templo_milenario_arena_mockup_1773454124187.png) | ![Ruinas](assets/mockups/ruinas_draconia_arena_mockup_1773454136070.png) | ![Red](assets/mockups/red_viuda_arena_mockup_1773454224567_1773454148345.png) | ![Santuario](assets/mockups/santuario_sol_arena_mockup_1773454245678_1773454160365.png) |

### Trompos Físicos (Objetos / Magia)
Renders realistas del producto físico con sus efectos en el juego.

| Trompo Azteca | Trompo King Cobra | Trompo Jumbo Cobra | Trompo Rex |
| :---: | :---: | :---: | :---: |
| ![Azteca T](assets/mockups/trompo_azteca_milenarios_mockup_1773457634914.png) | ![King T](assets/mockups/trompo_king_cobra_depredadores_mockup_1773454224567_1773457649782.png) | ![Jumbo T](assets/mockups/trompo_jumbo_cobra_fugitivos_mockup_1773454245678_1773457665354.png) | ![Rex T](assets/mockups/trompo_rex_miticos_mockup_1773454266789_1773457678678.png) |

---

## 📂 Documentación Técnica

Para una inmersión profunda en las reglas, stats de las 80 cartas y el plan de implementación técnica, consulta:

*   📑 **[Plan de Implementación (Digital & Físico)](./implementation_plan.md)**: Detalle completo de stats, efectos de arenas, sistemas de gacha y reglas de juego 1v1.

---

## 🌐 Presentación Web Interactiva & Simulador de Batalla

El proyecto cuenta con una Single-Page Application (SPA) interactiva desarrollada con tecnología web nativa (HTML5, Vanilla CSS3 y JavaScript moderno) con temática Apple Day/Night:

*   **🖥️ Modo Presentación:** Diapositivas interactivas (8 slides) que presentan el juego, el lore, los 4 clanes, las 4 categorías de cartas y la estrategia.
*   **🎴 Catálogo Interactivo (80 Cartas):** Visor 3D con efecto tilt/giro, filtros dinámicos por clan, categoría, búsqueda por texto, modal inspector y simulador de apertura de sobres booster.
*   **⚔️ Simulador de Batalla (Marvel Snap + Pokémon Pocket):**
    *   3 Arenas simultáneas con efectos de terreno.
    *   6 turnos con energía incremental (1 a 6).
    *   Mecánica de ventaja elemental del **Círculo Cometa (+1 ⚔️)**.
    *   Despliegue de Trompos Físicos de soporte.
    *   Modo deshacer jugadas antes de finalizar turno.
    *   Bot oponente con IA autónoma.
    *   Modal de ayuda integrado (`❓ Ayuda`) con guía completa de reglas.

### Cómo ejecutarlo:
1. Abre `index.html` directamente en tu navegador favorito o sírvelo localmente (ej: `npx serve .` o Live Server).
2. Para desplegarlo en la web automáticamente, activa **GitHub Pages** en la configuración del repositorio (`Settings > Pages > Deploy from branch: master / root`).

---

## 🛠️ Estado del Proyecto
- [x] Diseño de los 4 Clanes y Círculo de Ventajas.
- [x] Listado completo de las 80 cartas del Set Base.
- [x] Auditoría de Balance (Stats vs Costo).
- [x] Exportación de las 80 cartas finales en alta resolución + 3 reversos.
- [x] Presentación Web Interactiva con diseño Apple y modo Day/Night.
- [x] Catálogo Digital interactivo de 80 cartas con simulador de sobres.
- [x] Simulador de Batallas interactivo 1v1 estilo Marvel Snap + Pokémon Pocket.
- [ ] Producción de Cartas Físicas.

---

## 📏 Especificaciones Técnicas (Standard TCG)
Para mantener la compatibilidad con el mercado internacional (basado en estándares de Lorcana/Magic):
*   **Tamaño Físico:** 63.5 x 88.9 mm (2.5" x 3.5").
*   **Resolución Digital:** 750 x 1050 px (Mínimo 300 DPI).
*   **Aspect Ratio:** 1 : 1.4.

---
*Desarrollado con ❤️ para la comunidad de Cometa Champions.*
