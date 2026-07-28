// Motor físico del Principio de Arquímedes. Funciones puras: reciben
// estado, devuelven estado nuevo. Sin referencias a Phaser ni al DOM,
// así se pueden probar de forma aislada.
//
// Idea central: como la masa del sistema (persona + perro + estructura
// de la barca) es fija, el volumen que necesita quedar sumergido para
// que empuje = peso también es fijo. Lo único que cambia con el slider
// es qué fracción del volumen TOTAL de la barca representa ese volumen
// sumergido — eso es el % de inmersión.
(function () {
const { PHYSICS, STATUS } = window.Arq;

const TOTAL_MASS =
  PHYSICS.MASS_PERSON + PHYSICS.MASS_DOG + PHYSICS.MASS_BOAT_STRUCTURE;

const TOTAL_WEIGHT = TOTAL_MASS * PHYSICS.GRAVITY;

// Volumen de agua que hace falta desplazar para sostener el peso total.
// Es constante: no depende del volumen de la barca.
const REQUIRED_SUBMERGED_VOLUME = TOTAL_MASS / PHYSICS.WATER_DENSITY;

/**
 * Calcula el estado físico completo del sistema para un volumen de
 * barca dado.
 * @param {number} boatVolume - m³, volumen actual de la barca (slider).
 * @returns {object} snapshot con todas las magnitudes + estado.
 */
function computeEquilibrium(boatVolume) {
  const floats = boatVolume >= REQUIRED_SUBMERGED_VOLUME;

  // Mientras flota, el volumen desplazado es exactamente el necesario
  // para el equilibrio. Si no alcanza a flotar, el máximo que puede
  // desplazar es su propio volumen total (barca completamente sumergida).
  const displacedVolume = floats
    ? REQUIRED_SUBMERGED_VOLUME
    : boatVolume;

  const buoyantForce = PHYSICS.WATER_DENSITY * PHYSICS.GRAVITY * displacedVolume;

  const immersionRatio = floats
    ? REQUIRED_SUBMERGED_VOLUME / boatVolume
    : 1; // total o más: no hay margen, se está hundiendo

  const averageDensity = TOTAL_MASS / boatVolume; // kg/m³
  const marginVolume = boatVolume - REQUIRED_SUBMERGED_VOLUME; // m³ de margen

  let status = STATUS.FLOATING;
  if (!floats) {
    status = STATUS.SINKING;
  } else if (immersionRatio >= PHYSICS.WARNING_IMMERSION_RATIO) {
    status = STATUS.WARNING;
  }

  return {
    boatVolume,
    totalMass: TOTAL_MASS,
    totalWeight: TOTAL_WEIGHT,
    displacedVolume,
    buoyantForce,
    immersionRatio: Math.min(immersionRatio, 1),
    averageDensity,
    waterDensity: PHYSICS.WATER_DENSITY,
    marginVolume,
    floats,
    status,
  };
}

function getRequiredSubmergedVolume() {
  return REQUIRED_SUBMERGED_VOLUME;
}

function getTotalMass() {
  return TOTAL_MASS;
}

window.Arq.Physics = { computeEquilibrium, getRequiredSubmergedVolume, getTotalMass };
})();
