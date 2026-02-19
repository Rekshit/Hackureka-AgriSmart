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
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  list.forEach(item=>{
    const card = document.createElement("div");
    card.className="card";

    card.innerHTML = `
      <div class="card-img">
        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>

      <div class="card-content">
        <div class="title-row">
          <b>${item.name}</b>
          <span class="badge ${item.status}">
            ${item.status}
          </span>
        </div>

        <div class="desc">${item.desc}</div>

        <div class="row">
          <span>📍 ${item.location}</span>
          <span>⭐ ${item.rating}</span>
        </div>

        <div class="price-row">
          <span class="price">₹${item.price}/day</span>
          <button class="book-btn"
            ${item.status !== "available" ? "disabled" : ""}>
            📅 Book
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* ----------- FILTER ----------- */
function applyFilters(){
  let search = document.getElementById("search").value.toLowerCase();
  let location = document.getElementById("location").value;
  let status = document.getElementById("status").value;

  let filtered = equipment.filter(e=>{
    if(search && !e.name.toLowerCase().includes(search)) return false;
    if(location !== "All Locations" && e.location !== location) return false;
    if(status !== "all" && e.status !== status) return false;
    return true;
  });

  renderCards(filtered);
}

/* ----------- CLEAR ----------- */
function clearFilters(){
  document.getElementById("search").value="";
  document.getElementById("location").value="All Locations";
  document.getElementById("status").value="all";
  renderCards(equipment);
}

/* ----------- EVENTS ----------- */
document.getElementById("search").addEventListener("input",applyFilters);
document.getElementById("location").addEventListener("change",applyFilters);
document.getElementById("status").addEventListener("change",applyFilters);

/* INITIAL LOAD */
renderCards(equipment);