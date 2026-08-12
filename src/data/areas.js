import { COURTYARD_DEFAULT, COURTYARD_DEFAULT_OBJECTS, COURTYARD_TEXT, COURTYARD_ZONES, GREENHOUSE_DEFAULT, GREENHOUSE_ZONES, HERBGARDEN_DEFAULT, HYDROSTART_DEFAULT, INDOOR_ZONES, TERRACE_DEFAULT } from './zones.js';

// Top-level physical groups
export const GROUPS = [
  {key:'indoor',     label:'Indoor',      icon:'&#x1F3E0;'},
  {key:'outdoor',    label:'Outdoor',     icon:'&#x1F333;'},
  {key:'greenhouse', label:'Green House', icon:'&#x1F9EA;'},
];

// Leaf zones — each has a real map (storage key `${key}-map`) and belongs to one group
export const AREAS = [
  {key:'hydrostart',    group:'indoor',     label:'Hydroponics Starter Kit',icon:'&#x1F331;', cols:6, rows:4, size:72, zones:null,        defaultPos:HYDROSTART_DEFAULT, defaultFilter:'hydro', defaultSurface:'indoor'},
  {key:'terrarium',     group:'indoor',     label:'Terrarium',          icon:'&#x1FAB4;', cols:6, rows:4, size:72, zones:null,             defaultFilter:'indoor', defaultSurface:'soil'},
  {key:'indoor',        group:'indoor',     label:'Indoor Plants',      icon:'&#x1F3E0;', cols:16,rows:10,size:64, zones:INDOOR_ZONES,     defaultFilter:'indoor', defaultSurface:'indoor'},

  {key:'terrace',       group:'outdoor',    label:'Terrace',            icon:'&#x1FAB4;', cols:10,rows:6, size:72, zones:null,             defaultPos:TERRACE_DEFAULT, defaultFilter:'outdoor', defaultSurface:'decking'},
  {key:'courtyard',     group:'outdoor',    label:'Courtyard',          icon:'&#x2600;&#xFE0F;', cols:14,rows:8, size:76, zones:COURTYARD_ZONES, defaultPos:COURTYARD_DEFAULT, defaultText:COURTYARD_TEXT, defaultObjects:COURTYARD_DEFAULT_OBJECTS, defaultFilter:'outdoor', defaultSurface:'tile'},
  {key:'pond',          group:'outdoor',    label:'Pond',               icon:'&#x1F4A7;', cols:8, rows:5, size:72, zones:null,             defaultFilter:'outdoor', defaultSurface:'water'},
  {key:'herbgarden',    group:'outdoor',    label:'Vegetable Bed',      icon:'&#x1F33F;', cols:8, rows:5, size:72, zones:null,             defaultPos:HERBGARDEN_DEFAULT, defaultFilter:'produce', defaultSurface:'soil'},
  {key:'garden',        group:'outdoor',    label:'Backyard',           icon:'&#x1F333;', cols:14,rows:9, size:76, zones:null,             defaultFilter:'outdoor', defaultSurface:'grass'},

  {key:'hydro',         group:'greenhouse', label:'Hydroponics',        icon:'&#x1F4A7;', cols:8, rows:6, size:76, zones:null,             defaultFilter:'hydro', defaultSurface:'indoor'},
  {key:'greenhouse',    group:'greenhouse', label:'Green House Bed',    icon:'&#x1F9EA;', cols:7, rows:9, size:86, zones:GREENHOUSE_ZONES, defaultPos:GREENHOUSE_DEFAULT, defaultFilter:'hydro', defaultSurface:'tile'},
];

export function getArea(key){ return AREAS.find(a=>a.key===key) || AREAS[0]; }
export function areasInGroup(groupKey){ return AREAS.filter(a=>a.group===groupKey); }

// Fallback zone for a plant's old outdoor/indoor/hydro/produce type, used when it hasn't
// been manually placed on any zone map yet — matches the pre-zone catalogue sections.
export const DEFAULT_ZONE_FOR_CATEGORY = {
  outdoor: 'garden',
  indoor:  'indoor',
  hydro:   'greenhouse',
  produce: 'herbgarden',
};
