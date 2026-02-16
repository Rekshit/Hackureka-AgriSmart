// ensure user
const user = ensureAuth()
document.getElementById('heroTitle').textContent = `Good morning, ${user.name.split(' ')[0]}!`

// --- mock initial data if absent ---
if(!localStorage.getItem('agri_demo')){
  const demo = {
    prices: { wheat: genTimeSeries(6,2200,220) },
    activity: [
      {t:'Wheat price prediction completed', ts:Date.now()-3600*1000},
      {t:'Tractor booked (Mar 3-5)', ts:Date.now()-24*3600*1000}
    ],
    alerts: [
      {id:1,sev:'med',title:'Pest risk: Aphids',text:'Check tomato field B',ts:Date.now()-3600*2000}
    ],
    bookings: [{id:1, item:'Tractor 5050', date:'2026-03-03', status:'upcoming'}],
    fields: [
      {id:1,name:'Field A',lat:26.95,lon:75.9,crop:'Wheat'},
      {id:2,name:'Field B',lat:26.86,lon:75.7,crop:'Tomato'}
    ]
  }
  localStorage.setItem('agri_demo', JSON.stringify(demo))
}
const demo = JSON.parse(localStorage.getItem('agri_demo'))

// fill kpis
document.getElementById('kCrops').textContent = 12
document.getElementById('kPred').textContent = 8
document.getElementById('kBook').textContent = demo.bookings.length

// load weather (mock)
function refreshWeather(){
  document.getElementById('weatherBox').innerHTML = '<strong>28°C</strong> • Humidity 65% • Partly cloudy'
}
refreshWeather()

// activity
function renderActivity(){
  const act = demo.activity || []
  const ul = document.getElementById('activityList'); ul.innerHTML = ''
  act.forEach(a=>{
    const li = document.createElement('li')
    li.innerHTML = `<div><strong>${a.t}</strong><div class="muted">${new Date(a.ts).toLocaleString()}</div></div>`
    ul.appendChild(li)
  })
}
renderActivity()

// Price chart
const priceCtx = document.getElementById('priceChart')
const priceChart = new Chart(priceCtx, {
  type:'line',
  data:{
    labels:['Jan','Feb','Mar','Apr','May','Jun'],
    datasets:[{label:'Wheat ₹/qtl', data:demo.prices.wheat, borderColor:'#2e7d32', backgroundColor:'rgba(46,125,50,0.08)', tension:0.3}]
  },
  options:{plugins:{legend:{display:false}}}
})

// Map (Leaflet)
const map = L.map('map',{center:[26.9,75.8],zoom:9})
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:''}).addTo(map)
demo.fields.forEach(f=>{
  const m = L.marker([f.lat,f.lon]).addTo(map).bindPopup(`<strong>${f.name}</strong><br>Crop: ${f.crop}<br><button onclick="zoomTo(${f.lat},${f.lon})">Zoom</button>`)
})
window.zoomTo = (lat,lon)=> map.setView([lat,lon],13)

// simple AI suggestions
function generateAdvice(){
  const opts = [
    'Irrigate Field A tomorrow morning (2 hours).',
    'Apply phosphorus fertilizer in Field B within 3 days.',
    'Hold sale: wheat prices expected to rise in 7–10 days.'
  ]
  const pick = opts[Math.floor(Math.random()*opts.length)]
  document.getElementById('aiAdvice').textContent = pick
  demo.activity.unshift({t:'AI: '+pick, ts:Date.now()})
  localStorage.setItem('agri_demo', JSON.stringify(demo))
  renderActivity()
}
function saveAdvice(){ toast('Advice saved locally') }
generateAdvice()

// small utilities
function genTimeSeries(n,base,amp){
  return Array.from({length:n}, (_,i)=> Math.round(base + Math.sin(i/2)*amp + (Math.random()-0.5)*amp/1.5))
}
function navigateTo(url){ location.href = url }
