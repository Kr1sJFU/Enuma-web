(() => {
  const data = window.ENUMA_BENCH;
  const head = document.querySelector('#leaderboard-head');
  const body = document.querySelector('#leaderboard-body');
  const table = document.querySelector('#leaderboard-table');
  const status = document.querySelector('#table-status');
  let view = 'all';
  let sortMetric = null;
  function el(tag, text, className) { const node = document.createElement(tag); if(text !== undefined) node.textContent = text; if(className) node.className = className; return node; }
  function score(model, metric) { const value = model.scores[metric]; return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null; }
  function renderTable() {
    const categories = data.categories.filter(c => view === 'all' || c.group === view);
    if(!categories.some(c => c.id === sortMetric)) sortMetric = null;
    head.replaceChildren(); body.replaceChildren(); table.classList.toggle('metric-subset', view !== 'all');
    const groupRow = el('tr'); const modelHead = el('th','Model','model-col'); modelHead.rowSpan = 2; modelHead.scope = 'col'; groupRow.append(modelHead);
    for(const [id,label] of [['interactive','Interactive world modeling'],['reference','Visual-reference interaction']]) {
      const columns = categories.filter(c => c.group === id);
      if(columns.length) { const th = el('th',label,'metric-group'+(id==='reference' && view==='all'?' metric-divider':'')); th.colSpan = columns.length; th.scope = 'colgroup'; groupRow.append(th); }
    }
    const metricRow = el('tr');
    categories.forEach((c,i) => {
      const th = el('th',undefined,i===3?'metric-divider':''); th.scope = 'col';
      const button = el('button',c.short+(sortMetric === c.id?' ↓':''),'column-sort');
      button.disabled = !data.models.some(m => score(m,c.id) !== null);
      button.setAttribute('aria-label',`Sort by ${c.label}, highest first`);
      button.title = button.disabled ? 'Scores have not yet been reported' : `Sort by ${c.label}`;
      th.setAttribute('aria-sort',sortMetric===c.id?'descending':'none');
      button.addEventListener('click',() => {sortMetric=c.id;renderTable();}); th.append(button);metricRow.append(th);
    });
    head.append(groupRow,metricRow);
    const models = [...data.models];
    if(sortMetric) models.sort((a,b)=>(score(b,sortMetric)??-1)-(score(a,sortMetric)??-1));
    models.forEach(model => {
      const row = el('tr',undefined,model.ours?'our-model':''); const th=el('th',model.name);th.scope='row';
      if(model.ours) th.append(el('span','Ours','ours-label'));row.append(th);
      categories.forEach((c,i) => {const value=score(model,c.id);const td=el('td',value===null?'—':value.toFixed(1),`score-cell${value===null?' pending':''}${i===3?' metric-divider':''}`);if(value===null)td.setAttribute('aria-label',`${c.label}: not yet reported`);row.append(td);});body.append(row);
    });
    const reported = data.models.some(m=>data.categories.some(c=>score(m,c.id)!==null));
    status.textContent=sortMetric?`Sorted by ${data.categories.find(c=>c.id===sortMetric).label}, highest first. Missing results appear last.`:reported?'Select a metric to sort reported results. Missing scores are not treated as zero.':'Unranked preview. Methods follow the draft report; scores have not been released.';
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderTable();}));
  renderTable();

  const grid = document.querySelector('#case-grid'); const filters = document.querySelector('#gallery-filters'); const empty = document.querySelector('#gallery-empty');
  const dialog=document.querySelector('#case-dialog'); const video=document.querySelector('#case-video'); const error=document.querySelector('#case-media-error');
  function openExample(example) {
    const category=data.categories.find(c=>c.id===example.category);
    document.querySelector('#case-title').textContent=example.title;document.querySelector('#case-category').textContent=category.label;document.querySelector('#case-description').textContent=example.description;
    error.hidden=true;video.pause();video.poster=`../assets/${example.asset}.jpg`;video.src=`../assets/${example.asset}.mp4`;video.setAttribute('aria-label',example.title);video.load();dialog.showModal();document.body.style.overflow='hidden';
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)video.play().catch(()=>{});
  }
  function renderGallery(category='all') {
    const examples=data.examples.filter(e=>category==='all'||e.category===category);grid.replaceChildren();empty.hidden=examples.length>0;
    [...filters.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
    document.querySelector('#gallery-count').textContent=`${examples.length} preview${examples.length===1?'':'s'}`;
    if(!examples.length)document.querySelector('#empty-description').textContent=`${data.categories.find(c=>c.id===category).label} examples will appear here with the benchmark release.`;
    examples.forEach(example=>{
      const card=el('button',undefined,'case-card');card.setAttribute('aria-label',`Open ${example.title}`);const frame=el('div',undefined,'case-image');const img=el('img');img.src=`../assets/${example.asset}.jpg`;img.alt=example.title;img.width=1248;img.height=720;img.loading='lazy';frame.append(img,el('span','Illustrative demo','preview-badge'));const play=el('span','▶','round-play');play.setAttribute('aria-hidden','true');frame.append(play);
      const meta=el('div',undefined,'case-meta');const details=el('div');details.append(el('h3',example.title),el('span',data.categories.find(c=>c.id===example.category).label,'small-label'));const arrow=el('span','↗');arrow.setAttribute('aria-hidden','true');meta.append(details,arrow);card.append(frame,meta);card.addEventListener('click',()=>openExample(example));grid.append(card);
    });
  }
  [{id:'all',label:'All categories'},...data.categories].forEach(category=>{const button=el('button',category.label);button.dataset.category=category.id;button.setAttribute('aria-pressed',String(category.id==='all'));button.addEventListener('click',()=>renderGallery(category.id));filters.append(button);});renderGallery();
  document.querySelector('#reset-gallery').addEventListener('click',()=>{renderGallery();filters.firstElementChild.focus();});
  data.categories.forEach((category,i)=>{const card=el('article',undefined,'category-item');card.append(el('span',String(i+1).padStart(2,'0')),el('h3',category.label),el('p',category.description));document.querySelector('#category-grid').append(card);});
  document.querySelector('#close-case').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{video.pause();document.body.style.overflow='';});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  video.addEventListener('error',()=>{error.hidden=false;});document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
})();
