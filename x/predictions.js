try { ensureAuth() } catch(e) { console.error('Auth failed:', e); location.href='auth.html' }

let priceChart, demandChart

function initCharts() {
  try {
    const pfCtx = document.getElementById('priceForecast')
    const dfCtx = document.getElementById('demandForecast')
    
    if (!pfCtx || !dfCtx) { console.error('Chart containers not found'); return }

    priceChart = new Chart(pfCtx, {
      type:'line',
      data:{labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[{label:'Price',data:[2100,2300,2500,2400,2600,2800], borderColor:'#2e7d32', backgroundColor:'rgba(46,125,50,0.06)'}]},
      options:{plugins:{legend:{display:false}}}
    })
    demandChart = new Chart(dfCtx, {
      type:'line',
      data:{labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:[{label:'Demand',data:[60,70,90,80,95,98],borderColor:'#4caf50',backgroundColor:'rgba(76,175,80,0.08)'}]},
      options:{plugins:{legend:{display:false}}}
    })
  } catch(e) {
    console.error('Chart init error:', e)
    toast('Failed to initialize charts', 3000)
  }
}

function runPrediction(){
  try {
    const crop = document.getElementById('cropSelect')?.value
    const location = document.getElementById('locSelect')?.value
    const date = document.getElementById('harvestDate')?.value
    
    if(!crop) { toast('Please select a crop', 3000); return }
    if(!location) { toast('Please select a location', 3000); return }
    if(!date) { toast('Please select a harvest date', 3000); return }
    
    if(!priceChart || !demandChart) { toast('Charts not initialized', 3000); return }
    
    priceChart.data.datasets[0].data = priceChart.data.datasets[0].data.map(v=>Math.round(v*(0.95 + Math.random()*0.1)))
    demandChart.data.datasets[0].data = demandChart.data.datasets[0].data.map(v=>Math.round(v*(0.9 + Math.random()*0.2)))
    priceChart.update(); demandChart.update()
    toast('Prediction complete for ' + crop)
  } catch(e) {
    console.error('Prediction error:', e)
    toast('Failed to run prediction', 3000)
  }
}

function savePrediction(){
  try {
    const crop = document.getElementById('cropSelect')?.value
    const date = document.getElementById('harvestDate')?.value
    if(!crop) { toast('Select a crop first', 3000); return }
    const list = JSON.parse(localStorage.getItem('savedPredictions')||'[]')
    list.push({crop, date: date || new Date().toISOString().slice(0,10), ts: Date.now()})
    localStorage.setItem('savedPredictions', JSON.stringify(list))
    toast('Prediction saved')
  } catch(e) {
    console.error('Save prediction error:', e)
    toast('Failed to save prediction', 3000)
  }
}

document.addEventListener('DOMContentLoaded', initCharts)
