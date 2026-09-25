const video = document.getElementById('demo-video');
const stage = document.getElementById('video-stage');
const hotspot = document.getElementById('scene-hotspot');
const stepNumber = document.getElementById('step-number');
const stepLabel = document.getElementById('step-label');
const actionButton = document.getElementById('continue-button');
const actionKey = document.getElementById('action-key');
const actionLabel = document.getElementById('action-label');
const announcer = document.getElementById('announcer');
const timeline = [...document.querySelectorAll('[data-chapter]')];

// Three complete 129-frame turns at 16 fps.
const chapters = [
  { start: 0, end: 8.0625, label: 'Approach the brazier', action: 'APPROACH', key: 'W', hotspot: null },
  { start: 8.0625, end: 16.125, label: 'Light the brazier', action: 'CAST', key: 'E', hotspot: 'is-brazier' },
  { start: 16.125, end: 24.1875, label: 'Step into daylight', action: 'STEP BACK', key: 'S', hotspot: null },
];

let chapterIndex = 0;
let mode = 'waiting';
let frameRequest = null;
let animationRequest = null;
let jumpToken = 0;

function cancelChecks() {
  if (frameRequest !== null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
  if (animationRequest !== null) cancelAnimationFrame(animationRequest);
  frameRequest = null;
  animationRequest = null;
}

function updateTimeline(time) {
  timeline.forEach((item, index) => {
    const chapter = chapters[index];
    const fraction = Math.min(1, Math.max(0, (time - chapter.start) / (chapter.end - chapter.start)));
    item.querySelector('.timeline-bar > span').style.transform = `scaleX(${fraction})`;
    item.classList.toggle('is-current', index === chapterIndex && mode !== 'complete');
    item.classList.toggle('is-complete', index < chapterIndex || mode === 'complete');
    if (index === chapterIndex && mode !== 'complete') item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
}

function render() {
  const chapter = chapters[chapterIndex];
  stage.dataset.stage = String(chapterIndex);
  stage.dataset.mode = mode;
  stepNumber.textContent = `${String(chapterIndex + 1).padStart(2, '0')} / 03`;
  stepLabel.textContent = mode === 'complete' ? 'Complete' : chapter.label;
  actionKey.textContent = mode === 'complete' ? '↺' : chapter.key;
  actionLabel.textContent = mode === 'complete' ? 'REPLAY' : mode === 'playing' ? 'PLAYING' : chapter.action;
  actionButton.disabled = mode === 'playing';
  actionButton.setAttribute('aria-label', mode === 'complete' ? 'Replay experience' : chapter.label);
  hotspot.className = `hotspot ${chapter.hotspot || ''}`;
  hotspot.setAttribute('aria-label', chapter.label);
  hotspot.hidden = mode !== 'waiting' || !chapter.hotspot;
  updateTimeline(mode === 'complete' ? chapters.at(-1).end : video.currentTime || chapter.start);
}

function pauseAtBoundary(time = video.currentTime) {
  if (mode !== 'playing' || chapterIndex === chapters.length - 1) return;
  if (time < chapters[chapterIndex].end - 0.012) return;
  video.pause();
  cancelChecks();
  chapterIndex += 1;
  mode = 'waiting';
  video.currentTime = chapters[chapterIndex].start;
  render();
  announcer.textContent = `${chapters[chapterIndex].label}. Press ${chapters[chapterIndex].key} or use the action button.`;
}

function onVideoFrame(_now, metadata) {
  frameRequest = null;
  if (mode !== 'playing') return;
  updateTimeline(metadata.mediaTime);
  pauseAtBoundary(metadata.mediaTime);
  scheduleCheck();
}

function onAnimationFrame() {
  animationRequest = null;
  if (mode !== 'playing') return;
  updateTimeline(video.currentTime);
  pauseAtBoundary();
  scheduleCheck();
}

function scheduleCheck() {
  if (mode !== 'playing') return;
  if (video.requestVideoFrameCallback) {
    if (frameRequest === null) frameRequest = video.requestVideoFrameCallback(onVideoFrame);
  } else if (animationRequest === null) {
    animationRequest = requestAnimationFrame(onAnimationFrame);
  }
}

async function advance() {
  if (mode === 'complete') return reset();
  if (mode !== 'waiting') return;
  const token = jumpToken;
  mode = 'playing';
  render();
  try {
    await video.play();
    if (token === jumpToken && mode === 'playing') scheduleCheck();
  } catch {
    if (token !== jumpToken) return;
    mode = 'waiting';
    render();
    announcer.textContent = 'Playback could not start. Try the action button again.';
  }
}

function reset() {
  jumpToken += 1;
  video.pause();
  cancelChecks();
  video.currentTime = 0;
  chapterIndex = 0;
  mode = 'waiting';
  render();
  announcer.textContent = 'Restarted. Press W or use the action button.';
}

function jumpToChapter(index) {
  const token = ++jumpToken;
  video.pause();
  cancelChecks();
  chapterIndex = index;
  mode = 'waiting';
  video.currentTime = chapters[index].start;
  render();
  announcer.textContent = `Playing turn ${index + 1}: ${chapters[index].label}.`;
  const playSelected = () => {
    if (token === jumpToken) advance();
  };
  if (video.seeking) video.addEventListener('seeked', playSelected, { once: true });
  else playSelected();
}

actionButton.addEventListener('click', advance);
hotspot.addEventListener('click', advance);
document.getElementById('reset-button').addEventListener('click', reset);
timeline.forEach((item, index) => item.addEventListener('click', () => jumpToChapter(index)));
video.addEventListener('timeupdate', () => pauseAtBoundary());
video.addEventListener('ended', () => {
  cancelChecks();
  chapterIndex = chapters.length - 1;
  mode = 'complete';
  render();
  announcer.textContent = 'Complete. Replay is available.';
});
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (key === 'r' && !event.metaKey && !event.ctrlKey) return reset();
  if (event.repeat || ['BUTTON', 'A', 'INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  if (key === chapters[chapterIndex].key.toLowerCase() || key === ' ' || key === 'enter') {
    event.preventDefault();
    advance();
  }
});
render();
