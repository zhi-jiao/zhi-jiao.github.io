'use strict';

const root = document.documentElement;
const languageButton = document.querySelector('.language-toggle');
const progressBar = document.querySelector('.scroll-progress span');
const revealItems = document.querySelectorAll('[data-reveal]');
const photoButton = document.querySelector('.profile-photo-button');
const photoNote = document.querySelector('.photo-note');
const creeperLayer = document.querySelector('.creeper-pet-layer');
const creeperButton = document.querySelector('.creeper-pet');
const creeperBubble = document.querySelector('.creeper-bubble');
const creeperCanvas = document.querySelector('.creeper-canvas');
const threeModuleUrl = new URL('three.module.js', document.currentScript.src).href;
let creeper3dKick = () => {};

function setLanguage(language) {
  const english = language === 'en';
  root.lang = english ? 'en' : 'zh-CN';
  document.title = english ? root.dataset.titleEn : root.dataset.titleZh;
  languageButton.setAttribute('aria-label', english ? '切换为中文' : 'Switch to English');
}

let language = 'zh';
try { language = localStorage.getItem('profile-language') === 'en' ? 'en' : 'zh'; } catch (_) {}
setLanguage(language);
languageButton.addEventListener('click', () => {
  const selected = root.lang === 'en' ? 'zh' : 'en';
  setLanguage(selected);
  try { localStorage.setItem('profile-language', selected); } catch (_) {}
});

let photoNoteTimer;
function greetFromPhoto() {
  const message = root.lang === 'en' ? 'Hello, welcome.' : '你好，欢迎来到我的主页。';
  photoNote.textContent = message;
  photoButton.classList.remove('is-greeting');
  window.requestAnimationFrame(() => photoButton.classList.add('is-greeting'));
  window.clearTimeout(photoNoteTimer);
  photoNoteTimer = window.setTimeout(() => {
    photoNote.textContent = '';
    photoButton.classList.remove('is-greeting');
  }, 2400);
}
photoButton.addEventListener('click', greetFromPhoto);

let creeperDragging = false;
let creeperMoved = false;
let creeperStartX = 0;
let creeperStartY = 0;
let creeperStartLeft = 0;
let creeperStartTop = 0;
let creeperBubbleTimer;

function showCreeperMessage() {
  creeperBubble.textContent = root.lang === 'en' ? 'Sss... hello!' : '嘶……你好！';
  creeperBubble.classList.add('is-visible');
  window.clearTimeout(creeperBubbleTimer);
  creeperBubbleTimer = window.setTimeout(() => creeperBubble.classList.remove('is-visible'), 2200);
  creeper3dKick();
}

async function initThreeCreeper() {
  let renderer;
  try {
    const THREE = await import(threeModuleUrl);
    renderer = new THREE.WebGLRenderer({ canvas: creeperCanvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2, 2, 2.5, -2.5, 0.1, 100);
    // A modest three-quarter angle keeps the face readable while exposing the
    // head depth and the staggered feet as real 3D geometry.
    camera.position.set(3.2, 2.0, 8);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x46523c, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(-3, 4, 5);
    scene.add(keyLight);

    // Original procedural pixel skin. Dimensions follow the 8/12/6 voxel anatomy.
    function skin(width, height, seed, withFace = false) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const palette = ['#548e3f', '#619e47', '#74aa52', '#80b35d', '#63964c', '#457438'];
      let random = seed;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
          // Use the high bits: the low LCG bits repeat in visible stripes.
          ctx.fillStyle = palette[(random >>> 24) % palette.length];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      if (withFace) {
        // 8×8 face: square eyes, central nose, and an open-bottom frown.
        ctx.fillStyle = '#142010';
        [[1, 2, 2, 2], [5, 2, 2, 2], [3, 4, 2, 1],
          [2, 5, 4, 2], [2, 7, 1, 1], [5, 7, 1, 1]].forEach(r => ctx.fillRect(...r));
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      return new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 });
    }
    function materials(w, h, d, seed, face = false) {
      return [[d,h], [d,h], [w,d], [w,d], [w,h], [w,h]].map(([x,y], i) =>
        skin(x, y, seed + i, face && i === 4));
    }
    const unit = 0.14;
    const head = new THREE.Mesh(new THREE.BoxGeometry(8*unit, 8*unit, 8*unit), materials(8,8,8,31,true));
    head.position.y = 9*unit;
    const body = new THREE.Mesh(new THREE.BoxGeometry(8*unit, 12*unit, 4*unit), materials(8,12,4,71));
    body.position.y = -unit;
    const pet = new THREE.Group();
    pet.add(head, body);
    const legGeometry = new THREE.BoxGeometry(4*unit, 6*unit, 4*unit);
    const legs = [];
    // Small gaps distinguish all four feet at pet size. The inner/top edges
    // overlap the torso slightly, so the legs stay attached during the greeting.
    [[-2.1,-3], [2.1,-3], [-2.1,3], [2.1,3]].forEach(([x, z], index) => {
      const pivot = new THREE.Group();
      pivot.position.set(x*unit, -6.7*unit, z*unit);
      const leg = new THREE.Mesh(legGeometry, materials(4,6,4,110+index*6));
      leg.position.y = -3*unit;
      pivot.add(leg);
      legs.push(pivot);
      pet.add(pivot);
    });
    pet.rotation.y = -0.12;
    scene.add(pet);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let greetingStart = -Infinity;
    let frame = 0;
    creeper3dKick = () => {
      greetingStart = performance.now();
      schedule();
    };

    function resize() {
      const rect = creeperCanvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.left = -2.5 * width / height;
      camera.right = 2.5 * width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    new ResizeObserver(resize).observe(creeperCanvas);
    resize();
    // Hide the fallback only after a successful WebGL frame.
    renderer.render(scene, camera);
    creeperLayer.classList.add('is-3d');
    creeperLayer.dataset.renderer = 'webgl';
    function animate(time) {
      frame = 0;
      if (document.hidden) return;
      const seconds = time * 0.001;
      const elapsed = (time - greetingStart) / 1000;
      const greeting = !reducedMotion.matches && elapsed >= 0 && elapsed < 0.65;
      pet.rotation.y = -0.12 + (reducedMotion.matches ? 0 : Math.sin(seconds * 0.8) * 0.10);
      pet.position.y = greeting ? Math.sin(elapsed / 0.65 * Math.PI) * 0.22 : 0;
      head.rotation.x = greeting ? Math.sin(elapsed / 0.65 * Math.PI) * 0.10 : 0;
      legs.forEach((leg, i) => { leg.rotation.x = greeting ? Math.sin(elapsed / 0.65 * Math.PI) * (i === 0 || i === 3 ? 0.16 : -0.16) : 0; });
      renderer.render(scene, camera);
      if (!reducedMotion.matches) schedule();
    }
    function schedule() {
      if (!frame && !document.hidden) frame = window.requestAnimationFrame(animate);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    });
    reducedMotion.addEventListener('change', schedule);
    schedule();
  } catch (error) {
    renderer?.dispose();
    creeperLayer.classList.remove('is-3d');
    creeperLayer.dataset.renderer = 'css-fallback';
    console.warn('Creeper 3D initialization failed; using CSS fallback.', error);
  }
}

initThreeCreeper();

function restoreCreeperPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem('creeper-position'));
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      creeperLayer.style.left = `${saved.left}px`;
      creeperLayer.style.top = `${saved.top}px`;
      creeperLayer.style.right = 'auto';
      creeperLayer.style.bottom = 'auto';
    }
  } catch (_) {}
}

function keepCreeperInBounds() {
  const rect = creeperLayer.getBoundingClientRect();
  const margin = 12;
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
  const left = Math.min(Math.max(rect.left, margin), maxLeft);
  const top = Math.min(Math.max(rect.top, margin), maxTop);
  creeperLayer.style.left = `${left}px`;
  creeperLayer.style.top = `${top}px`;
  creeperLayer.style.right = 'auto';
  creeperLayer.style.bottom = 'auto';
}

creeperButton.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  creeperDragging = true;
  creeperMoved = false;
  creeperStartX = event.clientX;
  creeperStartY = event.clientY;
  const rect = creeperLayer.getBoundingClientRect();
  creeperStartLeft = rect.left;
  creeperStartTop = rect.top;
  creeperButton.setPointerCapture(event.pointerId);
  creeperLayer.classList.add('is-dragging');
  event.preventDefault();
});

creeperButton.addEventListener('pointermove', event => {
  if (!creeperDragging) return;
  const dx = event.clientX - creeperStartX;
  const dy = event.clientY - creeperStartY;
  creeperMoved = creeperMoved || Math.abs(dx) > 4 || Math.abs(dy) > 4;
  creeperLayer.style.left = `${creeperStartLeft + dx}px`;
  creeperLayer.style.top = `${creeperStartTop + dy}px`;
  creeperLayer.style.right = 'auto';
  creeperLayer.style.bottom = 'auto';
  keepCreeperInBounds();
});

creeperButton.addEventListener('pointerup', event => {
  if (!creeperDragging) return;
  creeperDragging = false;
  creeperLayer.classList.remove('is-dragging');
  try { creeperButton.releasePointerCapture(event.pointerId); } catch (_) {}
  if (creeperMoved) {
    const rect = creeperLayer.getBoundingClientRect();
    try { localStorage.setItem('creeper-position', JSON.stringify({ left: rect.left, top: rect.top })); } catch (_) {}
  } else {
    showCreeperMessage();
  }
});

window.addEventListener('resize', () => {
  if (creeperLayer.style.left) keepCreeperInBounds();
}, { passive: true });
restoreCreeperPosition();
keepCreeperInBounds();

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  progressBar.style.transform = `scaleX(${progress})`;
}

function revealImmediately() {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealImmediately();
}

let scrollTick = false;
window.addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = true;
  window.requestAnimationFrame(() => {
    updateScrollProgress();
    scrollTick = false;
  });
}, { passive: true });
window.addEventListener('resize', updateScrollProgress, { passive: true });
updateScrollProgress();
root.classList.add('js');
