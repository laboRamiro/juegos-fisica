// Constantes físicas y de render. Único lugar para ajustar el "tuning"
// de la simulación sin tocar lógica.
//
// Script clásico (no ES module) a propósito: así el juego se puede abrir
// con doble clic sobre index.html (file://) sin bloqueos de CORS. Los
// valores se cuelgan de window.Arq para que el resto de los archivos
// los usen sin import/export.
(function () {

const PHYSICS = {
  GRAVITY: 9.8,              // m/s²
  WATER_DENSITY: 1000,       // kg/m³

  MASS_PERSON: 70,           // kg
  MASS_DOG: 25,              // kg
  MASS_BOAT_STRUCTURE: 80,   // kg (casco de madera, fijo — el jugador no lo cambia)

  VOLUME_MIN: 0.05,          // m³ (50 L)
  VOLUME_MAX: 0.6,           // m³ (600 L)
  VOLUME_DEFAULT: 0.35,      // m³ — arranca flotando cómoda
  VOLUME_REFERENCE: 0.35,    // m³ — volumen al que el render usa escala 1:1

  // Umbral de inmersión a partir del cual se muestra alerta amarilla
  // antes de llegar al 100% (punto crítico real).
  WARNING_IMMERSION_RATIO: 0.85,
};

const RENDER = {
  WIDTH: 960,
  HEIGHT: 600,

  WATER_SURFACE_Y: 380,      // línea de agua fija en pantalla (px)
  RIVER_TOP_Y: 340,          // dónde empieza visualmente el río (para reflejos/orillas)

  BOAT_X: 480,                // centro horizontal fijo de la barca
  BOAT_REF_WIDTH: 220,         // px, ancho del casco a VOLUME_REFERENCE
  BOAT_REF_HEIGHT: 70,          // px, alto del casco a VOLUME_REFERENCE

  VOLUME_TWEEN_MS: 450,          // suavizado al mover el slider
  SINK_DURATION_MS: 3800,         // duración de la animación de hundimiento
  RESET_DELAY_MS: 2200,            // espera tras hundirse antes de ofrecer reset
};

const COLORS = {
  SKY_TOP: 0x9fe0d8,
  SKY_BOTTOM: 0xdff4e0,
  WATER: 0x2f7f9e,
  WATER_DEEP: 0x1a4d6d,
  WATER_HIGHLIGHT: 0x8fd7e8,
  HULL_WOOD: 0x8a5a34,
  HULL_WOOD_DARK: 0x6b431f,
  FOLIAGE_DARK: 0x1f5c3a,
  FOLIAGE_MID: 0x2f7a4a,
  FOLIAGE_LIGHT: 0x4fa860,
  TRUNK: 0x5b3a22,
  SKIN: 0xdba876,
  SHIRT: 0xd1495b,
  DOG_FUR: 0xc98b4a,
  MONKEY_FUR: 0x7a5233,
  SHORE: 0x4a7a3a,       // orilla / pasto de la ribera
  MUD: 0x8a6a3f,         // franja marrón de transición entre pasto y agua
  MUD_WET: 0x5f4527,     // borde húmedo, justo contra el agua
  ROOT: 0x4a2e18,
  HAT: 0xdba955,
  HAT_BAND: 0x8a5a2a,
};

const STATUS = {
  FLOATING: 'floating',
  WARNING: 'warning',
  SINKING: 'sinking',
  SUNK: 'sunk',
};

Object.assign(window.Arq, { PHYSICS, RENDER, COLORS, STATUS });
})();
