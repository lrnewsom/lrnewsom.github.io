const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const randomChar = () => chars[Math.floor(Math.random() * (chars.length - 1))],
  randomString = (length) => Array.from(Array(length)).map(randomChar).join("");

function makePoint(phi, theta) {
  return {
    c: sin(phi),
    d: cos(theta),
    f: sin(theta),
    l: cos(phi),
  };
}

function init() {
  const card = document.querySelector(".card"),
    letters = card.querySelector(".card-letters"),
    canvas = document.querySelector(".center-canvas"),
    ctx = canvas.getContext("2d");

  const pixelSize = 4;
  canvas.width = Math.ceil(window.innerWidth / pixelSize);
  canvas.height = Math.ceil(window.innerHeight / pixelSize);

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) * 0.8;

  const R = radius * 0.35;
  const r = radius * 0.15;

  // precompute static torus points (local coords)
  const localPoints = [];
  for (let theta = 0; theta < Math.PI * 2; theta += 0.025) {
    for (let phi = 0; phi < Math.PI * 2; phi += 0.015) {
      const cosT = Math.cos(theta),
        sinT = Math.sin(theta);
      const cosP = Math.cos(phi),
        sinP = Math.sin(phi);
      const x = (R + r * cosP) * cosT;
      const y = (R + r * cosP) * sinT;
      const z = r * sinP;
      // normal for lighting
      const nx = cosP * cosT;
      const ny = cosP * sinT;
      const nz = sinP;
      localPoints.push({ x, y, z, nx, ny, nz });
    }
  }

  let rotX = 0,
    rotY = 0,
    rotZ = 0;
  const lightDir = { x: 0.5, y: -0.3, z: 1 };
  const lightLen = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
  lightDir.x /= lightLen;
  lightDir.y /= lightLen;
  lightDir.z /= lightLen;

  function rotate(point, rx, ry, rz) {
    let { x, y, z, nx, ny, nz } = point;
    // rotate X
    let cy = Math.cos(rx),
      sy = Math.sin(rx);
    let y2 = y * cy - z * sy;
    let z2 = y * sy + z * cy;
    let ny2 = ny * cy - nz * sy;
    let nz2 = ny * sy + nz * cy;
    z = z2;
    y = y2;
    nz = nz2;
    ny = ny2;
    // rotate Y
    let cx = Math.cos(ry),
      sx = Math.sin(ry);
    let x3 = x * cx + z * sx;
    let z3 = -x * sx + z * cx;
    let nx3 = nx * cx + nz * sx;
    let nz3 = -nx * sx + nz * cx;
    x = x3;
    z = z3;
    nx = nx3;
    nz = nz3;
    // rotate Z
    let cz = Math.cos(rz),
      sz = Math.sin(rz);
    let x4 = x * cz - y * sz;
    let y4 = x * sz + y * cz;
    let nx4 = nx * cz - ny * sz;
    let ny4 = nx * sz + ny * cz;
    return { x: x4, y: y4, z: z3, nx: nx4, ny: ny4, nz: nz3 };
  }

  function render() {
    rotX += 0.005;
    rotY += 0.0;
    rotZ += 0.005;

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    // clear to transparent
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 0;
      data[i + 3] = 0;
    }

    // depth buffer for occlusion
    const depthBuf = new Float32Array(w * h).fill(-Infinity);

    for (const p of localPoints) {
      const rp = rotate(p, rotX, rotY, rotZ);
      const px = Math.round(cx + rp.x);
      const py = Math.round(cy + rp.y);
      const pz = rp.z;

      if (px >= 0 && px < w && py >= 0 && py < h) {
        const idx = py * w + px;
        if (pz > depthBuf[idx]) {
          depthBuf[idx] = pz;
          // lambert shading
          const diffuse = Math.max(
            0,
            rp.nx * lightDir.x + rp.ny * lightDir.y + rp.nz * lightDir.z
          );
          const shade = Math.floor(60 + 195 * diffuse);
          const i = idx * 4;
          data[i] = data[i + 1] = data[i + 2] = shade;
          data[i + 3] = 230; // slightly transparent
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    requestAnimationFrame(render);
  }

  render();

  const handleOnMove = (e) => {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;

    letters.style.setProperty("--x", `${x}px`);
    letters.style.setProperty("--y", `${y}px`);

    letters.innerText = randomString(6000);
  };

  card.onmousemove = (e) => handleOnMove(e);
  card.ontouchmove = (e) => handleOnMove(e.touches[0]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
