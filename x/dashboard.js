// ensure user
try {
  const user = ensureAuth()
  document.getElementById('heroTitle').textContent = `Good morning, ${user.name.split(' ')[0]}!`
} catch(e) {
  console.error('User not authenticated:', e)
  location.href='auth.html'
}

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
let demo = {}
try {
  demo = JSON.parse(localStorage.getItem('agri_demo'))
} catch(e) {
  console.error('Error parsing demo data:', e)
}

// fill kpis
try {
  document.getElementById('kCrops').textContent = 12
  document.getElementById('kPred').textContent = 8
  document.getElementById('kBook').textContent = demo.bookings ? demo.bookings.length : 0
} catch(e) {
  console.error('Error filling KPIs:', e)
}

// load weather (mock)
function refreshWeather(){
  try {
    const weatherBox = document.getElementById('weatherBox')
    if(weatherBox) weatherBox.innerHTML = '<strong>28°C</strong> • Humidity 65% • Partly cloudy'
  } catch(e) {
    console.error('Error loading weather:', e)
  }
}
refreshWeather()

// activity
function renderActivity(){
  try {
    const act = demo.activity || []
    const ul = document.getElementById('activityList')
    if(!ul) return
    ul.innerHTML = ''
    act.forEach(a=>{
      const li = document.createElement('li')
      li.innerHTML = `<div><strong>${a.t || 'Activity'}</strong><div class="muted">${new Date(a.ts).toLocaleString()}</div></div>`
      ul.appendChild(li)
    })
  } catch(e) {
    console.error('Error rendering activity:', e)
  }
}
renderActivity()

// Price chart
try {
  const priceCtx = document.getElementById('priceChart')
  if(priceCtx) {
    const priceChart = new Chart(priceCtx, {
      type:'line',
      data:{
        labels:['Jan','Feb','Mar','Apr','May','Jun'],
        datasets:[{label:'Wheat ₹/qtl', data:demo.prices?.wheat || [2000, 2100, 2200, 2150, 2300, 2400], borderColor:'#2e7d32', backgroundColor:'rgba(46,125,50,0.08)', tension:0.3}]
      },
      options:{plugins:{legend:{display:false}}}
    })
  }
} catch(e) {
  console.error('Error initializing price chart:', e)
}

// Map (Leaflet)
try {
  const mapElement = document.getElementById('map')
  if(mapElement && window.L) {
    const map = L.map('map',{center:[26.9,75.8],zoom:9})
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:''}).addTo(map)
    (demo.fields || []).forEach(f=>{
      const m = L.marker([f.lat,f.lon]).addTo(map).bindPopup(`<strong>${f.name}</strong><br>Crop: ${f.crop}<br><button onclick="zoomTo(${f.lat},${f.lon})">Zoom</button>`)
    })
    window.zoomTo = (lat,lon)=> map.setView([lat,lon],13)
  }
} catch(e) {
  console.error('Error initializing map:', e)
}

// simple AI suggestions
function generateAdvice(){
  try {
    const opts = [
      'Irrigate Field A tomorrow morning (2 hours).',
      'Apply phosphorus fertilizer in Field B within 3 days.',
      'Hold sale: wheat prices expected to rise in 7–10 days.'
    ]
    const pick = opts[Math.floor(Math.random()*opts.length)]
    const aiAdvice = document.getElementById('aiAdvice')
    if(aiAdvice) aiAdvice.textContent = pick
    demo.activity = demo.activity || []
    demo.activity.unshift({t:'AI: '+pick, ts:Date.now()})
    localStorage.setItem('agri_demo', JSON.stringify(demo))
    renderActivity()
  } catch(e) {
    console.error('Error generating advice:', e)
  }
}

function saveAdvice(){ 
  try {
    toast('Advice saved locally')
  } catch(e) {
    console.error('Error saving advice:', e)
  }
}

generateAdvice()

// small utilities
function genTimeSeries(n,base,amp){
  return Array.from({length:n}, (_,i)=> Math.round(base + Math.sin(i/2)*amp + (Math.random()-0.5)*amp/1.5))
}

function navigateTo(url){ 
  try {
    location.href = url
  } catch(e) {
    console.error('Navigation error:', e)
  }
}
