ensureAuth()
let items = JSON.parse(localStorage.getItem('market_items')||'null')
if(!items){
  items = [
    {id:1,name:'John Deere Tractor 5050D',price:1500,loc:'Punjab',status:'available',rating:4.8},
    {id:2,name:'Rotavator',price:800,loc:'Haryana',status:'available',rating:4.5},
    {id:3,name:'Seed Drill',price:600,loc:'Punjab',status:'booked',rating:4.3},
    {id:4,name:'Sprayer Pump',price:200,loc:'Maharashtra',status:'available',rating:4.2}
  ]
  localStorage.setItem('market_items', JSON.stringify(items))
}
function renderMarket(){
  const grid = document.getElementById('marketGrid'); grid.innerHTML=''
  items.forEach(it=>{
    const el = document.createElement('div'); el.className='card'
    el.innerHTML = `<div style="height:120px;background:#f3f6f3;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:8px">🚜</div>
      <div style="font-weight:700">${it.name} <span style="float:right;color:${it.status==='available'?'#2e7d32':'#d9534f'};font-weight:600">${it.status}</span></div>
      <div class="muted" style="margin-top:6px">${it.loc} • ⭐ ${it.rating}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <div style="font-weight:800">₹${it.price}/day</div>
        <div>
          <button class="btn" onclick="openBook(${it.id})">Book</button>
        </div>
      </div>`
    grid.appendChild(el)
  })
}
renderMarket()

function openBook(id){
  const it = items.find(x=>x.id===id)
  if(!it) return
  if(it.status!=='available'){ alert('This item is not available'); return }
  const date = prompt(`Enter booking dates for ${it.name} (e.g. 2026-03-10 to 2026-03-12)`,'2026-03-10 to 2026-03-12')
  if(!date) return
  // save booking
  const bookings = JSON.parse(localStorage.getItem('bookings')||'[]')
  bookings.push({id:Date.now(), item:it.name, dates:date, user:getCurrentUser().email, cost: (it.price*2)})
  localStorage.setItem('bookings', JSON.stringify(bookings))
  // mark item as booked (demo)
  it.status = 'booked'
  localStorage.setItem('market_items', JSON.stringify(items))
  toast('Booking confirmed'); renderMarket()
}
