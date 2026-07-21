import type { ServiceRoute } from './routes';
import type { StructureType, EstimateInput } from './pricing';

// Shared per-service metadata used by the service pages AND the local (service × city) pages.
// Keeping these here keeps price/serviceType/lead-carousel consistent across both templates.

// Route -> estimator structure type (for basePerSqft lookup).
export const SVC_STRUCT: Record<ServiceRoute, StructureType> = {
  'aluminum-pergolas': 'pergola',
  'pool-enclosure': 'pool-enclosure',
  'patio-screens': 'screen-room',
  'louvered-roof-system': 'louvered',
};

// A representative install per service, priced by the SAME engine the estimator uses
// (src/lib/pricing.ts) so page copy and the calculator never disagree.
export const TYPICAL: Record<ServiceRoute, EstimateInput> = {
  'aluminum-pergolas': { structure: 'pergola', sqft: 200, attachment: 'attached', roofType: 'solid-insulated', material: 'white', addOns: [] },
  'pool-enclosure': { structure: 'pool-enclosure', sqft: 450, cageStyle: 'flat', height: 'single', mesh: 'standard', material: 'white', addOns: [] },
  'patio-screens': { structure: 'screen-room', sqft: 200, attachment: 'attached', subtype: 'under-existing', mesh: 'standard', material: 'white', addOns: [] },
  'louvered-roof-system': { structure: 'louvered', sqft: 200, attachment: 'attached', operation: 'motorized', material: 'white', addOns: [] },
};

// schema.org Service.serviceType per service (bilingual).
export const SVC_SERVICE_TYPE: Record<ServiceRoute, { en: string; es: string }> = {
  'aluminum-pergolas': { en: 'Aluminum pergola installation', es: 'Instalación de pérgolas de aluminio' },
  'pool-enclosure': { en: 'Pool screen enclosure installation', es: 'Instalación de cerramientos de piscina' },
  'patio-screens': { en: 'Patio screen room installation', es: 'Instalación de porches con malla' },
  'louvered-roof-system': { en: 'Motorized louvered pergola installation', es: 'Instalación de pérgolas de lamas motorizadas' },
};

// Route -> LeadSection carousel filter key.
export const LEAD_SERVICE: Record<ServiceRoute, 'pergola' | 'pool' | 'screen' | 'louvered'> = {
  'aluminum-pergolas': 'pergola',
  'pool-enclosure': 'pool',
  'patio-screens': 'screen',
  'louvered-roof-system': 'louvered',
};
