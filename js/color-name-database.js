// Crayola 64-color crayon palette; sRGB values are standard digital equivalents.
export const CRAYOLA_COLOR_DATABASE = [
  ['Black','#000000'],['Blue','#1f75fe'],['Blue Green','#0d98ba'],['Blue Violet','#7366bd'],['Brick Red','#b6321c'],['Brown','#b4674d'],['Burnt Orange','#ff7f49'],['Cadet Blue','#5f9ea0'],['Carnation Pink','#ffa6c9'],['Cerulean','#1dacd6'],['Chestnut','#b94e48'],['Copper','#dd9475'],['Cornflower','#9aceeb'],['Dandelion','#fddb6d'],['Denim','#2b6cc4'],['Forest Green','#1cac78'],['Fuchsia','#c364c5'],['Gold','#e7c697'],['Goldenrod','#fcd975'],['Gray','#95918c'],['Green','#1cac78'],['Green Blue','#2887c8'],['Green Yellow','#f0e891'],['Inchworm','#b2ec5d'],['Indigo','#5d76cb'],['Jungle Green','#3bb08f'],['Lavender','#fcb4d5'],['Mahogany','#cd4a4c'],['Manatee','#979aaa'],['Maroon','#c8385a'],['Mauvelous','#ef98aa'],['Melon','#fdbcb4'],['Midnight Blue','#1a4876'],['Mountain Meadow','#30ba8f'],['Navy Blue','#1974d2'],['Olive Green','#bab86c'],['Orange','#ff7538'],['Orange Red','#ff5349'],['Orange Yellow','#f8d568'],['Orchid','#e6a8d7'],['Outer Space','#414a4c'],['Peach','#ffcfab'],['Periwinkle','#c5d0e6'],['Piggy Pink','#fdd7e4'],['Pine Green','#158078'],['Plum','#8e4585'],['Purple Heart','#7442c8'],['Purple Mountains Majesty','#9d81ba'],['Raw Sienna','#d68a59'],['Red','#ee204d'],['Red Orange','#ff5349'],['Red Violet','#c0448f'],['Robin Egg Blue','#1fcecb'],['Salmon','#ff9baa'],['Scarlet','#fc2847'],['Sea Green','#9fe2bf'],['Sepia','#a5694f'],['Shadow','#8a795d'],['Silver','#cdc5c2'],['Sky Blue','#80daeb'],['Spring Green','#eceabe'],['Tan','#faa76c'],['Teal Blue','#18a7b5'],['Thistle','#ebc7df'],['Timberwolf','#dbd7d2'],['Tropical Rain Forest','#17806d'],['Tumbleweed','#deaa88'],['Violet','#926eae'],['Violet Red','#f75394'],['White','#ffffff'],['Wild Blue Yonder','#a2add0'],['Wild Strawberry','#ff43a4'],['Yellow','#fce883'],['Yellow Green','#c5e384'],['Yellow Orange','#ffae42']
].map(([name, hex]) => ({ name, hex }));

function rgb(hex) { return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]; }
function distance(a,b) { const [ar,ag,ab]=a; const [br,bg,bb]=b; const mean=(ar+br)/2; return Math.sqrt((2+mean/256)*(ar-br)**2+4*(ag-bg)**2+(2+(255-mean)/256)*(ab-bb)**2); }

export function findClosestColorName(hex) {
  const target = rgb(hex);
  return CRAYOLA_COLOR_DATABASE.reduce((best, color) => {
    const value = distance(target, rgb(color.hex));
    return value < best.distance ? { ...color, distance: value } : best;
  }, { name: 'Black', hex: '#000000', distance: Infinity });
}
