const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const randomChar = () => chars[Math.floor(Math.random() * (chars.length - 1))];
const randomString = (length) =>
  Array.from(Array(length)).map(randomChar).join("");

// --- Torus geometry ----------------------------------------------------------

function makeTorusPoints(majorRadius, minorRadius, thetaStep, phiStep) {
  const points = [];
  for (let theta = 0; theta < Math.PI * 2; theta += thetaStep) {
    for (let phi = 0; phi < Math.PI * 2; phi += phiStep) {
      const cosT = Math.cos(theta),
        sinT = Math.sin(theta);
      const cosP = Math.cos(phi),
        sinP = Math.sin(phi);
      points.push({
        x: (majorRadius + minorRadius * cosP) * cosT,
        y: (majorRadius + minorRadius * cosP) * sinT,
        z: minorRadius * sinP,
        nx: cosP * cosT,
        ny: cosP * sinT,
        nz: sinP,
      });
    }
  }
  return points;
}

// --- 3D rotation -------------------------------------------------------------

function rotatePoint(p, rx, ry, rz) {
  const cx = Math.cos(rx),
    sx = Math.sin(rx);
  const cy = Math.cos(ry),
    sy = Math.sin(ry);
  const cz = Math.cos(rz),
    sz = Math.sin(rz);

  let { x, y, z, nx, ny, nz } = p;

  // about X
  const y1 = y * cx - z * sx;
  const z1 = y * sx + z * cx;
  const ny1 = ny * cx - nz * sx;
  const nz1 = ny * sx + nz * cx;

  // about Y
  const x2 = x * cy + z1 * sy;
  const z2 = -x * sy + z1 * cy;
  const nx2 = nx * cy + nz1 * sy;
  const nz2 = -nx * sy + nz1 * cy;

  // about Z
  const x3 = x2 * cz - y1 * sz;
  const y3 = x2 * sz + y1 * cz;
  const nx3 = nx2 * cz - ny1 * sz;
  const ny3 = nx2 * sz + ny1 * cz;

  return { x: x3, y: y3, z: z2, nx: nx3, ny: ny3, nz: nz2 };
}

// --- Lighting ----------------------------------------------------------------

function normalize(v) {
  const len = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function shade(nx, ny, nz, light) {
  const diffuse = Math.max(0, nx * light.x + ny * light.y + nz * light.z);
  return Math.floor(60 + 195 * diffuse);
}

// --- Canvas rendering --------------------------------------------------------

function clear(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 0;
    data[i + 3] = 0;
  }
}

function drawTorus(points, data, w, h, cx, cy, rot, light) {
  const depthBuf = new Float32Array(w * h).fill(-Infinity);

  for (const p of points) {
    const rp = rotatePoint(p, rot.x, rot.y, rot.z);
    const px = Math.round(cx + rp.x);
    const py = Math.round(cy + rp.y);

    if (px < 0 || px >= w || py < 0 || py >= h) continue;

    const idx = py * w + px;
    if (rp.z <= depthBuf[idx]) continue;
    depthBuf[idx] = rp.z;

    const s = shade(rp.nx, rp.ny, rp.nz, light);
    const i = idx * 4;
    data[i] = data[i + 1] = data[i + 2] = s;
    data[i + 3] = 230; // slightly transparent
  }
}

// --- Text effect -------------------------------------------------------------

function initTextEffect(card, letters) {
  const handleOnMove = (e) => {
    const rect = card.getBoundingClientRect();
    letters.style.setProperty("--x", `${e.clientX - rect.left}px`);
    letters.style.setProperty("--y", `${e.clientY - rect.top}px`);
    letters.innerText = randomString(6000);
  };

  card.onmousemove = handleOnMove;
  card.ontouchmove = (e) => handleOnMove(e.touches[0]);
}

// --- Controls ----------------------------------------------------------------

const settings = {
  rotX: 0.5,
  rotY: 0.01,
  rotZ: 0.5,
  fontSize: 13,
  major: 0.35,
  minor: 0.15,
  pixelSize: 5,
  detail: 1,
};

function initControls(rebuild, setFontSize, setGradientStop) {
  const spec = {
    rotX: { out: (v) => v.toFixed(2) },
    rotY: { out: (v) => v.toFixed(2) },
    rotZ: { out: (v) => v.toFixed(2) },
    fontSize: { out: (v) => `${v}px`, onChange: setFontSize },
    major: {
      out: (v) => `${Math.round(v * 100)}%`,
      onChange: rebuild,
      pct: true,
      extra: setGradientStop,
    },
    minor: {
      out: (v) => `${Math.round(v * 100)}%`,
      onChange: rebuild,
      pct: true,
    },
    pixelSize: { out: (v) => `${v}`, onChange: rebuild },
    detail: { out: (v) => `${v.toFixed(2)}x`, onChange: rebuild },
  };

  for (const [key, s] of Object.entries(spec)) {
    const input = document.getElementById(key);
    const output = input.nextElementSibling;
    input.addEventListener("input", () => {
      settings[key] = s.pct ? input.value / 100 : +input.value;
      output.textContent = s.out(settings[key]);
      s.onChange?.(settings[key]);
      s.extra?.(settings[key]);
    });
  }
}

// --- Boot --------------------------------------------------------------------

function init() {
  const card = document.querySelector(".card");
  const letters = card.querySelector(".card-letters");
  const canvas = document.querySelector(".center-canvas");
  const ctx = canvas.getContext("2d");
  const light = normalize({ x: 0.5, y: -0.3, z: 1 });
  const rot = { x: 0, y: 0, z: 0 };

  let w, h, cx, cy, radius, torus;
  let lastTime = performance.now();

  function rebuild() {
    // low-res backing store, stretched full-screen by CSS
    w = Math.ceil(window.innerWidth / settings.pixelSize);
    h = Math.ceil(window.innerHeight / settings.pixelSize);
    canvas.width = w;
    canvas.height = h;

    cx = w / 2;
    cy = h / 2;
    radius = Math.min(cx, cy) * 0.8;

    torus = makeTorusPoints(
      radius * settings.major,
      radius * settings.minor,
      0.025 / settings.detail,
      0.015 / settings.detail
    );
  }

  function setFontSize(v) {
    document.documentElement.style.setProperty("--font-size", `${v}px`);
  }

  function setGradientStop(v) {
    // torus outer edge at (major+minor)*0.4*vmin; gradient radius is 0.45*vmin
    const stop = (v + settings.minor) * (0.4 / 0.45) * 100;
    document.documentElement.style.setProperty(
      "--gradient-stop",
      `${Math.round(stop)}%`
    );
  }

  rebuild();
  setFontSize(settings.fontSize);
  setGradientStop(settings.major);
  initControls(rebuild, setFontSize, setGradientStop);

  function render(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap dt for tab-switch jumps
    lastTime = now;

    rot.x += settings.rotX * dt;
    rot.y += settings.rotY * dt;
    rot.z += settings.rotZ * dt;

    const imgData = ctx.createImageData(w, h);
    clear(imgData.data);
    drawTorus(torus, imgData.data, w, h, cx, cy, rot, light);
    ctx.putImageData(imgData, 0, 0);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
  initTextEffect(card, letters);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
