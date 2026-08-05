import { COURTYARD_DEFAULT, COURTYARD_TEXT, COURTYARD_ZONES, GREENHOUSE_DEFAULT, GREENHOUSE_ZONES, HYDROSTART_DEFAULT, INDOOR_ZONES } from './zones.js';

export const AREAS = [
  {key:'indoor',     label:'Indoor',             icon:'&#x1F3E0;', cols:16,rows:10,size:64, zones:INDOOR_ZONES,     defaultFilter:'indoor'},
  {key:'courtyard',  label:'Courtyard',          icon:'&#x2600;&#xFE0F;', cols:14,rows:8, size:76, zones:COURTYARD_ZONES,  defaultPos:COURTYARD_DEFAULT, defaultText:COURTYARD_TEXT, defaultFilter:'outdoor'},
  {key:'garden',     label:'Back Garden',        icon:'&#x1F333;', cols:14,rows:9, size:76, zones:null,             defaultFilter:'outdoor'},
  {key:'greenhouse', label:'Greenhouse',         icon:'&#x1F9EA;', cols:7, rows:9, size:86, zones:GREENHOUSE_ZONES, defaultPos:GREENHOUSE_DEFAULT, defaultFilter:'hydro'},
  {key:'herbgarden', label:'Herb Garden',        icon:'&#x1F33F;', cols:8, rows:5, size:72, zones:null,             defaultFilter:'produce'},
  {key:'hydrostart', label:'Hydroponics Starter',icon:'&#x1F331;', cols:6, rows:4, size:72, zones:null,             defaultPos:HYDROSTART_DEFAULT, defaultFilter:'hydro'},
  {key:'hydro',      label:'Hydroponics',        icon:'&#x1F4A7;', cols:8, rows:6, size:76, zones:null,             defaultFilter:'hydro'},
];

export function getArea(key){ return AREAS.find(a=>a.key===key) || AREAS[0]; }
