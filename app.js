const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroVideos = [document.querySelector('#hero-video'), document.querySelector('#hero-video-next')];
const heroPause = document.querySelector('#hero-pause');
const heroCount = document.querySelector('#hero-count');
const heroFinalFrame = document.querySelector('#hero-final-frame');
const heroClips = ['world', 'hero-autumn', 'hero-tree', 'desert', 'hero-mingjie', 'hero-zigurat', 'hero-stonelion', 'hero-teaser-mosaic'];
const demoFilm = document.querySelector('#demo-film');
const demoFilmPlay = document.querySelector('#demo-film-play');
const previews = [...document.querySelectorAll('.autoplay-preview')];
const cards = [...document.querySelectorAll('button.sample-card, .sample-play')];
const dialog = document.querySelector('#video-dialog');
const fullVideo = document.querySelector('#full-video');
const referenceDialog = document.querySelector('#reference-dialog');
const referenceFull = document.querySelector('#reference-full');
const referenceTitle = document.querySelector('#reference-dialog-title');
const referenceCount = document.querySelector('#reference-dialog-count');
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const narrowScreen = window.matchMedia('(max-width: 700px)');
const conserveData = () => Boolean(connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType));
let activeReferences = [];
let activeReferenceIndex = 0;
let heroManuallyPaused = false;
let heroUserStarted = false;
let heroInView = false;
let heroActive = 0;
let heroClip = 0;
let heroTransitioning = false;
let heroTransitionToken = 0;
let heroRetireTimer;
let heroFinished = false;

function activeHero() {
  return heroVideos[heroActive];
}

function canPlayHero() {
  return !heroFinished && heroInView && !heroManuallyPaused && demoFilm.paused && !document.hidden && !dialog.open && !referenceDialog.open && (!(reducedMotion.matches || conserveData() || narrowScreen.matches) || heroUserStarted);
}

function loadHeroClip(video, index) {
  if (video.dataset.clipIndex === String(index)) return;
  const clip = heroClips[index];
  video.preload = 'auto';
  video.src = `assets/${clip}.mp4`;
  video.poster = `assets/${clip}.jpg`;
  video.dataset.clipIndex = String(index);
  video.load();
}

function releaseHeroClip(video) {
  video.pause();
  video.removeAttribute('src');
  video.preload = 'none';
  delete video.dataset.clipIndex;
  video.load();
}

function prepareNextHero() {
  if (heroClip === heroClips.length - 1) return;
  loadHeroClip(heroVideos[1 - heroActive], (heroClip + 1) % heroClips.length);
}

function syncHeroButton() {
  if (heroFinished) {
    heroPause.setAttribute('aria-label', 'Replay hero sequence');
    heroPause.innerHTML = '↺ <span>Replay</span>';
    return;
  }
  const paused = heroManuallyPaused || (!heroTransitioning && activeHero().paused);
  heroPause.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  heroPause.innerHTML = paused ? '▶ <span>Play motion</span>' : 'Ⅱ <span>Pause motion</span>';
}

function stopHero() {
  ++heroTransitionToken;
  clearTimeout(heroRetireTimer);
  heroTransitioning = false;
  heroVideos.forEach((video, index) => {
    video.pause();
    video.classList.toggle('is-active', index === heroActive);
  });
  releaseHeroClip(heroVideos[1 - heroActive]);
  syncHeroButton();
}

function advanceHero() {
  if (heroTransitioning || !canPlayHero() || heroClip === heroClips.length - 1) return;
  const outgoing = activeHero();
  const incomingIndex = 1 - heroActive;
  const incoming = heroVideos[incomingIndex];
  const nextClip = (heroClip + 1) % heroClips.length;
  const matchCut = nextClip === heroClips.length - 1;
  loadHeroClip(incoming, nextClip);
  heroTransitioning = true;
  const token = ++heroTransitionToken;
  incoming.play().then(() => {
    if (token !== heroTransitionToken || !canPlayHero()) {
      incoming.pause();
      if (token === heroTransitionToken) heroTransitioning = false;
      return;
    }
    if (matchCut) heroVideos.forEach(video => video.classList.add('instant-cut'));
    incoming.classList.add('is-active');
    outgoing.classList.remove('is-active');
    heroActive = incomingIndex;
    heroClip = nextClip;
    heroCount.textContent = `${String(heroClip + 1).padStart(2, '0')} / ${String(heroClips.length).padStart(2, '0')}`;
    syncHeroButton();
    if (matchCut) {
      outgoing.pause();
      heroTransitioning = false;
      return;
    }
    heroRetireTimer = setTimeout(() => {
      if (token !== heroTransitionToken) return;
      outgoing.pause();
      prepareNextHero();
      heroTransitioning = false;
    }, 720);
  }).catch(() => {
    if (token === heroTransitionToken) heroTransitioning = false;
  });
}

function finishHero() {
  heroFinished = true;
  heroFinalFrame.classList.add('is-active');
  heroVideos.forEach(releaseHeroClip);
  syncHeroButton();
}

function replayHero() {
  ++heroTransitionToken;
  clearTimeout(heroRetireTimer);
  heroVideos.forEach(video => {
    video.pause();
    video.classList.remove('is-active', 'instant-cut');
  });
  heroFinalFrame.classList.remove('is-active');
  heroActive = 0;
  heroClip = 0;
  heroFinished = false;
  heroTransitioning = false;
  heroManuallyPaused = false;
  heroUserStarted = true;
  heroCount.textContent = `01 / ${String(heroClips.length).padStart(2, '0')}`;
  loadHeroClip(heroVideos[0], 0);
  heroVideos[0].classList.add('is-active');
  prepareNextHero();
  startHero();
  syncHeroButton();
}

function startHero() {
  if (!canPlayHero()) return;
  loadHeroClip(activeHero(), heroClip);
  prepareNextHero();
  if (activeHero().ended) advanceHero();
  else activeHero().play().catch(() => syncHeroButton());
}

heroVideos.forEach(video => {
  video.addEventListener('play', syncHeroButton);
  video.addEventListener('pause', syncHeroButton);
  video.addEventListener('timeupdate', () => {
    if (video === activeHero() && heroClip < heroClips.length - 2 && Number.isFinite(video.duration) && video.duration - video.currentTime <= .8) advanceHero();
  });
  video.addEventListener('ended', () => {
    if (video !== activeHero()) return;
    if (heroClip === heroClips.length - 1) finishHero();
    else advanceHero();
  });
});
heroPause.addEventListener('click', () => {
  if (heroFinished) {
    replayHero();
    return;
  }
  if (heroManuallyPaused || (!heroTransitioning && activeHero().paused)) {
    heroManuallyPaused = false;
    heroUserStarted = true;
    startHero();
  } else {
    heroManuallyPaused = true;
    stopHero();
  }
  syncHeroButton();
});
syncHeroButton();

demoFilm.addEventListener('play', () => {
  stopHero();
  schedulePreviews();
});
demoFilm.addEventListener('pause', schedulePreviews);
demoFilmPlay.addEventListener('click', async () => {
  demoFilmPlay.disabled = true;
  demoFilmPlay.textContent = 'LOADING';
  if (!demoFilm.src) {
    demoFilm.src = demoFilm.dataset.src;
    demoFilm.load();
  }
  demoFilm.controls = true;
  try {
    await demoFilm.play();
    demoFilmPlay.hidden = true;
  } catch {
    demoFilmPlay.textContent = 'RETRY PLAYBACK';
    demoFilmPlay.disabled = false;
  }
});

function loadPreview(video) {
  if (video.hasAttribute('src') || !video.dataset.src) return;
  video.src = video.dataset.src;
  video.load();
}

function loadPreviewPoster(video) {
  if (!video.dataset.poster) return;
  video.poster = video.dataset.poster;
  delete video.dataset.poster;
}

function releasePreview(video) {
  video.pause();
  if (!video.hasAttribute('src')) return;
  video.removeAttribute('src');
  video.load();
}

function previewIsVisible(video) {
  if (video.closest('[hidden]')) return false;
  const rect = video.getBoundingClientRect();
  let left = Math.max(rect.left, 0);
  let right = Math.min(rect.right, innerWidth);
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, innerHeight);
  const carousel = video.closest('.carousel-viewport');
  if (carousel) {
    const bounds = carousel.getBoundingClientRect();
    left = Math.max(left, bounds.left);
    right = Math.min(right, bounds.right);
  }
  return Math.max(0, right - left) * Math.max(0, bottom - top) >= rect.width * rect.height * .35;
}

let priorityPreview = null;
let previewUpdatePending = false;
function syncPreviews() {
  previewUpdatePending = false;
  const blocked = reducedMotion.matches || conserveData() || dialog.open || referenceDialog.open || document.hidden || !demoFilm.paused;
  const limit = blocked || narrowScreen.matches ? 0 : 2;
  const candidates = limit ? previews.filter(previewIsVisible) : [];
  if (priorityPreview && candidates.includes(priorityPreview)) {
    candidates.splice(candidates.indexOf(priorityPreview), 1);
    candidates.unshift(priorityPreview);
  }
  const chosen = new Set(candidates.slice(0, limit));
  previews.forEach(video => {
    if (chosen.has(video)) {
      loadPreviewPoster(video);
      loadPreview(video);
      if (video.paused) video.play().catch(() => {});
    } else releasePreview(video);
  });
}

function schedulePreviews() {
  if (previewUpdatePending) return;
  previewUpdatePending = true;
  requestAnimationFrame(syncPreviews);
}

previews.forEach(video => {
  const card = video.closest('button, a');
  if (!card) return;
  card.addEventListener('pointerenter', () => { priorityPreview = video; schedulePreviews(); });
  card.addEventListener('pointerleave', () => { if (priorityPreview === video) priorityPreview = null; schedulePreviews(); });
  card.addEventListener('focusin', () => { priorityPreview = video; schedulePreviews(); });
  card.addEventListener('focusout', () => { if (priorityPreview === video) priorityPreview = null; schedulePreviews(); });
});

if ('IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      heroInView = entry.isIntersecting;
      if (!heroInView) stopHero();
      else startHero();
    });
  }, { threshold: .1 });
  heroObserver.observe(document.querySelector('.home-hero'));
  const observer = new IntersectionObserver(schedulePreviews, { threshold: [.1, .5] });
  previews.forEach(video => observer.observe(video));
  const posterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('video[data-poster]').forEach(loadPreviewPoster);
      posterObserver.unobserve(entry.target);
    });
  }, { rootMargin: '600px 0px' });
  document.querySelectorAll('.interactive-showcase, .capability-section').forEach(section => posterObserver.observe(section));
} else {
  heroInView = true;
  previews.forEach(loadPreviewPoster);
  startHero();
}
window.addEventListener('scroll', schedulePreviews, { passive: true });
window.addEventListener('resize', schedulePreviews);
narrowScreen.addEventListener('change', () => {
  if (!canPlayHero()) stopHero();
  else startHero();
  schedulePreviews();
});
reducedMotion.addEventListener('change', () => {
  if (!canPlayHero()) stopHero();
  else startHero();
  schedulePreviews();
});
connection?.addEventListener?.('change', () => {
  if (!canPlayHero()) stopHero();
  else startHero();
  schedulePreviews();
});
schedulePreviews();

document.querySelectorAll('.carousel-viewport').forEach(track => {
  const items = [...track.querySelectorAll('.sample-card')];
  const footer = track.nextElementSibling;
  const count = footer.querySelector('.carousel-count');
  const progress = footer.querySelector('.carousel-progress span');
  const previous = footer.querySelector('[data-slide="-1"]');
  const next = footer.querySelector('[data-slide="1"]');
  let updatePending = false;

  function update() {
    updatePending = false;
    const bounds = track.getBoundingClientRect();
    const visible = items.map((item, index) => ({ index, rect: item.getBoundingClientRect() }))
      .filter(({ rect }) => rect.right > bounds.left + 2 && rect.left < bounds.right - 2);
    if (visible.length) {
      const first = String(visible[0].index + 1).padStart(2, '0');
      const last = String(visible[visible.length - 1].index + 1).padStart(2, '0');
      count.textContent = `${first}–${last} / ${String(items.length).padStart(2, '0')}`;
    }
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    progress.style.width = `${track.scrollWidth ? Math.min(100, 100 * (track.scrollLeft + track.clientWidth) / track.scrollWidth) : 100}%`;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  }

  function scheduleUpdate() {
    if (updatePending) return;
    updatePending = true;
    requestAnimationFrame(update);
  }

  function slide(direction, focusCard = false) {
    if (items.length < 2) return;
    const step = items[1].offsetLeft - items[0].offsetLeft;
    if (!step) return;
    const page = Math.max(1, Math.floor(track.clientWidth / step));
    const current = Math.round(track.scrollLeft / step);
    const target = Math.max(0, Math.min(items.length - 1, current + direction * page));
    track.scrollTo({ left: items[target].offsetLeft - items[0].offsetLeft,
      behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    if (focusCard) (items[target].querySelector('.sample-play') || items[target]).focus({ preventScroll: true });
  }

  previous.addEventListener('click', () => slide(-1));
  next.addEventListener('click', () => slide(1));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      slide(event.key === 'ArrowLeft' ? -1 : 1, true);
    }
  });
  track.addEventListener('scroll', scheduleUpdate, { passive: true });
  track.addEventListener('scroll', schedulePreviews, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();
});

cards.forEach(card => card.addEventListener('click', () => {
  document.querySelector('#video-dialog-title').textContent = card.dataset.title;
  previews.forEach(releasePreview);
  stopHero();
  demoFilm.pause();
  fullVideo.src = `assets/${card.dataset.video}.mp4`;
  fullVideo.setAttribute('aria-label', `${card.dataset.title} full video`);
  fullVideo.load();
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  fullVideo.play().catch(() => {});
}));
function showReference(index) {
  activeReferenceIndex = (index + activeReferences.length) % activeReferences.length;
  const thumb = activeReferences[activeReferenceIndex];
  const caseTitle = thumb.closest('.sample-card').querySelector('.sample-play').dataset.title;
  const title = `${caseTitle} · ${thumb.dataset.referenceLabel}`;
  referenceTitle.textContent = title;
  referenceCount.textContent = `${String(activeReferenceIndex + 1).padStart(2, '0')} / ${String(activeReferences.length).padStart(2, '0')}`;
  referenceFull.src = thumb.dataset.fullSrc;
  referenceFull.alt = title;
}
document.querySelectorAll('.reference-thumb').forEach(thumb => thumb.addEventListener('click', () => {
  activeReferences = [...thumb.parentElement.querySelectorAll('.reference-thumb')];
  showReference(activeReferences.indexOf(thumb));
  previews.forEach(releasePreview);
  stopHero();
  demoFilm.pause();
  referenceDialog.showModal();
  document.body.style.overflow = 'hidden';
}));
document.querySelector('#reference-prev').addEventListener('click', () => showReference(activeReferenceIndex - 1));
document.querySelector('#reference-next').addEventListener('click', () => showReference(activeReferenceIndex + 1));
document.querySelector('#close-reference-dialog').addEventListener('click', () => referenceDialog.close());
referenceDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showReference(activeReferenceIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
referenceDialog.addEventListener('click', event => {
  if (event.target === referenceDialog) {
    const rect = referenceDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) referenceDialog.close();
  }
});
function resumeBackground() {
  if (document.hidden || dialog.open || referenceDialog.open) return;
  startHero();
  schedulePreviews();
}
referenceDialog.addEventListener('close', () => {
  referenceFull.removeAttribute('src');
  document.body.style.overflow = '';
  resumeBackground();
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => {
  fullVideo.pause();
  fullVideo.removeAttribute('src');
  fullVideo.load();
  document.body.style.overflow = '';
  resumeBackground();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopHero();
    demoFilm.pause();
    previews.forEach(releasePreview);
    fullVideo.pause();
  } else resumeBackground();
});
