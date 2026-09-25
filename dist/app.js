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
let activeReferences = [];
let activeReferenceIndex = 0;
let heroManuallyPaused = false;
let heroUserStarted = false;
let heroInView = true;
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
  return !heroFinished && heroInView && !heroManuallyPaused && demoFilm.paused && !document.hidden && !dialog.open && !referenceDialog.open && (!reducedMotion.matches || heroUserStarted);
}

function loadHeroClip(video, index) {
  if (video.dataset.clipIndex === String(index)) return;
  const clip = heroClips[index];
  video.src = `assets/${clip}.mp4`;
  video.poster = `assets/${clip}.jpg`;
  video.dataset.clipIndex = String(index);
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
  prepareNextHero();
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
  if (activeHero().ended) advanceHero();
  else activeHero().play().catch(() => syncHeroButton());
}

heroVideos[0].dataset.clipIndex = '0';
prepareNextHero();
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
startHero();

demoFilm.addEventListener('play', () => {
  stopHero();
  previews.forEach(video => video.pause());
});
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
  if (video.src || !video.dataset.src) return;
  video.src = video.dataset.src;
  video.load();
}
function playPreview(video) {
  if (reducedMotion.matches || dialog.open || referenceDialog.open || document.hidden || !demoFilm.paused || video.closest('[hidden]')) return;
  const rect = video.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return;
  const carousel = video.closest('.carousel-viewport');
  if (carousel) {
    const bounds = carousel.getBoundingClientRect();
    if (rect.right <= bounds.left || rect.left >= bounds.right) return;
  }
  loadPreview(video);
  video.play().catch(() => {});
}
if ('IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      heroInView = entry.isIntersecting;
      if (!heroInView) stopHero();
      else startHero();
    });
  }, { threshold: .1 });
  heroObserver.observe(document.querySelector('.home-hero'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) playPreview(entry.target);
      else entry.target.pause();
    });
  }, { rootMargin: '100px 0px', threshold: .1 });
  previews.forEach(video => observer.observe(video));
} else {
  previews.forEach(playPreview);
}

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
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();
});

cards.forEach(card => card.addEventListener('click', () => {
  document.querySelector('#video-dialog-title').textContent = card.dataset.title;
  previews.forEach(video => video.pause());
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
  previews.forEach(video => video.pause());
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
  previews.forEach(video => {
    const rect = video.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) playPreview(video);
  });
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
    previews.forEach(video => video.pause());
    fullVideo.pause();
  } else resumeBackground();
});
