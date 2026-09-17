const heroVideo=document.querySelector('#hero-video');
const heroPause=document.querySelector('#hero-pause');
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){heroVideo.removeAttribute('autoplay');heroVideo.pause();}
function updateHeroPause(){heroPause.setAttribute('aria-label',heroVideo.paused?'Play background video':'Pause background video');heroPause.innerHTML=heroVideo.paused?'▶ <span>Play motion</span>':'Ⅱ <span>Pause motion</span>';}
heroVideo.addEventListener('play',updateHeroPause);heroVideo.addEventListener('pause',updateHeroPause);updateHeroPause();
heroPause.addEventListener('click',()=>{if(heroVideo.paused)heroVideo.play().catch(()=>{});else heroVideo.pause();});

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const modes={
  camera:{src:'world',label:'CAMERA TRAJECTORY',title:'Choose where the world takes you.',description:'Camera trajectories guide viewpoint motion through the generated world. Follow the character into a vast ringworld.',control:'<span class="small-label">SELECTED DEMONSTRATION</span><div class="control-value"><span class="control-icon" aria-hidden="true">↗</span> Forward exploration</div><span class="control-detail">Ringworld / camera-conditioned rollout</span>'},
  language:{src:'language',label:'LANGUAGE EVENT',title:'Change the story with a few words.',description:'Language events introduce semantic changes as the world unfolds. In this sample, the scene transitions from day to night.',control:'<span class="small-label">SELECTED EVENT</span><div class="control-value"><span class="control-icon" aria-hidden="true">T</span> Day becomes night</div><span class="control-detail">A change in the world, guided by language</span>'},
  reference:{src:'reference',label:'VISUAL REFERENCES',title:'Bring a character. Imagine a setting.',description:'Visual inputs specify the character and the scene. Here, two references guide an armored character through an anime metropolis.',control:'<span class="small-label">INPUT REFERENCES</span><div class="ref-inputs"><img src="assets/reference-1.jpg" alt="Character reference: an armored knight"><span>+</span><img src="assets/reference-2.jpg" alt="Scene reference: a neon anime metropolis"></div><span class="control-detail">Character + scene → generated exploration</span>'}
};
const tabs=[...document.querySelectorAll('[role="tab"]')];
const demoVideo=document.querySelector('#demo-video');
function loadClip(video,source,label,play=true){video.pause();video.poster=`assets/${source}.jpg`;video.src=`assets/${source}.mp4`;video.setAttribute('aria-label',label);video.load();if(play&&!reducedMotion.matches)video.play().catch(()=>{});}
function selectMode(tab){const mode=modes[tab.dataset.mode];tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});document.querySelector('#demo-panel').setAttribute('aria-labelledby',tab.id);document.querySelector('#mode-label').textContent=mode.label;document.querySelector('#mode-title').textContent=mode.title;document.querySelector('#mode-description').textContent=mode.description;document.querySelector('#control-preview').innerHTML=mode.control;loadClip(demoVideo,mode.src,`${mode.label} research demonstration`);}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectMode(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();tabs[next].focus();selectMode(tabs[next]);}});});
const actionVideo=document.querySelector('#action-video');
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.action;document.querySelectorAll('[data-action]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});document.querySelector('#action-caption').textContent=`Selected outcome: ${action} the cow.`;loadClip(actionVideo,action,`${action} the cow research demonstration`);}));
const worldDialog=document.querySelector('#world-dialog');const worldVideo=document.querySelector('#world-video');
const worldTitles={world:'Beyond the horizon',desert:'A world unearthed',ink:'Reality, reinterpreted'};
document.querySelectorAll('[data-world]').forEach(button=>button.addEventListener('click',()=>{const world=button.dataset.world;document.querySelector('#world-dialog-title').textContent=worldTitles[world];worldDialog.showModal();document.body.style.overflow='hidden';loadClip(worldVideo,world,worldTitles[world]);}));
document.querySelector('#close-dialog').addEventListener('click',()=>worldDialog.close());
worldDialog.addEventListener('click',event=>{if(event.target===worldDialog){const rect=worldDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)worldDialog.close();}});
worldDialog.addEventListener('close',()=>{worldVideo.pause();document.body.style.overflow='';});
const allVideos=[...document.querySelectorAll('video')];
allVideos.forEach(video=>{video.addEventListener('play',()=>{if(video!==heroVideo)allVideos.filter(v=>v!==video).forEach(v=>v.pause());});video.addEventListener('error',()=>{let note=video.parentElement.querySelector('.media-error');if(!note){note=document.createElement('p');note.className='media-error';note.setAttribute('role','status');note.textContent='This video could not be loaded. Please reload the page to try again.';video.insertAdjacentElement('afterend',note);}});});
const visibilityObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)entry.target.pause();}),{threshold:.05});allVideos.forEach(video=>visibilityObserver.observe(video));
document.addEventListener('visibilitychange',()=>{if(document.hidden)allVideos.forEach(v=>v.pause());});
document.querySelector('.hero-paper').addEventListener('click',()=>{document.querySelector('.paper').open=true;});
