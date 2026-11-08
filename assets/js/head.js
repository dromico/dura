/* Head-tracked parallax for the hero room.
   Wraps the room camera (window.__room, set by room.js) and nudges it
   according to the viewer's head (webcam), device tilt, or mouse.
   Webcam is opt-in: nothing loads or asks permission until the button is pressed. */
(() => {
  const hero = document.querySelector('[data-room]');
  if (!hero) return;

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COARSE = matchMedia('(pointer: coarse)').matches;
  // How far the camera slides in the room (world units, roughly metres).
  const AMP = { x: 0.55, y: 0.25, z: 0.6 };
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

  const target = { x: 0, y: 0, z: 0 };
  const now = { x: 0, y: 0, z: 0 };
  let source = REDUCED ? 'off' : 'pointer'; // off | pointer | tilt | head
  let room = null, lastE = 0, raf = 0;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function hook() {
    room = window.__room;
    if (!room) return false;
    const orig = room.setCamera.bind(room);
    room.setCamera = function (e) {
      lastE = e;
      orig(e);
      if (Math.abs(now.x) + Math.abs(now.y) + Math.abs(now.z) < 1e-4) return;
      const c = this.camera, V = c.position.constructor;
      const right = new V(1, 0, 0).applyQuaternion(c.quaternion);
      const up = new V(0, 1, 0).applyQuaternion(c.quaternion);
      const fwd = new V(0, 0, -1).applyQuaternion(c.quaternion);
      const focus = c.position.clone().addScaledVector(fwd, 3); // keep looking at the same spot
      c.position
        .addScaledVector(right, now.x * AMP.x)
        .addScaledVector(up, now.y * AMP.y)
        .addScaledVector(fwd, now.z * AMP.z);
      c.lookAt(focus);
      c.updateMatrixWorld();
    };
    return true;
  }

  function loop() {
    const k = 0.12; // smoothing
    const px = now.x, py = now.y, pz = now.z;
    now.x += (target.x - now.x) * k;
    now.y += (target.y - now.y) * k;
    now.z += (target.z - now.z) * k;
    const moved = Math.abs(now.x - px) + Math.abs(now.y - py) + Math.abs(now.z - pz) > 1e-5;
    if (moved && room && !room.playing && room.ready) { room.setCamera(lastE); room.render(); }
    raf = requestAnimationFrame(loop);
  }

  /* --- mouse (desktop default) --- */
  addEventListener('pointermove', (ev) => {
    if (source !== 'pointer' || ev.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    target.x = clamp((ev.clientX / innerWidth - 0.5) * 2, -1, 1);
    target.y = clamp(-(ev.clientY / innerHeight - 0.5) * 2, -1, 1) * 0.6;
  }, { passive: true });

  /* --- device tilt (phones) --- */
  let tiltBase = null;
  function onTilt(ev) {
    if (ev.gamma == null) return;
    if (!tiltBase) tiltBase = { g: ev.gamma, b: ev.beta };
    target.x = clamp((ev.gamma - tiltBase.g) / 20, -1, 1);
    target.y = clamp(-(ev.beta - tiltBase.b) / 20, -1, 1) * 0.6;
  }
  async function startTilt() {
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') throw new Error('denied');
    }
    source = 'tilt';
    addEventListener('deviceorientation', onTilt);
  }

  /* --- webcam head tracking (MediaPipe face detector) --- */
  async function startHead() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 }, audio: false,
    });
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.srcObject = stream;
    await video.play();
    let detector;
    try {
      const { FaceDetector, FilesetResolver } = await import(`${MP}/vision_bundle.mjs`);
      const fileset = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
      detector = await FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
      });
    } catch (err) { stream.getTracks().forEach((t) => t.stop()); throw err; }

    source = 'head';
    let base = null, n = 0, lastT = -1;
    const acc = { x: 0, y: 0, s: 0 };
    const step = () => {
      if (source !== 'head') { stream.getTracks().forEach((t) => t.stop()); return; }
      if (!document.hidden && video.currentTime !== lastT && video.videoWidth) {
        lastT = video.currentTime;
        const box = detector.detectForVideo(video, performance.now()).detections[0]?.boundingBox;
        if (box) {
          const cx = (box.originX + box.width / 2) / video.videoWidth;
          const cy = (box.originY + box.height / 2) / video.videoHeight;
          const size = box.width / video.videoWidth;
          if (!base) { // first ~20 frames set the neutral seat position
            acc.x += cx; acc.y += cy; acc.s += size;
            if (++n >= 20) base = { x: acc.x / n, y: acc.y / n, s: acc.s / n };
          } else {
            target.x = clamp((base.x - cx) * 5, -1, 1);          // webcam is mirrored
            target.y = clamp((base.y - cy) * 5, -1, 1) * 0.7;
            target.z = clamp((size - base.s) / base.s * 1.5, -1, 1); // lean in = move in
          }
        }
      }
      requestAnimationFrame(step);
    };
    step();
  }

  /* --- button --- */
  function addButton() {
    const actions = hero.querySelector('.hero-actions');
    if (!actions || !navigator.mediaDevices) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'link';
    b.style.cssText = 'background:none;border-top:0;border-inline:0;color:inherit;cursor:pointer;font:inherit;font-weight:500';
    const canTilt = COARSE && typeof DeviceOrientationEvent !== 'undefined';
    const idle = canTilt ? 'Tilt to look around' : 'Look around with your head';
    b.textContent = idle;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', async () => {
      if (b.getAttribute('aria-pressed') === 'true') {
        source = REDUCED ? 'off' : 'pointer';
        removeEventListener('deviceorientation', onTilt);
        target.x = target.y = target.z = 0; tiltBase = null;
        b.setAttribute('aria-pressed', 'false'); b.textContent = idle; return;
      }
      b.textContent = 'Starting…';
      try {
        target.x = target.y = target.z = 0;
        await (canTilt ? startTilt() : startHead());
        b.setAttribute('aria-pressed', 'true');
        b.textContent = canTilt ? 'Tilt on. Tap to stop' : 'Head tracking on. Click to stop';
      } catch (err) {
        console.warn('Head tracking unavailable:', err);
        source = REDUCED ? 'off' : 'pointer';
        b.textContent = 'Camera unavailable';
        setTimeout(() => { b.textContent = idle; }, 3000);
      }
    });
    actions.appendChild(b);
  }

  // room.js sets window.__room once the scene is ready.
  let tries = 0;
  (function wait() {
    if (hook()) { addButton(); raf = requestAnimationFrame(loop); }
    else if (++tries < 200) setTimeout(wait, 100);
  })();
})();
