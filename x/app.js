// --- AUTH helpers (local demo) ---
function getUsers(){ return JSON.parse(localStorage.getItem('users')||'[]') }
function saveUsers(u){ localStorage.setItem('users', JSON.stringify(u)) }
function authSignUp(name, email, password){
  const users = getUsers()
  if(users.find(x=>x.email===email)) return false
  users.push({id:Date.now(), name, email, password, profile:{farm:'Unknown', size:'Unknown'}})
  saveUsers(users)
  localStorage.setItem('currentUser', email)
  return true
}
function authSignIn(email, password){
  const users = getUsers()
  const u = users.find(x=>x.email===email && x.password===password)
  if(u){ localStorage.setItem('currentUser', email); return true }
  return false
}
function signOut(){ localStorage.removeItem('currentUser'); location.href='index.html' }
function getCurrentUser(){
  const email = localStorage.getItem('currentUser'); if(!email) return null
  return getUsers().find(u=>u.email===email) || null
}
function ensureAuth(){
  const user = getCurrentUser()
  if(!user) location.href='index.html'
  return user
}

// --- init common UI for every page (header + nav) ---
document.addEventListener('DOMContentLoaded', ()=>{
  // inject header (if page has .insertHeader placeholder)
  const inserts = document.querySelectorAll('.insertHeader')
  inserts.forEach(div=>{
    div.innerHTML = `
      <header class="header card">
        <div class="brand"><span class="leaf">🌱</span> <strong>Agri Smart</strong></div>
        <nav class="nav">
          <a href="dashboard.html" class="nav-link">Home</a>
          <a href="predictions.html" class="nav-link">Predictions</a>
          <a href="alerts.html" class="nav-link">Alerts</a>
          <a href="marketplace.html" class="nav-link">Marketplace</a>
          <a href="analytics.html" class="nav-link">Analytics</a>
          <a href="profile.html" class="nav-link">Profile</a>
        </nav>
        <div style="margin-left:auto;display:flex;gap:12px;align-items:center">
          <div id="userLabel" style="padding:6px 10px;border-radius:999px;background:var(--pill);color:var(--accent)"></div>
          <button class="btn" onclick="signOut()">Logout</button>
        </div>
      </header>`
  })

  // fill user label
  const user = getCurrentUser()
  const label = document.getElementById('userLabel')
  if(label) label.textContent = user ? (user.name.split(' ')[0]) : 'Guest'

  // highlight current nav link
  const links = document.querySelectorAll('.nav-link')
  links.forEach(a=>{
    if(a.href === location.href || location.pathname.endsWith(a.getAttribute('href'))){
      a.classList.add('active')
    }
  })
})

// small utility for toasts
function toast(msg, t=2500){
  const d = document.createElement('div'); d.className='card'; d.style.position='fixed'; d.style.right='18px'; d.style.bottom='18px'; d.style.zIndex=2000; d.style.padding='12px 16px'; d.style.borderRadius='10px'; d.style.background='var(--accent)'; d.style.color='#fff'; d.textContent=msg
  document.body.appendChild(d)
  setTimeout(()=> d.remove(), t)
}
