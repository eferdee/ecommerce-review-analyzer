// ============================================================
// app.js — Application Logic
// Review Intelligence Dashboard
// ============================================================

// ════════════════════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════════════════════
let state = {
  filterCat: "all",
  filterSent: "all",
  filterPeriod: "all",
  // table state
  tblSearch: "",
  tblCat: "all",
  tblSent: "all",
  tblRating: "all",
  tblSort: {col:"id", dir:"asc"},
  tblPage: 1,
  tblPageSize: 15,
  // active cat card
  activeCat: null,
  // charts
  charts: {}
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════
function fmt(n){ return n >= 1000 ? n.toLocaleString('id-ID') : n; }
function pct(a,b){ return b === 0 ? 0 : Math.round(a/b*100); }
function stars(r){
  let s="";
  for(let i=1;i<=5;i++) s+=i<=r?"★":"☆";
  return s;
}
function sentBadge(s){
  const m={Positive:"badge-pos",Neutral:"badge-neu",Negative:"badge-neg"};
  const d={Positive:"dot-pos",Neutral:"dot-neu",Negative:"dot-neg"};
  return `<span class="badge ${m[s]}"><span class="dot ${d[s]}"></span>${s}</span>`;
}

// ════════════════════════════════════════════════════════════════════════════
// FILTERED DATA
// ════════════════════════════════════════════════════════════════════════════
function getFiltered(){
  return ALL_REVIEWS.filter(r => {
    if(state.filterCat !== "all" && r.category !== state.filterCat) return false;
    if(state.filterSent !== "all" && r.sentiment !== state.filterSent) return false;
    return true;
  });
}

function computeStats(data){
  const total = data.length;
  if(total === 0) return {total:0, avg:0, sentiment:{Positive:0,Neutral:0,Negative:0}, ratingDist:{1:0,2:0,3:0,4:0,5:0}, categories:{}};
  const sum = data.reduce((a,r)=>a+r.rating,0);
  const avg = Math.round(sum/total*100)/100;
  const sentiment = {Positive:0,Neutral:0,Negative:0};
  const ratingDist = {1:0,2:0,3:0,4:0,5:0};
  const catMap = {};
  data.forEach(r => {
    sentiment[r.sentiment]++;
    ratingDist[r.rating]++;
    if(!catMap[r.category]) catMap[r.category]={count:0,pos:0,neu:0,neg:0,sum:0};
    catMap[r.category].count++;
    catMap[r.category][r.sentiment==="Positive"?"pos":r.sentiment==="Neutral"?"neu":"neg"]++;
    catMap[r.category].sum+=r.rating;
  });
  const categories = {};
  Object.entries(catMap).forEach(([k,v])=>{
    categories[k]={...v, avg:Math.round(v.sum/v.count*100)/100, emoji:RAW_STATS.categories[k]?.emoji||"📦"};
  });
  return {total,avg,sentiment,ratingDist,categories};
}

// ════════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════════════════════
function navigate(page, el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  el.classList.add('active');
  closeSidebar();
  if(page==='overview') renderOverview();
  if(page==='reviews') renderTable();
  if(page==='sentiment') renderSentiment();
  if(page==='insights') renderInsights();
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sb-overlay').classList.toggle('open');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').classList.remove('open');
}

// ════════════════════════════════════════════════════════════════════════════
// FILTERS
// ════════════════════════════════════════════════════════════════════════════
function applyFilters(){
  state.filterCat  = document.getElementById('filterCategory').value;
  state.filterSent = document.getElementById('filterSentiment').value;
  state.filterPeriod = document.getElementById('filterPeriod').value;
  const active = document.querySelector('.sb-item.active');
  const page = active?.getAttribute('onclick')?.match(/navigate\('(\w+)'/)?.[1]||'overview';
  if(page==='overview') renderOverview();
  if(page==='sentiment') renderSentiment();
}

function resetFilters(){
  state.filterCat="all"; state.filterSent="all"; state.filterPeriod="all";
  document.getElementById('filterCategory').value="all";
  document.getElementById('filterSentiment').value="all";
  document.getElementById('filterPeriod').value="all";
  applyFilters();
}

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
function renderOverview(){
  const data = getFiltered();
  const s = computeStats(data);
  const posPct = pct(s.sentiment.Positive, s.total);
  const negPct = pct(s.sentiment.Negative, s.total);

  document.getElementById('kpi-total').textContent = fmt(s.total);
  document.getElementById('kpi-avg').textContent = s.avg.toFixed(2);
  document.getElementById('kpi-pos-pct').textContent = posPct+'%';
  document.getElementById('kpi-pos-abs').textContent = fmt(s.sentiment.Positive)+' ulasan positif';
  document.getElementById('kpi-neg').textContent = fmt(s.sentiment.Negative);
  document.getElementById('kpi-neg-pct').textContent = negPct+'% dari total';

  const cats = Object.keys(s.categories).length;
  const prods = new Set(data.map(r=>r.product)).size;
  document.getElementById('ov-subtitle').textContent = `${fmt(s.total)} ulasan · ${prods} produk · ${cats} kategori`;

  renderSentDoughnut(s);
  renderRatingBar(s);
  renderCatCards(s);
  renderCatSentBar(s);
}

function renderSentDoughnut(s){
  destroyChart('chartSentDoughnut');
  const ctx = document.getElementById('chartSentDoughnut').getContext('2d');
  state.charts['chartSentDoughnut'] = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:['Positive','Neutral','Negative'],
      datasets:[{
        data:[s.sentiment.Positive, s.sentiment.Neutral, s.sentiment.Negative],
        backgroundColor:['#16a34a','#d97706','#dc2626'],
        borderWidth:0,
        hoverOffset:6
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      cutout:'65%',
      plugins:{
        legend:{position:'bottom',labels:{font:{size:11},padding:14,usePointStyle:true,pointStyleWidth:8}},
        tooltip:{callbacks:{label:ctx=>{
          const pct2 = Math.round(ctx.parsed/s.total*100);
          return ` ${ctx.label}: ${fmt(ctx.parsed)} (${pct2}%)`;
        }}}
      }
    }
  });
}

function renderRatingBar(s){
  destroyChart('chartRatingBar');
  const ctx = document.getElementById('chartRatingBar').getContext('2d');
  const vals = [1,2,3,4,5].map(r=>s.ratingDist[r]||0);
  const colors = ['#dc2626','#ef4444','#d97706','#3b82f6','#16a34a'];
  state.charts['chartRatingBar'] = new Chart(ctx, {
    type:'bar',
    data:{
      labels:['★1','★2','★3','★4','★5'],
      datasets:[{
        data:vals,
        backgroundColor:colors,
        borderRadius:5,
        borderSkipped:false
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${fmt(ctx.parsed.y)} ulasan`}}},
      scales:{
        x:{grid:{display:false},ticks:{font:{size:11}}},
        y:{grid:{color:'#f0f2f5'},ticks:{font:{size:11},stepSize:100}}
      }
    }
  });
}

function renderCatCards(s){
  const grid = document.getElementById('catGrid');
  const cats = Object.entries(s.categories);
  if(cats.length===0){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1">Tidak ada data untuk filter ini</div>';return;}
  grid.innerHTML = cats.map(([name,d])=>{
    const posW = pct(d.pos,d.count);
    const neuW = pct(d.neu,d.count);
    const negW = pct(d.neg,d.count);
    const isActive = state.activeCat===name;
    return `<div class="cat-card${isActive?' active':''}" onclick="toggleCatFilter('${name}')">
      <div class="cat-card-header">
        <div>
          <div class="cat-name">${d.emoji} ${name}</div>
          <div class="text-sm text-muted mt-4">${fmt(d.count)} ulasan</div>
        </div>
        <div style="text-align:right">
          <div class="cat-avg">${d.avg.toFixed(2)}</div>
          <div class="cat-avg-label">avg rating</div>
        </div>
      </div>
      <div class="cat-bar-wrap">
        <div class="cat-bar-row">
          <span class="cat-bar-label" style="color:#16a34a">✓</span>
          <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${posW}%;background:#16a34a"></div></div>
          <span class="cat-bar-count">${d.pos}</span>
        </div>
        <div class="cat-bar-row">
          <span class="cat-bar-label" style="color:#d97706">–</span>
          <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${neuW}%;background:#d97706"></div></div>
          <span class="cat-bar-count">${d.neu}</span>
        </div>
        <div class="cat-bar-row">
          <span class="cat-bar-label" style="color:#dc2626">✗</span>
          <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${negW}%;background:#dc2626"></div></div>
          <span class="cat-bar-count">${d.neg}</span>
        </div>
      </div>
      <div class="cat-footer">
        <span>${sentBadge(d.pos>=d.neg+d.neu?'Positive':d.neg>d.pos?'Negative':'Neutral')}</span>
        <span class="text-sm text-muted">${posW}% positif</span>
      </div>
    </div>`;
  }).join('');
}

function renderCatSentBar(s){
  destroyChart('chartCatSent');
  const ctx = document.getElementById('chartCatSent').getContext('2d');
  const cats = Object.keys(s.categories);
  state.charts['chartCatSent'] = new Chart(ctx, {
    type:'bar',
    data:{
      labels:cats,
      datasets:[
        {label:'Positive',data:cats.map(c=>s.categories[c]?.pos||0),backgroundColor:'#16a34a',borderRadius:4,borderSkipped:false},
        {label:'Neutral', data:cats.map(c=>s.categories[c]?.neu||0),backgroundColor:'#d97706',borderRadius:4,borderSkipped:false},
        {label:'Negative',data:cats.map(c=>s.categories[c]?.neg||0),backgroundColor:'#dc2626',borderRadius:4,borderSkipped:false}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:14,usePointStyle:true,pointStyleWidth:8}},
               tooltip:{mode:'index',intersect:false}},
      scales:{
        x:{grid:{display:false},ticks:{font:{size:12}}},
        y:{grid:{color:'#f0f2f5'},ticks:{font:{size:11}},stacked:false}
      }
    }
  });
}

function toggleCatFilter(name){
  if(state.activeCat===name){ state.activeCat=null; state.filterCat="all"; document.getElementById('filterCategory').value="all"; }
  else { state.activeCat=name; state.filterCat=name; document.getElementById('filterCategory').value=name; }
  applyFilters();
}

// ════════════════════════════════════════════════════════════════════════════
// TABLE
// ════════════════════════════════════════════════════════════════════════════
function filterTable(){
  state.tblSearch = document.getElementById('tableSearch').value.toLowerCase();
  state.tblCat    = document.getElementById('tblCatFilter').value;
  state.tblSent   = document.getElementById('tblSentFilter').value;
  state.tblRating = document.getElementById('tblRatingFilter').value;
  state.tblPage   = 1;
  renderTableBody();
}

function getTableData(){
  return ALL_REVIEWS.filter(r => {
    if(state.tblCat!=="all" && r.category!==state.tblCat) return false;
    if(state.tblSent!=="all" && r.sentiment!==state.tblSent) return false;
    if(state.tblRating!=="all" && r.rating!==parseInt(state.tblRating)) return false;
    if(state.tblSearch){
      const q = state.tblSearch;
      if(!r.product.toLowerCase().includes(q) && !r.review.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a,b)=>{
    const {col,dir} = state.tblSort;
    let va=a[col], vb=b[col];
    if(typeof va==='string') va=va.toLowerCase(), vb=vb.toLowerCase();
    if(va<vb) return dir==='asc'?-1:1;
    if(va>vb) return dir==='asc'?1:-1;
    return 0;
  });
}

function sortTable(col){
  if(state.tblSort.col===col) state.tblSort.dir = state.tblSort.dir==='asc'?'desc':'asc';
  else { state.tblSort.col=col; state.tblSort.dir='asc'; }
  document.querySelectorAll('thead th').forEach(th=>th.classList.remove('sorted'));
  event.currentTarget.classList.add('sorted');
  state.tblPage=1;
  renderTableBody();
}

function renderTable(){
  state.tblPage=1;
  renderTableBody();
}

function renderTableBody(){
  const data = getTableData();
  const total = data.length;
  const pages = Math.ceil(total/state.tblPageSize);
  const start = (state.tblPage-1)*state.tblPageSize;
  const slice = data.slice(start, start+state.tblPageSize);

  document.getElementById('tbl-subtitle').textContent = `Menampilkan ${fmt(total)} dari ${fmt(ALL_REVIEWS.length)} ulasan`;
  document.getElementById('tbl-count-label').textContent = `${fmt(total)} hasil · halaman ${state.tblPage} dari ${pages||1}`;

  const tbody = document.getElementById('tableBody');
  if(slice.length===0){
    tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Tidak ada ulasan yang cocok</div></td></tr>`;
    document.getElementById('pagination').innerHTML='';
    return;
  }
  tbody.innerHTML = slice.map(r=>`
    <tr>
      <td class="id-col">#${r.id}</td>
      <td class="product-col">${escHtml(r.product)}</td>
      <td class="review-col">${escHtml(r.review)}</td>
      <td class="rating-col"><span class="stars">${stars(r.rating)}</span> <span style="font-size:11px;color:#6b7fa3">${r.rating}</span></td>
      <td><span style="font-size:11px;font-weight:600;color:#374151">${r.category}</span></td>
      <td>${sentBadge(r.sentiment)}</td>
    </tr>`).join('');

  // Pagination
  renderPagination(pages);
}

function renderPagination(pages){
  const pg = document.getElementById('pagination');
  if(pages<=1){pg.innerHTML='';return;}
  let html='';
  const cur=state.tblPage;
  html+=`<button class="pg-btn" onclick="goPage(${cur-1})" ${cur===1?'disabled':''}>‹</button>`;
  let start=Math.max(1,cur-2), end=Math.min(pages,cur+2);
  if(start>1) html+=`<button class="pg-btn" onclick="goPage(1)">1</button>${start>2?'<span style="padding:4px 2px;font-size:11px;color:#9ca3af">…</span>':''}`;
  for(let i=start;i<=end;i++) html+=`<button class="pg-btn${i===cur?' active':''}" onclick="goPage(${i})">${i}</button>`;
  if(end<pages) html+=`${end<pages-1?'<span style="padding:4px 2px;font-size:11px;color:#9ca3af">…</span>':''}<button class="pg-btn" onclick="goPage(${pages})">${pages}</button>`;
  html+=`<button class="pg-btn" onclick="goPage(${cur+1})" ${cur===pages?'disabled':''}>›</button>`;
  pg.innerHTML=html;
}

function goPage(p){ state.tblPage=p; renderTableBody(); document.querySelector('.table-wrap').scrollIntoView({behavior:'smooth',block:'nearest'}); }
function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ════════════════════════════════════════════════════════════════════════════
// SENTIMENT PAGE
// ════════════════════════════════════════════════════════════════════════════
function renderSentiment(){
  const data = getFiltered();
  const s = computeStats(data);

  // KPI cards
  const kpiData = [
    {label:'Positive',val:s.sentiment.Positive,pct:pct(s.sentiment.Positive,s.total),cls:'green',icon:'😊'},
    {label:'Neutral', val:s.sentiment.Neutral, pct:pct(s.sentiment.Neutral,s.total), cls:'amber',icon:'😐'},
    {label:'Negative',val:s.sentiment.Negative,pct:pct(s.sentiment.Negative,s.total),cls:'red',  icon:'😞'}
  ];
  document.getElementById('sentKpiGrid').innerHTML = kpiData.map(k=>`
    <div class="kpi-card ${k.cls}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${fmt(k.val)}</div>
      <div class="kpi-sub">${k.pct}% dari total ulasan</div>
      <div class="kpi-icon ${k.cls}" style="font-size:20px;width:38px;height:38px">${k.icon}</div>
    </div>`).join('');

  // Sentiment % stacked bar
  destroyChart('chartSentPct');
  const ctx1 = document.getElementById('chartSentPct').getContext('2d');
  const cats = Object.keys(s.categories);
  state.charts['chartSentPct'] = new Chart(ctx1, {
    type:'bar',
    data:{
      labels:cats,
      datasets:[
        {label:'Positive',data:cats.map(c=>{const d=s.categories[c];return d?pct(d.pos,d.count):0}),backgroundColor:'#16a34a',borderRadius:4},
        {label:'Neutral', data:cats.map(c=>{const d=s.categories[c];return d?pct(d.neu,d.count):0}),backgroundColor:'#d97706',borderRadius:4},
        {label:'Negative',data:cats.map(c=>{const d=s.categories[c];return d?pct(d.neg,d.count):0}),backgroundColor:'#dc2626',borderRadius:4}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:14,usePointStyle:true,pointStyleWidth:8}},
               tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.parsed.y}%`}}},
      scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:'#f0f2f5'},ticks:{font:{size:11},callback:v=>v+'%'},max:100}}
    }
  });

  // Avg rating bar
  destroyChart('chartAvgRating');
  const ctx2 = document.getElementById('chartAvgRating').getContext('2d');
  state.charts['chartAvgRating'] = new Chart(ctx2, {
    type:'bar',
    data:{
      labels:cats,
      datasets:[{
        label:'Avg Rating',
        data:cats.map(c=>s.categories[c]?.avg||0),
        backgroundColor:['#4f63d2','#7c5cd8','#0ea5e9','#06b6d4'],
        borderRadius:5,borderSkipped:false
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      indexAxis:'y',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`Rating: ${ctx.parsed.x.toFixed(2)}`}}},
      scales:{
        x:{grid:{color:'#f0f2f5'},ticks:{font:{size:11}},min:3.5,max:5.0},
        y:{grid:{display:false},ticks:{font:{size:11}}}
      }
    }
  });

  // Theme cards
  const themes = [
    {title:'Tema Apresiasi (Positif)',icon:'green',items:[
      {icon:'⚡',label:'Performa & Kecepatan',desc:'SSD, prosesor Gen 11, dan GPU gaming mendapat pujian luas.',count:312,cls:'count-pos'},
      {icon:'💰',label:'Value for Money',desc:'Harga kompetitif dianggap sangat sebanding dengan fitur.',count:289,cls:'count-pos'},
      {icon:'🎁',label:'Pengiriman Cepat',desc:'Pengiriman 1–2 hari dan kemasan aman sangat diapresiasi.',count:198,cls:'count-pos'},
      {icon:'❄️',label:'Pendinginan Kulkas',desc:'Kulkas dinilai efektif, senyap, dan hemat energi.',count:167,cls:'count-pos'},
      {icon:'🔊',label:'Kualitas Audio TV',desc:'Dolby Atmos pada Smart TV mendapat penilaian sangat baik.',count:145,cls:'count-pos'}
    ]},
    {title:'Tema Keluhan (Negatif)',icon:'red',items:[
      {icon:'🔋',label:'Daya Tahan Baterai',desc:'Laptop & ponsel dikritik atas baterai yang tidak tahan lama.',count:89,cls:'count-neg'},
      {icon:'📷',label:'Kualitas Kamera',desc:'Kamera ponsel entry-level tidak sesuai klaim spesifikasi.',count:67,cls:'count-neg'},
      {icon:'📦',label:'Quality Control',desc:'Beberapa kulkas tiba penyok atau mengalami defrost spontan.',count:14,cls:'count-neg'},
      {icon:'📲',label:'Ekosistem Aplikasi TV',desc:'Smart TV tertentu memiliki app store terbatas & DRM issue.',count:18,cls:'count-neg'},
      {icon:'🔧',label:'Layanan Purna Jual',desc:'Respons servis Motorola dinilai lambat dan tidak memadai.',count:9,cls:'count-neg'}
    ]}
  ];
  document.getElementById('sentThemesGrid').innerHTML = themes.map(t=>`
    <div class="theme-card">
      <div class="theme-card-header">
        <div class="theme-card-icon ${t.icon}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${t.icon==='green'?'#16a34a':'#dc2626'}" stroke-width="2">
            ${t.icon==='green'?'<polyline points="20 6 9 17 4 12"/>':'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
          </svg>
        </div>
        <div class="theme-card-title">${t.title}</div>
      </div>
      ${t.items.map(item=>`
        <div class="theme-item">
          <div class="theme-item-icon">${item.icon}</div>
          <div class="theme-item-body">
            <div class="theme-item-label">${item.label}</div>
            <div class="theme-item-desc">${item.desc}</div>
          </div>
          <span class="theme-item-count ${item.cls}">${item.count}</span>
        </div>`).join('')}
    </div>`).join('');
}

// ════════════════════════════════════════════════════════════════════════════
// AI INSIGHTS
// ════════════════════════════════════════════════════════════════════════════
const AI_SUMMARIES = {
  "Laptop": {
    sentiment:"Positive",
    summary:`Secara umum, pelanggan laptop menunjukkan tingkat kepuasan yang tinggi, khususnya terhadap performa yang ditawarkan oleh prosesor generasi terbaru (AMD Ryzen 5 dan Intel Core i3/i5 Gen 11) serta kehadiran SSD yang memberikan waktu booting dan respons sistem yang jauh lebih cepat. Banyak pembeli menyatakan bahwa laptop dalam segmen ini memberikan nilai yang sangat baik untuk harganya. Perangkat gaming seperti Lenovo IdeaPad Gaming 3 mendapatkan apresiasi tersendiri atas kemampuannya menjalankan game modern, didukung GPU NVIDIA GeForce GTX 1650 dan layar 120 Hz. Namun demikian, daya tahan baterai menjadi keluhan yang paling konsisten di hampir semua merek dan model—laptop gaming hanya mampu bertahan 2–3 jam tanpa adaptor. Beberapa pelanggan juga menyoroti keterbatasan webcam berkualitas rendah, speaker kurang memuaskan, serta absennya keyboard backlight pada model entry-level.`,
    tags:["Performa SSD","Value for Money","Baterai Lemah","Webcam Buruk"]
  },
  "Ponsel": {
    sentiment:"Positive",
    summary:`Kategori ponsel mencakup rentang produk paling luas, mulai dari iPhone SE premium hingga ponsel entry-level. Sentimen cenderung positif, namun dengan variasi lebih tinggi dibanding kategori lain. iPhone SE mendapatkan ulasan sangat positif atas kualitas kamera, performa chip Apple, desain premium kompak, serta ekosistem iOS yang andal. Di segmen entry-level, kualitas kamera menjadi poin kritik paling dominan—kamera realme C21Y dan C25Y berulang kali disebut tidak sebanding spesifikasi yang diklaim (13 MP/50 MP), terutama dalam pencahayaan rendah. Daya tahan baterai realme C21Y dan POCO C31 justru banyak dipuji, begitu pula kecepatan sensor sidik jari. Pengiriman dari platform e-commerce umumnya diapresiasi karena kecepatan dan kondisi kemasan yang baik.`,
    tags:["Kamera iOS Terbaik","Baterai Entry-Level Baik","Kamera Entry-Level Buruk","Pengiriman Cepat"]
  },
  "Kulkas": {
    sentiment:"Positive",
    summary:`Kategori kulkas mencatat rata-rata rating tertinggi (4,60), mencerminkan tingkat kepuasan yang sangat solid. Produk dari Samsung, LG, Whirlpool, Haier, dan Godrej secara umum diterima dengan baik. Pelanggan paling banyak memuji performa pendinginan efektif, desain estetis, operasional senyap, serta efisiensi energi—terutama pada model berperingkat 4 dan 5 bintang. Layanan instalasi mendapat apresiasi khusus, dengan beberapa pelanggan terkejut dengan pengiriman tiba hanya dalam satu hari. Keluhan lebih bersifat sporadis: beberapa unit Samsung tiba dalam kondisi penyok dan tidak seimbang, mengalami masalah defrost otomatis di minggu pertama, serta manajemen ruang internal yang kurang praktis dibanding LG. Godrej mendapat kritik atas kebisingan yang berlebihan.`,
    tags:["Pendinginan Efektif","Instalasi Cepat","Hemat Energi","QC Perlu Ditingkatkan"]
  },
  "Smart TV": {
    sentiment:"Positive",
    summary:`Kategori Smart TV mendapatkan respons sangat positif, terutama untuk produk Mi (Xiaomi), OnePlus, realme, dan Vu Premium. Kualitas gambar jernih, suara menggelegar dengan Dolby Atmos, serta kemudahan navigasi Android TV menjadi poin pujian utama. "Value for money" menjadi frasa yang berulang kali muncul. Namun terdapat keluhan serius yang perlu perhatian: realme 108 cm 4K tidak mendukung Widevine DRM L1, sehingga konten 4K dari platform streaming berbayar tidak dapat diputar—kekurangan fundamental yang memengaruhi value proposition. Mi 5X dikritik atas kelambatan antarmuka dan kualitas audio yang memerlukan soundbar. OnePlus Y Series menerima kritik atas absennya konektivitas AUX. MOTOROLA ZX2 mengalami kerusakan power sensor hanya satu bulan setelah pembelian dengan layanan purna jual yang dinilai lambat.`,
    tags:["Dolby Atmos","Value for Money","DRM Issue (realme 4K)","Layanan Purna Jual Lemah"]
  }
};

const RECOMMENDATIONS = [
  {title:"Tingkatkan Transparansi Spesifikasi Kamera Ponsel",body:"Klaim MP kamera pada produk entry-level (realme C21Y, C25Y) tidak sesuai ekspektasi pelanggan. Tambahkan disclaimer kondisi pencahayaan optimal dan contoh foto aktual pada halaman produk.",cat:"Ponsel",num:1},
  {title:"Soroti Fitur Rapid Charging untuk Laptop",body:"Daya tahan baterai laptop menjadi keluhan konsisten. Tingkatkan visibilitas fitur rapid charging di materi marketing dan halaman produk untuk mengubah persepsi negatif.",cat:"Laptop",num:2},
  {title:"Cantumkan Informasi DRM L1/L3 pada TV 4K",body:"Produk TV 4K yang tidak mendukung Widevine DRM L1 wajib mencantumkan informasi ini secara eksplisit di deskripsi produk agar ekspektasi pelanggan terpenuhi.",cat:"Smart TV",num:3},
  {title:"Perkuat Quality Control Kulkas Sebelum Pengiriman",body:"Beberapa unit Samsung diterima dalam kondisi penyok. Tingkatkan protokol inspeksi pre-shipment dan tambahkan pelindung sudut pada kemasan untuk mencegah kerusakan transit.",cat:"Kulkas",num:4},
  {title:"Optimalkan Ekosistem Aplikasi Smart TV",body:"Vu Premium dan Coocaa mendapat kritik atas ekosistem aplikasi yang terbatas. Pertimbangkan kemitraan dengan platform streaming utama untuk memperluas kompatibilitas aplikasi.",cat:"Smart TV",num:5},
  {title:"Perbaiki Konsistensi Foto Produk per SKU",body:"Beberapa model Samsung Refrigerator menggunakan foto dan ulasan yang sama antar SKU berbeda, menimbulkan kebingungan. Pastikan setiap model memiliki foto dan spesifikasi yang unik.",cat:"Kulkas",num:6},
  {title:"Tambahkan Filter Backlight Keyboard di Halaman Laptop",body:"Absennya backlight keyboard pada beberapa model adalah keluhan berulang. Tambahkan atribut filter 'keyboard backlight' pada halaman kategori laptop untuk memudahkan pencarian.",cat:"Laptop",num:7},
  {title:"Percepat Respons Layanan Purna Jual",body:"Motorola ZX2 dan beberapa merek lain menerima keluhan atas lambatnya servis purna jual. Tetapkan SLA penyelesaian maksimal 72 jam dan komunikasikan kepada pelanggan.",cat:"Smart TV",num:8}
];

function renderInsights(){
  const catColors = {"Laptop":"#4f63d2","Ponsel":"#7c5cd8","Kulkas":"#0ea5e9","Smart TV":"#06b6d4"};
  const catEmojis = {"Laptop":"💻","Ponsel":"📱","Kulkas":"🧊","Smart TV":"📺"};

  document.getElementById('aiSummaryCards').innerHTML = Object.entries(AI_SUMMARIES).map(([cat,data])=>`
    <div class="ai-card">
      <div class="ai-card-header">
        <div class="ai-card-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg></div>
        <div>
          <div class="ai-card-title">${catEmojis[cat]} ${cat} — Ringkasan AI Agent</div>
          <div class="ai-card-sub">${sentBadge(data.sentiment)} &nbsp; ${RAW_STATS.categories[cat].count} ulasan · Avg ★ ${RAW_STATS.categories[cat].avg.toFixed(2)}</div>
        </div>
      </div>
      <p class="ai-summary-text">${data.summary}</p>
      <div>${data.tags.map(t=>`<span class="ai-tag">${t}</span>`).join('')}</div>
    </div>`).join('');

  document.getElementById('recoGrid').innerHTML = RECOMMENDATIONS.map(r=>`
    <div class="reco-card">
      <div class="reco-card-header">
        <div class="reco-num">${r.num}</div>
        <div class="reco-title">${r.title}</div>
      </div>
      <div class="reco-body">${r.body}</div>
      <span class="reco-cat">${catEmojis[r.cat]} ${r.cat}</span>
    </div>`).join('');
}

// ════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════════
function destroyChart(id){
  if(state.charts[id]){ state.charts[id].destroy(); delete state.charts[id]; }
}

function showUploadNotice(){
  alert('Fitur upload dataset tersedia untuk integrasi backend.\nFormat yang didukung: CSV dengan kolom Unnamed:0, Product_name, Review, Rating.');
}

// ════════════════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  renderOverview();
});
