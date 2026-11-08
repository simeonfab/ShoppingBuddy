import type { Grocery, Section, Store } from './types'

export const sections: Section[] = ['Produce', 'Bakery', 'Meat & fish', 'Dairy & eggs', 'Cupboard', 'Drinks', 'Household', 'Frozen', 'Unknown']

export const stores: Store[] = [
  { id:'tesco-hackney', chain:'Tesco', branch:'Hackney Morning Lane', postcode:'E9 6LH', status:'Example', confirmed:'Last confirmation unavailable', accuracy:96, route:['Produce','Bakery','Meat & fish','Dairy & eggs','Cupboard','Drinks','Household','Frozen','Unknown'] },
  { id:'aldi-dalston', chain:'Aldi', branch:'Dalston Junction', postcode:'E8 3DF', status:'Example', confirmed:'Last confirmation unavailable', accuracy:88, route:['Produce','Bakery','Cupboard','Drinks','Meat & fish','Dairy & eggs','Frozen','Household','Unknown'] },
  { id:'sains-islington', chain:"Sainsbury's", branch:'Islington Angel', postcode:'N1 9LQ', status:'Example', confirmed:'Last confirmation unavailable', accuracy:91, route:['Produce','Bakery','Drinks','Cupboard','Meat & fish','Dairy & eggs','Frozen','Household','Unknown'] },
  { id:'lidl-finsbury', chain:'Lidl', branch:'Finsbury Park', postcode:'N4 2DH', status:'Example', confirmed:'Last confirmation unavailable', accuracy:62, route:['Produce','Bakery','Cupboard','Drinks','Meat & fish','Dairy & eggs','Frozen','Household','Unknown'] },
  { id:'waitrose-kings', chain:'Waitrose', branch:"King's Cross", postcode:'N1C 4AP', status:'Example', confirmed:'Last confirmation unavailable', accuracy:58, route:['Produce','Bakery','Meat & fish','Cupboard','Drinks','Dairy & eggs','Household','Frozen','Unknown'] },
  { id:'asda-leyton', chain:'Asda', branch:'Leyton Mills', postcode:'E10 5NH', status:'Example', confirmed:'Last confirmation unavailable', accuracy:61, route:['Produce','Bakery','Meat & fish','Dairy & eggs','Cupboard','Drinks','Frozen','Household','Unknown'] },
  { id:'morrisons-stratford', chain:'Morrisons', branch:'Stratford', postcode:'E15 1XL', status:'Example', confirmed:'Last confirmation unavailable', accuracy:57, route:['Produce','Bakery','Meat & fish','Cupboard','Dairy & eggs','Drinks','Household','Frozen','Unknown'] },
  { id:'iceland-stoke', chain:'Iceland', branch:'Stoke Newington', postcode:'N16 7HF', status:'Example', confirmed:'Last confirmation unavailable', accuracy:55, route:['Drinks','Cupboard','Household','Dairy & eggs','Frozen','Produce','Bakery','Meat & fish','Unknown'] },
  { id:'coop-canonbury', chain:'Co-op', branch:'Canonbury', postcode:'N1 2BA', status:'Example', confirmed:'Last confirmation unavailable', accuracy:60, route:['Produce','Bakery','Drinks','Cupboard','Dairy & eggs','Frozen','Household','Meat & fish','Unknown'] },
  { id:'mands-holloway', chain:'M&S', branch:'Holloway Road', postcode:'N7 8JL', status:'Example', confirmed:'Last confirmation unavailable', accuracy:59, route:['Produce','Bakery','Meat & fish','Dairy & eggs','Cupboard','Drinks','Frozen','Household','Unknown'] },
]

export const catalogue: Omit<Grocery, 'id'|'quantity'|'unit'|'done'>[] = [
  {name:'Bananas',section:'Produce'}, {name:'Avocados',section:'Produce'}, {name:'Baby spinach',section:'Produce'}, {name:'Cherry tomatoes',section:'Produce'}, {name:'Apples',section:'Produce'}, {name:'Broccoli',section:'Produce'},
  {name:'Sourdough loaf',section:'Bakery'}, {name:'Bagels',section:'Bakery'}, {name:'Croissants',section:'Bakery'},
  {name:'Chicken breast',section:'Meat & fish'}, {name:'Salmon fillets',section:'Meat & fish'}, {name:'Tofu',section:'Meat & fish'},
  {name:'Oat milk',section:'Dairy & eggs'}, {name:'Whole milk',section:'Dairy & eggs'}, {name:'Greek yoghurt',section:'Dairy & eggs'}, {name:'Eggs',section:'Dairy & eggs'}, {name:'Cheddar',section:'Dairy & eggs'},
  {name:'Pasta',section:'Cupboard'}, {name:'Basmati rice',section:'Cupboard'}, {name:'Coconut milk',section:'Cupboard'}, {name:'Chopped tomatoes',section:'Cupboard'}, {name:'Olive oil',section:'Cupboard'}, {name:'Coffee',section:'Cupboard'}, {name:'Peanut butter',section:'Cupboard'},
  {name:'Sparkling water',section:'Drinks'}, {name:'Orange juice',section:'Drinks'},
  {name:'Kitchen roll',section:'Household'}, {name:'Washing-up liquid',section:'Household'}, {name:'Bin bags',section:'Household'},
  {name:'Frozen peas',section:'Frozen'}, {name:'Ice cream',section:'Frozen'}, {name:'Frozen berries',section:'Frozen'},
]

export const starterItems: Grocery[] = [
  {id:'i1',name:'Bananas',section:'Produce',quantity:6,unit:'',done:false,favourite:true},
  {id:'i2',name:'Sourdough loaf',section:'Bakery',quantity:1,unit:'loaf',done:false},
  {id:'i3',name:'Chicken breast',section:'Meat & fish',quantity:2,unit:'packs',note:'Free range',done:false},
  {id:'i4',name:'Oat milk',section:'Dairy & eggs',quantity:2,unit:'cartons',done:false,favourite:true},
  {id:'i5',name:'Coconut milk',section:'Cupboard',quantity:1,unit:'tin',done:false},
  {id:'i6',name:'Sparkling water',section:'Drinks',quantity:1,unit:'pack',done:false},
  {id:'i7',name:'Frozen peas',section:'Frozen',quantity:1,unit:'bag',done:false},
]
