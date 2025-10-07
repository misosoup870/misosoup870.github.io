<script setup>
import {ref, reactive, watch} from "vue";


/* ========= config ========= */
const skinColors = reactive([
  {name: "00", hex: "#f8dbc7"},
  {name: "01", hex: "#ffdc96"},
  {name: "02", hex: "#ffbeaa"},
  {name: "03", hex: "#e68c50"},
  {name: "04", hex: "#d26946"},
  {name: "05", hex: "#903c28"},
  {name: "06", hex: "#ffdcbe"},
  {name: "07", hex: "#e6b496"},
  {name: "08", hex: "#a07864"},
  {name: "09", hex: "#503c32"},
  {name: "10", hex: "#fff0e6"},
]);

const hairBasic = reactive([
  {name: "00", hex: "#282828"},
  {name: "01", hex: "#ffffff"},
  {name: "02", hex: "#804507"},
  {name: "03", hex: "#cd902a"},
  {name: "04", hex: "#942a00"},
  {name: "05", hex: "#ffdd20"},
  {name: "06", hex: "#0059ff"},
  {name: "07", hex: "#09a600"},
  {name: "08", hex: "#a128ff"},
  {name: "09", hex: "#ff6e80"},
  {name: "10", hex: "#f75700"},
  {name: "11", hex: "#f00011"},
]);

const selectedPalette = ref("skin");
const currentPalette = ref(skinColors);
watch(selectedPalette, (val) => {
  if (val === "skin") currentPalette.value = skinColors;
  else if (val === "hair") currentPalette.value = hairBasic;
});

const threshold = ref(2.0);
const canvas = ref(null);
const result = ref(null);


/* ========= upload image ========= */
function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    const ctx = canvas.value.getContext("2d", {willReadFrequently: true});
    const displayWidth = img.naturalWidth;
    const displayHeight = img.naturalHeight;

    canvas.value.width = displayWidth;
    canvas.value.height = displayHeight;

    const maxWidth = window.innerWidth * 0.6;
    const maxHeight = window.innerHeight * 0.5;
    const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight, 1);

    canvas.value.style.width = displayWidth * ratio + "px";
    canvas.value.style.height = displayHeight * ratio + "px";

    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
  };
  img.src = URL.createObjectURL(file);
}


/* ========= ΔE2000 ========= */
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToXyz({r, g, b}) {
  const R = srgbToLinear(r),
      G = srgbToLinear(g),
      B = srgbToLinear(b);
  return {
    x: (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) * 100,
    y: (R * 0.2126729 + G * 0.7151522 + B * 0.0721750) * 100,
    z: (R * 0.0193339 + G * 0.1191920 + B * 0.9503041) * 100,
  };
}

function xyzToLab({x, y, z}) {
  const refX = 95.047,
      refY = 100.0,
      refZ = 108.883;
  x /= refX;
  y /= refY;
  z /= refZ;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x),
      fy = f(y),
      fz = f(z);
  return {L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz)};
}

function hexToLab(hex) {
  return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

function deltaE2000(L1, a1, b1, L2, a2, b2) {
  const avgL = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt((avgC ** 7) / (avgC ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1,
      a2p = (1 + G) * a2;
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (C1p + C2p) / 2;
  const h1p = ((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360;
  const h2p = ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360;
  let dhp = h2p - h1p;
  if (Math.abs(dhp) > 180) dhp -= 360 * Math.sign(dhp);
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * (Math.PI / 180));
  let avg_hp = (h1p + h2p) / 2;
  if (Math.abs(h1p - h2p) > 180) avg_hp += 180;
  avg_hp %= 360;
  const T =
      1 -
      0.17 * Math.cos((avg_hp - 30) * (Math.PI / 180)) +
      0.24 * Math.cos((2 * avg_hp) * (Math.PI / 180)) +
      0.32 * Math.cos((3 * avg_hp + 6) * (Math.PI / 180)) -
      0.2 * Math.cos((4 * avg_hp - 63) * (Math.PI / 180));
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  const Sl = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
  const Sc = 1 + 0.045 * avgCp;
  const Sh = 1 + 0.015 * avgCp * T;
  const delta_ro = 30 * Math.exp(-Math.pow((avg_hp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const Rt = -Math.sin((2 * delta_ro * Math.PI) / 180) * Rc;
  return Math.sqrt(
      (dLp / Sl) ** 2 +
      (dCp / Sc) ** 2 +
      (dHp / Sh) ** 2 +
      Rt * (dCp / Sc) * (dHp / Sh)
  );
}


/* ========= operations ========= */
function onCanvasClick(e) {
  const rect = canvas.value.getBoundingClientRect();

  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const ctx = canvas.value.getContext("2d", {willReadFrequently: true});
  const pixel = ctx.getImageData(x, y, 1, 1).data;

  const rgb = {r: pixel[0], g: pixel[1], b: pixel[2]};
  const clickedHex =
      "#" +
      [rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

  const clickedLab = xyzToLab(rgbToXyz(rgb));

  const matches = currentPalette.value
      .map((c) => {
        const lab = hexToLab(c.hex);
        const dE = deltaE2000(
            clickedLab.L,
            clickedLab.a,
            clickedLab.b,
            lab.L,
            lab.a,
            lab.b
        );
        return {...c, dE};
      })
      .filter((c) => c.dE <= threshold.value)
      .sort((a, b) => a.dE - b.dE);

  result.value = {
    x: Math.round(x / scaleX),
    y: Math.round(y / scaleY),
    clickedHex,
    matches,
  };
}
</script>

<template>
  <div>
    <div class="mb-2">
      <h2 class="text-2xl">Denpa Men - Color_Picker</h2>
    </div>

    <div class="text-base">
      <div class="flex flex-wrap mb-1">
        <div class="my-2 mr-5">
          <label class="block text-sm font-medium mb-1">upload image</label>
          <input class="block cursor-pointer border border-gray-300 rounded-lg text-sm bg-gray-50 p-3"
                 type="file"
                 @change="onFileChange"
                 accept="image/*">
        </div>

        <div class="my-2 mr-5">
          <label class="block text-sm font-medium mb-1">ΔE2000 threshold</label>
          <input v-model.number="threshold" type="number" step="0.1" min="0"
                 class="block cursor-pointer border border-gray-300 rounded-lg text-sm bg-gray-50 p-3"/>
        </div>

        <div class="my-2">
          <label class="block text-sm font-medium mb-1">mode</label>
          <select v-model="selectedPalette"
                  class="block cursor-pointer border border-gray-300 rounded-lg text-sm bg-gray-50 p-3">
            <option value="skin">&emsp;肌色&emsp;</option>
            <option value="hair">&emsp;髪色&emsp;</option>
          </select>
        </div>
      </div>

      <div class="flex flex-wrap my-4">
        <div v-for="color in currentPalette" :key="color.hex" class="text-center text-xs m-2">
          <div class="flex flex-row items-center">
            <div class="inline-block w-7 h-7 border border-gray-800 align-middle mr-2"
                 :style="{ background: color.hex }"></div>
            <div>{{ color.name }}</div>
          </div>
          <div class="text-left">{{ color.hex }}</div>
        </div>
      </div>
    </div>

    <canvas ref="canvas"
            @click="onCanvasClick"
            class="block cursor-crosshair border border-gray-300 max-w-full max-h-[80vh] w-auto h-auto"></canvas>

    <div class="mt-3 p-2" v-if="result">
      <p>
        <span class="font-bold">クリック座標:</span> ({{ result.x }}, {{ result.y }})
      </p>
      <p>
        クリック色:
        <span class="inline-block w-7 h-4 border border-black align-middle"
              :style="{ background: result.clickedHex }"></span>
        {{ result.clickedHex }}
      </p>
      <div v-if="result.matches.length">
        <p class="font-bold">ΔE2000 ≤ {{ threshold }} の近似色:</p>
        <div v-for="match in result.matches" :key="match.hex">
          <span class="inline-block w-7 h-7 border border-gray-800 align-middle mr-1"
                :style="{ background: match.hex }"></span>
          {{ match.name }} (ΔE={{ match.dE.toFixed(2) }})
        </div>
      </div>
      <div v-else>
        <p>ΔE{{ threshold }} 以下の近似色はありません。</p>
      </div>
    </div>
  </div>
</template>
