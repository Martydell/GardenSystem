// Ground-surface textures for the garden map grid — pure CSS gradients (no image
// assets), applied per-cell so each zone reflects its real material (paving, bark
// mulch, decking, water, soil, lawn, gravel, indoor flooring) instead of one flat
// colour. Deliberately theme-independent: a stone patio is the same stone colour
// in light or dark mode, the way terrain stays put on a map regardless of app theme.
export const SURFACES = {
  tile: {
    backgroundColor: '#c7bfae',
    backgroundImage:
      'linear-gradient(rgba(90,82,64,0.35) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(90,82,64,0.35) 1px, transparent 1px),' +
      'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(0,0,0,0.06))',
    backgroundSize: '50% 50%, 50% 50%, 100% 100%',
  },
  bark: {
    backgroundColor: '#5b4530',
    backgroundImage:
      'radial-gradient(ellipse 9px 5px at 18% 25%, rgba(96,73,46,0.9), transparent 70%),' +
      'radial-gradient(ellipse 7px 4px at 68% 55%, rgba(70,52,32,0.9), transparent 70%),' +
      'radial-gradient(ellipse 8px 5px at 40% 80%, rgba(112,86,54,0.9), transparent 70%),' +
      'radial-gradient(ellipse 6px 4px at 85% 20%, rgba(80,60,38,0.9), transparent 70%),' +
      'radial-gradient(ellipse 7px 4px at 10% 70%, rgba(100,76,48,0.9), transparent 70%)',
  },
  water: {
    backgroundColor: '#2f6f8f',
    backgroundImage:
      'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, transparent 35%, rgba(255,255,255,0.12) 55%, transparent 80%),' +
      'linear-gradient(0deg, rgba(15,55,75,0.35), transparent 60%)',
  },
  grass: {
    backgroundColor: '#3f6b34',
    backgroundImage:
      'repeating-linear-gradient(112deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 7px),' +
      'linear-gradient(0deg, rgba(0,0,0,0.12), transparent 50%)',
  },
  decking: {
    backgroundColor: '#8a6338',
    backgroundImage:
      'repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 20%),' +
      'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 40%)',
  },
  soil: {
    backgroundColor: '#4a3626',
    backgroundImage:
      'radial-gradient(rgba(0,0,0,0.3) 1px, transparent 1.5px),' +
      'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1.5px)',
    backgroundSize: '9px 9px, 13px 13px',
    backgroundPosition: '0 0, 4px 6px',
  },
  gravel: {
    backgroundColor: '#a8a196',
    backgroundImage:
      'radial-gradient(rgba(70,66,58,0.4) 1px, transparent 1.5px),' +
      'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1.5px)',
    backgroundSize: '7px 7px, 6px 6px',
    backgroundPosition: '0 0, 3px 3px',
  },
  indoor: {
    backgroundColor: '#cfc6b4',
    backgroundImage:
      'repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 22%),' +
      'linear-gradient(180deg, rgba(255,255,255,0.15), transparent 50%)',
  },
};

export function surfaceStyle(key){
  return SURFACES[key]||SURFACES.tile;
}
