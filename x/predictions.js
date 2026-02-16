ensureAuth()
const pfCtx = document.getElementById('priceForecast').getContext('2d')
const dfCtx = document.getElementById('demandForecast').getContext('2d')

const priceChart = new Chart(pfCtx, {
  type:'line',
  data:{labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[{label:'Price',data:[2100,2300,2500,2400,2600,2800], borderColor:'#2e7d32', backgroundColor:'rgba(46,125,50,0.06)'}]},
  options:{plugins:{legend:{display:false}}}
})
const demandChart = new Chart(dfCtx, {
  type:'line',
  data:{labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[{label:'Demand',data:[60,70,90,80,95,98],borderColor:'#4caf50',backgroundColor:'rgba(76,175,80,0.08)'}]},
  options:{plugins:{legend:{display:false}}}
})

function runPrediction(){
  // just randomize slightly to demo
  priceChart.data.datasets[0].data = priceChart.data.datasets[0].data.map(v=>Math.round(v*(0.95 + Math.random()*0.1)))
  demandChart.data.datasets[0].data = demandChart.data.datasets[0].data.map(v=>Math.round(v*(0.9 + Math.random()*0.2)))
  priceChart.update(); demandChart.update()
  toast('Prediction complete (demo)')
}

function savePrediction(){
  // Save to profile -> saved predictions
  const list = JSON.parse(localStorage.getItem('savedPredictions')||'[]')
  list.push({crop: document.getElementById('cropSelect').value, date: document.getElementById('harvestDate').value || new Date().toISOString().slice(0,10), ts: Date.now()})
  localStorage.setItem('savedPredictions', JSON.stringify(list))
  toast('Prediction saved')
}
