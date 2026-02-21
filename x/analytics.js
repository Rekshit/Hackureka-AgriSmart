/* ---------- PROFIT CHART ---------- */

try {
  new Chart(document.getElementById("profitChart"),{
  type:'bar',
  data:{
  labels:["Wheat","Rice","Mustard","Tomato","Corn"],
  datasets:[
  {
  label:"Revenue",
  data:[85000,72000,55000,95000,48000],
  backgroundColor:"#2e7d32"
  },
  {
  label:"Cost",
  data:[45000,38000,22000,60000,28000],
  backgroundColor:"#a5d6a7"
  },
  {
  label:"Profit",
  data:[40000,34000,33000,35000,20000],
  backgroundColor:"#fbc02d"
  }
  ]
  },
  options:{
  responsive:true,
  plugins:{legend:{position:'top'}}
  }
  })
} catch(e) {
  console.error('Error initializing profit chart:', e)
}


/* ---------- YIELD TREND ---------- */

try {
  new Chart(document.getElementById("yieldChart"),{
  type:'line',
  data:{
  labels:["2021","2022","2023","2024","2025"],
  datasets:[
  {
  label:"Wheat",
  data:[42,45,48,52,55],
  borderColor:"green",
  tension:.3
  },
  {
  label:"Rice",
  data:[38,40,36,43,45],
  borderColor:"orange",
  tension:.3
  },
  {
  label:"Mustard",
  data:[18,20,22,25,28],
  borderColor:"#8bc34a",
  tension:.3
  }
  ]
  }
  })
} catch(e) {
  console.error('Error initializing yield chart:', e)
}


/* ---------- RESOURCE USAGE ---------- */

try {
  new Chart(document.getElementById("resourceChart"),{
  type:'line',
  data:{
  labels:["Jan","Feb","Mar","Apr","May","Jun"],
  datasets:[
  {
  label:"Water (L)",
  data:[120,150,200,180,220,250],
  borderColor:"green",
  fill:true
  },
  {
  label:"Fertilizer (kg)",
  data:[200,230,310,280,320,360],
  borderColor:"orange",
  fill:true
  },
  {
  label:"Pesticide (ml)",
  data:[240,260,350,330,370,420],
  borderColor:"red",
  fill:true
  }
  ]
  }
  })
} catch(e) {
  console.error('Error initializing resource chart:', e)
}