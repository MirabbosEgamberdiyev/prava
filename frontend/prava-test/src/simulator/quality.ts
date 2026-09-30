/**
 * Simulyator sifat rejimini aniqlash.
 *
 * Sahna og'ir: avtodrom ~2.0 mln, mashina ~0.9 mln uchburchak, ustiga HDR
 * osmon. Kuchli videokartada bu muammo emas, lekin integratsiyalangan yoki
 * umuman yo'q videokartada dastur butunlay qotib qoladi.
 *
 * Shuning uchun ishga tushishdan OLDIN videokartani so'raymiz va sahnani
 * shunga qarab yengillatamiz.
 */

export type Quality = "high" | "low" | "software";

/** Dasturiy (GPU'siz) renderlash belgilari */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|basic render|microsoft basic|software|mesa offscreen/i;

/**
 * Sekin, lekin ishlaydigan integratsiyalangan videokartalar.
 * Bularda sahna yengillashtirilgan holda ishlaydi.
 */
const WEAK = /\b(hd graphics (2000|3000)|gma\s|q45|g41|ironlake|sandybridge|ivybridge)\b|radeon.*\b(hd [23]\d{3}|x\d{3})\b/i;

export interface GpuInfo {
  renderer: string;
  quality: Quality;
}

let cached: GpuInfo | null = null;

export function detectGpu(): GpuInfo {
  if (cached) return cached;

  let renderer = "";
  let quality: Quality = "high";

  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      cached = { renderer: "", quality: "software" };
      return cached;
    }

    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";

    if (SOFTWARE.test(renderer)) {
      quality = "software";
    } else if (WEAK.test(renderer)) {
      quality = "low";
    } else {
      // Nomi tanish bo'lmasa — tekstura o'lchami bo'yicha taxmin qilamiz.
      // Juda eski videokartalarda bu chegara past bo'ladi.
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      if (maxTex && maxTex < 8192) quality = "low";
    }

    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = { renderer: "", quality: "software" };
    return cached;
  }

  cached = { renderer, quality };
  return cached;
}

/** Canvas uchun sozlamalar — sifatga qarab */
export function canvasSettings(q: Quality) {
  if (q === "high") {
    return { dpr: [1, 1.5] as [number, number], antialias: true, far: 800 };
  }
  // Past rejim: piksel soni va silliqlash kamaytiriladi — bu eng katta yutuq,
  // chunki kuchsiz videokartada asosiy vaqt piksellarni bo'yashga ketadi.
  return { dpr: [0.6, 0.85] as [number, number], antialias: false, far: 320 };
}
