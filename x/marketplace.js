/* ----------- DATA ----------- */
const equipment = [
  {name:"John Deere Tractor 5050D",desc:"50HP tractor suitable for ploughing and hauling",price:1500,location:"Punjab",status:"available",rating:4.8,image:"Pictures/Johndeer.jpg"},
  {name:"Rotavator",desc:"Heavy-duty rotavator for soil preparation",price:800,location:"Haryana",status:"available",rating:4.5,image:"Pictures/rootavator.jpg"},
  {name:"Seed Drill Machine",desc:"Precision seed drill for row planting",price:600,location:"Punjab",status:"booked",rating:4.3,image:"Pictures/drill.jpg"},
  {name:"Harvester Combine",desc:"Self-propelled combine harvester",price:3500,location:"UP",status:"available",rating:4.9,image:"Pictures/combine.jpg"},
  {name:"Sprayer Pump",desc:"Motorized backpack sprayer 20L capacity",price:200,location:"Maharashtra",status:"available",rating:4.2,image:"Pictures/sprayerpump.jpg"},
  {name:"Thresher Machine",desc:"Multi-crop thresher with high output",price:1200,location:"Haryana",status:"maintenance",rating:4.6,image:"Pictures/ThresherMachine.jpg"},
  {name:"Cultivator",desc:"9-tyne spring loaded cultivator",price:500,location:"MP",status:"available",rating:4.4,image:"Pictures/Cultivator.jpg"},
  {name:"Laser Land Leveler",desc:"Precision laser-guided land leveler",price:2000,location:"Punjab",status:"available",rating:4.7,image:"Pictures/LaserLandLeveler.jpg"}
];

/* ----------- RENDER ----------- */
function renderCards(list){
  try {
    const grid = document.getElementById("grid");
    if(!grid) { console.error('Grid container not found'); return }
    grid.innerHTML = "";

    if(list.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999">No equipment found</div>';
      return;
    }

    list.forEach(item=>{
      try {
        const card = document.createElement("div");
        card.className="card";

        const imgSrc = item.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect fill="%23e9ede2" width="220" height="220"/><text x="50%" y="50%" font-size="40" text-anchor="middle" dy=".3em" fill="%23999">📦</text></svg>';
        
        card.innerHTML = `
          <div class="card-img" style="position:relative;overflow:hidden">
            <img src="${imgSrc}" alt="${item.name || 'Equipment'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22><rect fill=%22%23e9ede2%22 width=%22220%22 height=%22220%22/><text x=%2250%25%22 y=%2250%25%22 font-size=%2240%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22>❌</text></svg>'">
          </div>

          <div class="card-content">
            <div class="title-row">
              <b>${item.name || 'Unknown'}</b>
              <span class="badge ${item.status || 'unknown'}">
                ${item.status || 'unknown'}
              </span>
            </div>

            <div class="desc">${item.desc || 'No description'}</div>

            <div class="row">
              <span>📍 ${item.location || 'N/A'}</span>
              <span>⭐ ${item.rating || 'N/A'}</span>
            </div>

            <div class="price-row">
              <span class="price">₹${item.price || 0}/day</span>
              <button class="book-btn" onclick="bookEquipment('${(item.name||'').replace(/'/g, "\\'")}')"
                ${item.status !== "available" ? "disabled" : ""}>
                📅 Book
              </button>
            </div>
          </div>
        `;

        grid.appendChild(card);
      } catch(e) {
        console.error('Error rendering card:', item, e);
      }
    });
  } catch(e) {
    console.error('Render error:', e);
  }
}

function bookEquipment(name) {
  try {
    toast(`Booked: ${name}`, 2000);
    const bookings = JSON.parse(localStorage.getItem('bookings')||'[]');
    bookings.push({item: name, dates: new Date().toISOString().slice(0,10), cost: Math.floor(Math.random()*2000+500)});
    localStorage.setItem('bookings', JSON.stringify(bookings));
  } catch(e) {
    console.error('Booking error:', e);
    toast('Booking failed', 2000);
  }
}

/* ----------- FILTER ----------- */
function applyFilters(){
  try {
    let search = document.getElementById("search")?.value.toLowerCase() || "";
    let location = document.getElementById("location")?.value || "All Locations";
    let status = document.getElementById("status")?.value || "all";

    let filtered = equipment.filter(e=>{
      if(search && !((e.name||'').toLowerCase().includes(search) || (e.desc||'').toLowerCase().includes(search))) return false;
      if(location !== "All Locations" && e.location !== location) return false;
      if(status !== "all" && e.status !== status) return false;
      return true;
    });

    renderCards(filtered);
  } catch(e) {
    console.error('Filter error:', e);
    toast('Filter failed', 2000);
    renderCards(equipment);
  }
}

/* ----------- CLEAR ----------- */
function clearFilters(){
  try {
    const search = document.getElementById("search");
    const location = document.getElementById("location");
    const status = document.getElementById("status");
    if(search) search.value="";
    if(location) location.value="All Locations";
    if(status) status.value="all";
    renderCards(equipment);
  } catch(e) {
    console.error('Clear filters error:', e);
  }
}

/* ----------- EVENTS ----------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const search = document.getElementById("search");
    const location = document.getElementById("location");
    const status = document.getElementById("status");
    if(search) search.addEventListener("input",applyFilters);
    if(location) location.addEventListener("change",applyFilters);
    if(status) status.addEventListener("change",applyFilters);
    renderCards(equipment);
  } catch(e) {
    console.error('Init error:', e);
  }
});