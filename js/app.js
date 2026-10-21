/* Planet Coffee inventory: frontend only.
   Data lives in memory for now. When the Go backend is ready, replace the
   `db` object with fetch('/api/...') calls (see the TODO notes). */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money = n => '$' + Number(n).toFixed(2);
const STATUS = {'Waiting Payment':'warn',Processed:'orange',Delivered:'blue',Cancelled:'red','On Hold':'gray',Completed:'green',
  Paid:'green',Pending:'warn',Failed:'red','In Transit':'blue',Scheduled:'gray'};
const badge = s => `<span class="badge ${STATUS[s] || 'gray'}"><i></i>${esc(s)}</span>`;

// TODO: replace with GET /api/orders, /api/products, ...
const db = {
  orders: [
    {id:'PO-5301',date:'2024-11-01',supplier:'Downtown Depot',item:'Arabica Whole Beans',qty:'2kg',total:12,status:'Waiting Payment',eta:'2024-11-29'},
    {id:'PO-3745',date:'2024-02-07',supplier:'Lakeside Depot',item:'Robusta Ground Coffee',qty:'500g',total:15,status:'Processed',eta:'2024-02-26'},
    {id:'PO-3003',date:'2024-05-11',supplier:'Hilltop Warehouse',item:'Mocha Powder',qty:'300g',total:7,status:'Delivered',eta:'2024-05-26'},
    {id:'PO-8262',date:'2024-02-12',supplier:'Hilltop Warehouse',item:'Turmeric Latte Mix',qty:'200g',total:5,status:'Cancelled',eta:'2024-02-29'},
    {id:'PO-5585',date:'2024-06-13',supplier:'Hilltop Warehouse',item:'Decaf Coffee Beans',qty:'1kg',total:15,status:'On Hold',eta:'2024-07-07'},
    {id:'PO-1766',date:'2024-07-14',supplier:'Central Coffee Hub',item:'Cold Brew Concentrate',qty:'1L',total:10,status:'Completed',eta:'2024-07-19'},
    {id:'PO-6958',date:'2024-05-25',supplier:'Harvest Fulfillment',item:'Arabica Whole Beans',qty:'2kg',total:25,status:'Completed',eta:'2024-06-22'},
  ],
  products: [
    {id:'P-001',name:'Arabica Whole Beans',category:'Beans',stock:24,unit:'kg',price:12,reorder:10},
    {id:'P-002',name:'Robusta Ground Coffee',category:'Beans',stock:6,unit:'kg',price:9,reorder:8},
    {id:'P-003',name:'Mocha Powder',category:'Mixes',stock:15,unit:'pack',price:7,reorder:5},
    {id:'P-004',name:'Cold Brew Concentrate',category:'Drinks',stock:3,unit:'L',price:10,reorder:6},
    {id:'P-005',name:'Oat Milk',category:'Dairy',stock:30,unit:'L',price:3.5,reorder:12},
    {id:'P-006',name:'Paper Cups (12oz)',category:'Supplies',stock:400,unit:'pcs',price:0.08,reorder:200},
  ],
  deliveries: [
    {id:'DL-201',order:'PO-5301',supplier:'Downtown Depot',eta:'2024-11-29',status:'In Transit'},
    {id:'DL-202',order:'PO-3745',supplier:'Lakeside Depot',eta:'2024-02-26',status:'Scheduled'},
    {id:'DL-203',order:'PO-3003',supplier:'Hilltop Warehouse',eta:'2024-05-26',status:'Delivered'},
    {id:'DL-204',order:'PO-1766',supplier:'Central Coffee Hub',eta:'2024-07-19',status:'Delivered'},
  ],
  payments: [
    {id:'PAY-91',order:'PO-5301',method:'Bank transfer',amount:12,status:'Pending',date:'2024-11-02'},
    {id:'PAY-92',order:'PO-3745',method:'Credit card',amount:15,status:'Paid',date:'2024-02-08'},
    {id:'PAY-93',order:'PO-1766',method:'Cash',amount:10,status:'Paid',date:'2024-07-15'},
    {id:'PAY-94',order:'PO-8262',method:'Credit card',amount:5,status:'Failed',date:'2024-02-13'},
  ],
};

const SUPPLIERS = ['Central Coffee Hub','Downtown Depot','Lakeside Depot','Harvest Fulfillment','Hilltop Warehouse'];
const ORDER_STATUS = ['Waiting Payment','Processed','Delivered','Completed','On Hold','Cancelled'];
const CATS = ['Beans','Mixes','Drinks','Dairy','Supplies'];
const BRANDS = ['Arabica Bliss','Java Sunrise','Sumatra Reserve','Colombian Gold','Mountain Roast','Ethiopian Essence'];
// sample brand per order (the real backend will store this column)
const BR = {'PO-5301':0,'PO-3745':1,'PO-3003':2,'PO-8262':3,'PO-5585':4,'PO-1766':5,'PO-6958':0};
db.orders.forEach(o => o.brand = BRANDS[BR[o.id]]);
const dot = b => `<i class="dot" style="background:hsl(${[...b].reduce((a, c) => a + c.charCodeAt(0), 0) * 37 % 360} 45% 42%)">${esc(b[0])}</i>`;
const fmt = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});

/* Each CRUD page: columns, form fields, and optional filters. */
const PAGES = {
  orders: {icon:'🧾', title:'Orders', desc:'This page allows you to track, manage, and review all purchase orders for your coffee brand in one place.', add:'Create PO', prefix:'PO-', date:true,
    filters:[['brand','Brand',BRANDS],['supplier','Supplier',SUPPLIERS],['status','Status',ORDER_STATUS]],
    cols:[['Order ID',r=>r.id],['Date created',r=>fmt(r.date)],['Brand name',r=>dot(r.brand)+esc(r.brand)],['Supplier',r=>esc(r.supplier)],['Item',r=>esc(r.item)],
      ['Qty',r=>esc(r.qty)],['Total cost',r=>money(r.total)],['Status',r=>badge(r.status)],['Exp. delivery',r=>fmt(r.eta)]],
    fields:[['brand','Brand','select',BRANDS],['supplier','Supplier','select',SUPPLIERS],['item','Item','text'],['qty','Quantity (e.g. 2kg)','text'],['total','Total cost','number'],
      ['status','Status','select',ORDER_STATUS],['date','Date created','date'],['eta','Expected delivery','date']]},
  products: {icon:'📦', title:'Products', desc:'Everything you stock, with current levels and reorder points.', add:'Add product', prefix:'P-',
    filters:[['category','Category',CATS]],
    cols:[['SKU',r=>r.id],['Name',r=>esc(r.name)],['Category',r=>esc(r.category)],
      ['Stock',r=>`<span class="${r.stock<=r.reorder?'low':''}">${r.stock} ${esc(r.unit)}${r.stock<=r.reorder?' · low':''}</span>`],
      ['Unit price',r=>money(r.price)],['Reorder at',r=>r.reorder]],
    fields:[['name','Product name','text'],['category','Category','select',CATS],['stock','Stock on hand','number'],
      ['unit','Unit (kg, L, pcs)','text'],['price','Unit price','number'],['reorder','Reorder level','number']]},
  delivery: {icon:'🚚', title:'Delivery', desc:'Follow incoming supplier deliveries.', add:'Add delivery', prefix:'DL-', key:'deliveries',
    filters:[['status','Status',['Scheduled','In Transit','Delivered']]],
    cols:[['Delivery ID',r=>r.id],['Order',r=>r.order],['Supplier',r=>esc(r.supplier)],['Expected',r=>r.eta],['Status',r=>badge(r.status)]],
    fields:[['order','Order ID','text'],['supplier','Supplier','select',SUPPLIERS],['eta','Expected date','date'],
      ['status','Status','select',['Scheduled','In Transit','Delivered']]]},
  payments: {icon:'💳', title:'Payments', desc:'Payments made to suppliers.', add:'Record payment', prefix:'PAY-',
    filters:[['status','Status',['Pending','Paid','Failed']]],
    cols:[['Payment ID',r=>r.id],['Order',r=>r.order],['Method',r=>esc(r.method)],['Amount',r=>money(r.amount)],['Date',r=>r.date],['Status',r=>badge(r.status)]],
    fields:[['order','Order ID','text'],['method','Method','select',['Bank transfer','Credit card','Cash']],['amount','Amount','number'],
      ['date','Date','date'],['status','Status','select',['Pending','Paid','Failed']]]},
};
const NAV = [{l:'Store',i:'🏪',sub:['products','orders']},{l:'Delivery',i:'🚚',p:'delivery'},{l:'Payments',i:'💳',p:'payments'},{l:'Reports',i:'📊',p:'reports'}];
const NAV2 = [{l:'Settings',i:'⚙️',p:'settings'},{l:'Account',i:'👤',p:'account'}];
const cap = s => s[0].toUpperCase() + s.slice(1);
const store = k => db[PAGES[k].key || k];
let filt = {q:'', f:{}}, seq = 9000;

/* ---------- navigation ---------- */
const PAGE = 5; // rows per page (use 10 once there is more data)
const cur = () => location.hash.slice(1) || 'orders';
function drawNav(c) {
  const link = n => `<a href="#${n.p}" class="${n.p === c ? 'on' : ''}"><span>${n.i}</span>${n.l}</a>`;
  $('#nav').innerHTML = NAV.map(n => n.sub
    ? `<a href="#${n.sub[0]}" class="${n.sub.includes(c) ? 'on' : ''}"><span>${n.i}</span>${n.l}<b>−</b></a>` +
      n.sub.map(x => `<a class="sub ${x === c ? 'on' : ''}" href="#${x}">${cap(x)}</a>`).join('')
    : link(n)).join('') + '<hr>' + NAV2.map(link).join('');
}
function route() {
  const page = cur();
  filt = {q:'', f:{}, from:'', to:'', page:1};
  drawNav(page); $('#crumb').textContent = cap(page); $('#side').classList.remove('open');
  ({reports, settings, account}[page] || (() => listPage(PAGES[page] ? page : 'orders')))();
  window.scrollTo(0, 0);
}
const head = (t, d, btn = '') => `<div class="head"><div><h1>${t}</h1><p>${d}</p></div>${btn}</div>`;

/* ---------- list pages (Read + filters + pagination) ---------- */
function listPage(k) {
  const p = PAGES[k];
  $('#view').innerHTML = `<section class="card hd"><div class="head"><div><h1><span>${p.icon}</span>${p.title}</h1><p>${p.desc}</p></div>
    <button class="btn dark" data-add="${k}">＋ ${p.add}</button></div>
    <div class="filters"><div><label>Search</label><input id="q" placeholder="Search ${p.title.toLowerCase()}…"></div>` +
    (p.date ? '<div class="dates"><label>Date</label><div><input type="date" id="from"><i>→</i><input type="date" id="to"></div></div>' : '') +
    p.filters.map(([key, label, opts]) => `<div class="ms"><label>${label}</label><button type="button" class="sel" data-ms="${key}">All</button><div class="menu" hidden>` +
      opts.map(o => `<label class="opt"><span>${esc(o)}</span><input type="checkbox" data-m="${key}" value="${esc(o)}"></label>`).join('') + '</div></div>').join('') +
    '</div><div class="chips" id="chips" hidden></div></section><div class="card tablewrap" id="tbl"></div><div class="pager" id="pager"></div>';
  drawTable(k);
}
function drawTable(k) {
  const p = PAGES[k], f = filt.f;
  const all = store(k).filter(r => (!filt.q || JSON.stringify(Object.values(r)).toLowerCase().includes(filt.q)) &&
    Object.entries(f).every(([key, v]) => !v.length || v.includes(r[key])) && (!filt.from || r.date >= filt.from) && (!filt.to || r.date <= filt.to));
  const pages = Math.max(1, Math.ceil(all.length / PAGE)); filt.page = Math.min(filt.page || 1, pages);
  const rows = all.slice((filt.page - 1) * PAGE, filt.page * PAGE);
  $('#tbl').innerHTML = rows.length ?
    `<table><thead><tr>${p.cols.map(c => `<th>${c[0]}</th>`).join('')}<th>Actions</th></tr></thead><tbody>` +
    rows.map(r => `<tr>${p.cols.map(c => `<td>${c[1](r)}</td>`).join('')}<td class="act">
      <button class="ico" title="Edit" data-edit="${k}|${r.id}">✎</button><button class="ico" title="More" data-menu="${k}|${r.id}">⋮</button></td></tr>`).join('') + '</tbody></table>'
    : `<div class="empty">No ${p.title.toLowerCase()} match your filters. Clear them or add a new record.</div>`;
  const L = Object.fromEntries(p.filters.map(x => [x[0], x[1]]));
  const sel = Object.entries(f).flatMap(([key, v]) => v.map(x => [key, x]));
  const ch = $('#chips'); ch.hidden = !sel.length;
  ch.innerHTML = '<span>Filters applied:</span>' + sel.map(([key, v]) => `<button class="chip" data-x="${key}|${esc(v)}">${L[key]}: ${esc(v)} ✕</button>`).join('') + '<button class="link" data-clear>Clear all</button>';
  document.querySelectorAll('[data-ms]').forEach(b => { const n = (f[b.dataset.ms] || []).length; b.textContent = n ? n + ' selected' : 'All'; });
  $('#pager').innerHTML = `<button class="btn sm" data-pg="${filt.page - 1}" ${filt.page < 2 ? 'disabled' : ''}>Previous</button>` +
    Array.from({length: pages}, (_, i) => `<button class="btn sm ${i + 1 === filt.page ? 'cur' : ''}" data-pg="${i + 1}">${i + 1}</button>`).join('') +
    `<button class="btn sm" data-pg="${filt.page + 1}" ${filt.page >= pages ? 'disabled' : ''}>Next</button>`;
}

/* ---------- Create / Update form (modal) ---------- */
function openForm(k, id) {
  const p = PAGES[k], rec = id ? store(k).find(r => r.id === id) : {};
  $('#form').innerHTML = `<h2>${id ? 'Edit' : 'New'} ${p.title.replace(/s$/, '').toLowerCase()}</h2>` +
    p.fields.map(([name, label, type, opts]) => `<div class="row"><label for="f_${name}">${label}</label>` +
      (type === 'select'
        ? `<select id="f_${name}" name="${name}">${opts.map(o => `<option ${rec[name]===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`
        : `<input id="f_${name}" name="${name}" type="${type}" ${type==='number'?'step="any" min="0"':''} value="${esc(rec[name] ?? (type==='date'?new Date().toISOString().slice(0,10):''))}" required>`) +
      '</div>').join('') +
    `<div class="btns"><button type="button" class="btn" id="cancel">Cancel</button><button class="btn dark">Save changes</button></div>`;
  $('#overlay').hidden = false;
  $('#cancel').onclick = () => $('#overlay').hidden = true;
  $('#form').onsubmit = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    p.fields.forEach(([n,, t]) => { if (t === 'number') data[n] = Number(data[n]); });
    // TODO: replace with fetch POST /api/<page> (create) or PUT /api/<page>/<id> (update)
    if (id) Object.assign(rec, data); else store(k).push({id: p.prefix + (++seq), ...data});
    $('#overlay').hidden = true; drawTable(k); toast(id ? 'Changes saved' : p.title.replace(/s$/, '') + ' created');
  };
}

/* ---------- Reports ---------- */
function reports() {
  const spend = {}; db.orders.filter(o => o.status !== 'Cancelled').forEach(o => spend[o.supplier] = (spend[o.supplier] || 0) + o.total);
  const max = Math.max(...Object.values(spend)), total = Object.values(spend).reduce((a, b) => a + b, 0);
  const low = db.products.filter(p => p.stock <= p.reorder);
  const stockValue = db.products.reduce((a, p) => a + p.stock * p.price, 0);
  $('#view').innerHTML = head('Reports', 'A quick look at spending, stock, and orders.') +
    `<div class="stats">${[['Total orders', db.orders.length],['Total spend', money(total)],['Stock value', money(stockValue)],['Low-stock items', low.length]]
      .map(([l, v]) => `<div class="card stat"><small>${l}</small><b>${v}</b></div>`).join('')}</div>
    <div class="two"><div class="card panel"><h3>Spend by supplier</h3>${Object.entries(spend).map(([s, v]) =>
      `<div class="bar"><span>${esc(s)}</span><i style="width:${v / max * 100}%"></i><b>${money(v)}</b></div>`).join('')}</div>
    <div class="card panel"><h3>Needs reordering</h3>${low.length ? low.map(p =>
      `<div class="bar" style="grid-template-columns:1fr auto"><span>${esc(p.name)}</span><b class="low">${p.stock} ${esc(p.unit)} left</b></div>`).join('')
      : '<div class="empty">Every product is above its reorder level.</div>'}</div></div>`;
}

/* ---------- Settings + Account ---------- */
const formCard = (fields, btn) => `<form class="card panel" data-save><div class="formgrid">${fields.map(([l, v, t = 'text']) =>
  `<div><label>${l}</label><input type="${t}" value="${esc(v)}"></div>`).join('')}</div><button class="btn dark">${btn}</button></form>`;
function settings() {
  $('#view').innerHTML = head('Settings', 'Shop details and stock preferences.') +
    formCard([['Shop name','Planet Coffee'],['Currency','USD'],['Default low-stock level','10','number'],['Contact email','shop@planetcoffee.com','email']], 'Save settings');
}
function account() {
  $('#view').innerHTML = head('Account', 'Your profile and password.') +
    formCard([['Full name','Maria Cruz'],['Email','maria@planetcoffee.com','email'],['Role','Store manager'],['New password','','password']], 'Update account');
}

/* ---------- global events ---------- */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; setTimeout(() => t.hidden = true, 2200); }
const rowmenu = $('#rowmenu');
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ms]');
  document.querySelectorAll('.ms .menu').forEach(m => m.hidden = !(b && m.previousElementSibling === b && m.hidden));
  if (e.target.closest('.menu')) return;
  rowmenu.hidden = true;
  const a = e.target.closest('[data-add],[data-edit],[data-del],[data-menu],[data-dup],[data-inv],[data-x],[data-clear],[data-pg]'); if (!a) return;
  const d = a.dataset, k = cur();
  if (d.add) return openForm(d.add);
  if (d.edit) return openForm(...d.edit.split('|'));
  if (d.pg) { filt.page = +d.pg; return drawTable(k); }
  if (d.clear !== undefined) { filt.f = {}; document.querySelectorAll('[data-m]').forEach(c => c.checked = false); return drawTable(k); }
  if (d.x) {
    const [key, v] = d.x.split('|'); filt.f[key] = filt.f[key].filter(x => x !== v);
    const c = [...document.querySelectorAll(`[data-m="${key}"]`)].find(c => c.value === v); if (c) c.checked = false;
    return drawTable(k);
  }
  if (d.menu) {
    const r = a.getBoundingClientRect();
    rowmenu.innerHTML = `<button data-dup="${d.menu}">Duplicate</button>` + (k === 'orders' ? `<button data-inv="${d.menu}">Download invoice</button>` : '') +
      `<button class="del" data-del="${d.menu}">Delete</button>`;
    rowmenu.style.top = r.bottom + scrollY + 4 + 'px'; rowmenu.style.left = r.right + scrollX - 176 + 'px'; rowmenu.hidden = false; return;
  }
  const [kk, id] = (d.dup || d.inv || d.del).split('|');
  if (d.inv) return toast(`Invoice for ${id} downloaded`);
  if (d.dup) { // TODO: replace with fetch POST /api/<page>
    store(kk).push({...store(kk).find(r => r.id === id), id: PAGES[kk].prefix + (++seq)}); drawTable(kk); return toast(id + ' duplicated');
  }
  if (confirm(`Delete ${id}? This can't be undone.`)) { // TODO: replace with fetch DELETE /api/<page>/<id>
    const list = store(kk); list.splice(list.findIndex(r => r.id === id), 1); drawTable(kk); toast(id + ' deleted');
  }
});
document.addEventListener('input', e => {
  if (!['q', 'from', 'to'].includes(e.target.id)) return;
  filt[e.target.id] = e.target.value.toLowerCase(); filt.page = 1; drawTable(cur());
});
document.addEventListener('change', e => {
  const m = e.target.dataset.m; if (!m) return;
  const c = filt.f[m] || []; filt.f[m] = e.target.checked ? [...c, e.target.value] : c.filter(x => x !== e.target.value);
  filt.page = 1; drawTable(cur());
});
document.addEventListener('submit', e => { if (e.target.dataset.save !== undefined) { e.preventDefault(); toast('Changes saved'); } });
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') e.target.hidden = true; });
$('#menu').onclick = () => $('#side').classList.toggle('open');
window.addEventListener('hashchange', route);
route();