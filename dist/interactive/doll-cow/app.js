const video = document.querySelector('#cow-video');
const decisionFrame = document.querySelector('#decision-frame');
const startButton = document.querySelector('#start-button');
const options = document.querySelector('#branch-options');
const chooseAgainButton = document.querySelector('#choose-again');
const resetButton = document.querySelector('#reset-button');
const phaseIndex = document.querySelector('#phase-index');
const phaseLabel = document.querySelector('#phase-label');
const announcer = document.querySelector('#announcer');
const branchButtons = [...options.querySelectorAll('[data-branch]')];
const branchNames = { pat: 'Pat', lift: 'Lift', drag: 'Drag' };
let phase = 'ready';
let selectedBranch = null;
let requestToken = 0;

function render() {
  startButton.hidden = phase !== 'ready';
  options.hidden = phase !== 'choice';
  chooseAgainButton.hidden = phase !== 'complete';
  phaseIndex.textContent = phase === 'ready' || phase === 'arrival' ? '01 / 02' : '02 / 02';
  phaseLabel.textContent = {
    ready: 'Enter the scene', arrival: 'The cow appears', choice: 'Choose an action',
    branch: `${branchNames[selectedBranch]} the cow`, complete: `${branchNames[selectedBranch]} · complete`,
  }[phase];
}

async function playClip(src, nextPhase) {
  const token = ++requestToken;
  video.pause();
  video.src = src;
  video.load();
  phase = nextPhase;
  render();
  try {
    await video.play();
    if (token === requestToken) decisionFrame.hidden = true;
  } catch {
    if (token !== requestToken) return;
    phase = nextPhase === 'arrival' ? 'ready' : 'choice';
    render();
    announcer.textContent = 'Playback could not start. Please try again.';
  }
}

function start() {
  if (phase !== 'ready') return;
  selectedBranch = null;
  playClip('../../assets/cow-event.mp4', 'arrival');
  announcer.textContent = 'The shared scene is playing.';
}

function choose(branch) {
  if (phase !== 'choice' || !branchNames[branch]) return;
  selectedBranch = branch;
  playClip(`../../assets/${branch}.mp4`, 'branch');
  announcer.textContent = `${branchNames[branch]} branch playing.`;
}

function chooseAgain() {
  if (phase !== 'complete') return;
  video.pause();
  decisionFrame.hidden = false;
  selectedBranch = null;
  phase = 'choice';
  render();
  announcer.textContent = 'Choose another action: Pat, Lift, or Drag.';
}

function reset() {
  ++requestToken;
  video.pause();
  video.removeAttribute('src');
  video.load();
  decisionFrame.hidden = true;
  selectedBranch = null;
  phase = 'ready';
  render();
  announcer.textContent = 'Scene restarted.';
}

video.addEventListener('ended', () => {
  if (phase === 'arrival') {
    decisionFrame.hidden = false;
    phase = 'choice';
    render();
    announcer.textContent = 'Choose an action: Pat, Lift, or Drag. Press 1, 2, or 3.';
  } else if (phase === 'branch') {
    phase = 'complete';
    render();
    announcer.textContent = `${branchNames[selectedBranch]} complete. Choose again to explore another branch.`;
  }
});

startButton.addEventListener('click', start);
branchButtons.forEach(button => button.addEventListener('click', () => choose(button.dataset.branch)));
chooseAgainButton.addEventListener('click', chooseAgain);
resetButton.addEventListener('click', reset);
document.addEventListener('keydown', event => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  if (['BUTTON', 'A'].includes(document.activeElement?.tagName)) return;
  if (event.key.toLowerCase() === 'r') return reset();
  if (phase === 'ready' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    start();
  } else if (phase === 'choice' && ['1', '2', '3'].includes(event.key)) {
    choose(({ '1': 'pat', '2': 'lift', '3': 'drag' })[event.key]);
  }
});
render();
