const base='http://localhost:4000/api';
const login=await fetch(`${base}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'demo.organizer@evently.dev',password:'Password123!'})});
if(!login.ok)throw new Error(`Login: ${login.status}`);
const {data:{accessToken}}=await login.json();
for(const days of [7,30,90]){const r=await fetch(`${base}/organizer/analytics?days=${days}`,{headers:{Authorization:`Bearer ${accessToken}`}});const {data}=await r.json();if(!r.ok||data.trend.length!==days)throw new Error(`Analytics ${days} failed`);console.log(JSON.stringify({days,totals:data.totals,topEvents:data.topEvents.length}));}
const a=await fetch(`${base}/events?limit=1&page=1`).then(r=>r.json());
const b=await fetch(`${base}/events?limit=1&page=2`).then(r=>r.json());
if(a.data.items[0].id===b.data.items[0].id)throw new Error('Pagination failed');
console.log('Login, analytics windows, API pagination: passed');
