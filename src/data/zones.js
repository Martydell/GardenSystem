export const GREENHOUSE_ZONES=[
  {id:'back',   label:'Back Staging',   col:'rgba(161,107,59,0.15)', border:'#a16b3b',x:0,y:0,w:7,h:1},
  {id:'lseat',  label:'Left Staging',   col:'rgba(74,124,63,0.18)',  border:'#4a7c3f',x:0,y:1,w:2,h:4},
  {id:'path',   label:'Central Path',   col:'rgba(107,114,128,0.09)',border:'#9ca3af',x:2,y:1,w:3,h:7},
  {id:'hydro',  label:'NFT Channels',   col:'rgba(59,130,246,0.15)', border:'#3b82f6',x:5,y:1,w:2,h:4},
  {id:'lbed',   label:'Left Ground Bed',col:'rgba(74,124,63,0.12)',  border:'#4a7c3f',x:0,y:5,w:2,h:3},
  {id:'rbench', label:'Right Bench',    col:'rgba(217,119,6,0.12)',  border:'#d97706',x:5,y:5,w:2,h:3},
  {id:'entry',  label:'Entrance',       col:'rgba(139,92,246,0.1)',  border:'#8b5cf6',x:0,y:8,w:7,h:1},
];

export const GREENHOUSE_DEFAULT={
  "0,0":"h12","1,0":"h11","2,0":"h13","4,0":"h05",
  "0,1":"h10","1,1":"h06",
  "0,2":"h07","1,2":"h03",
  "0,3":"h04",
  "0,4":"h01",
  "5,1":"h09","6,1":"h08",
  "0,5":"h02",
};

export const COURTYARD_ZONES=[
  {id:'pond',       label:'Pond',                          col:'rgba(20,120,184,0.28)', border:'#1478b8',x:0, y:0,w:2, h:2},
  {id:'plantbed',   label:'Plant Bed',                     col:'rgba(74,124,63,0.18)',  border:'#4a7c3f',x:2, y:0,w:5, h:2},
  {id:'lemon',      label:'Lemon Tree',                    col:'rgba(234,179,8,0.18)',  border:'#eab308',x:7, y:0,w:2, h:2},
  {id:'stairs',     label:'Spiral Staircase',              col:'rgba(139,92,246,0.25)', border:'#8b5cf6',x:9, y:0,w:5, h:2},
  {id:'pondedge',   label:'Pond Edge (Back Garden Side)',  col:'rgba(20,184,166,0.15)', border:'#14b8a6',x:0, y:2,w:2, h:3},
  {id:'gate',       label:'Door to Back Garden',           col:'rgba(20,184,166,0.28)', border:'#14b8a6',x:0, y:5,w:2, h:2},
  {id:'border',     label:'Border Path (Back Garden Side)',col:'rgba(74,124,63,0.18)',  border:'#4a7c3f',x:0, y:7,w:8, h:1},
  {id:'steps',      label:'Steps',                         col:'rgba(139,92,246,0.2)',  border:'#8b5cf6',x:8, y:7,w:2, h:1},
  {id:'seating',    label:'Sitting Area',                  col:'rgba(217,119,6,0.25)',  border:'#d97706',x:10,y:6,w:4, h:2},
  {id:'patio',      label:'Patio',                         col:'rgba(107,114,128,0.12)',border:'#9ca3af',x:0, y:0,w:14,h:8},
];

export const COURTYARD_DEFAULT={
  "2,0":"33","3,0":"43","4,0":"30","5,0":"72","6,0":"69",
  "2,1":"36","3,1":"3","4,1":"34","5,1":"62","6,1":"71",
  "7,0":"50",
  "9,0":"67","10,0":"57,39","11,0":"65","12,0":"66",
  "10,1":"49","11,1":"63",
  "0,2":"9","0,4":"54",
  "0,7":"58","1,7":"34","2,7":"70,25","3,7":"59","4,7":"33,60","5,7":"61","6,7":"68","7,7":"9",
  "10,7":"25","11,7":"3","12,7":"30","13,7":"43","13,6":"44",
};

export const COURTYARD_TEXT={
  "10,6":"Bench","11,6":"Chairs","12,6":"Table",
};

export const INDOOR_ZONES=[
  // Living room — large main space with floor plants around the sofa
  {id:'living',   label:'Living Room',           col:'rgba(59,130,246,0.10)', border:'#3b82f6',x:0, y:0,w:10,h:5},
  // Patio door side — large monstera + floor plants near the sliding doors to courtyard
  {id:'patio',    label:'Patio Door Side',        col:'rgba(139,92,246,0.12)',border:'#8b5cf6',x:0, y:5,w:5, h:5},
  // Living room window sill — long front window with hanging Tradescantia, ZZ plant, orchids
  {id:'window',   label:'Window Sill & Hanging', col:'rgba(16,185,129,0.15)', border:'#10b981',x:5, y:5,w:5, h:2},
  // Black bookcase / TV wall — bookcase with terrarium, plants on shelves, near TV
  {id:'bookcase', label:'Bookcase & TV Wall',    col:'rgba(107,114,128,0.15)',border:'#6b7280',x:5, y:7,w:5, h:3},
  // Kitchen — L-shaped with sink, washing machine, marble counter
  {id:'kitchen',  label:'Kitchen',               col:'rgba(234,179,8,0.12)', border:'#eab308',x:10,y:0,w:6, h:3},
  // Kitchen bar / partition counter top — half-wall with Peace Lily, Anthurium, ZZ Plant on top
  {id:'bar',      label:'Kitchen Bar Top',        col:'rgba(161,107,59,0.18)',border:'#a16b3b',x:10,y:3,w:6, h:2},
  // Kitchen window sill — window with orchid visible above the sink
  {id:'kwindow',  label:'Kitchen Window Sill',   col:'rgba(16,185,129,0.12)', border:'#10b981',x:10,y:5,w:6, h:3},
  // Hallway — connecting area between rooms
  {id:'hall',     label:'Hallway',               col:'rgba(236,72,153,0.12)', border:'#ec4899',x:10,y:8,w:6, h:2},
];
