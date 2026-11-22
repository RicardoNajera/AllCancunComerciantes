/**
 * All Cancún — Compresión de imágenes en el navegador
 *
 * Una foto de celular pesa 3-5 MB. Aquí se reduce a ~250 KB en WebP
 * antes de subirla: cabe en el bucket gratis y carga rápido con datos
 * móviles. La compresión ocurre en el teléfono del comerciante, así
 * que no cuesta CPU ni ancho de banda del servidor.
 *
 * Canvas + toBlob: no hace falta ninguna librería.
 */

/* Tope de peso del archivo que llega. Más grande se rechaza con un
   mensaje claro en vez de colgar el teléfono intentando decodificarlo. */
export const MAX_BYTES_ENTRADA = 20 * 1024 * 1024;

/* Ancho máximo por uso. Un logo no necesita 1600 px; la portada sí. */
export const TAMANOS = {
  portada: { ancho: 1600, alto: 900 },
  logo: { ancho: 512, alto: 512 },
  producto: { ancho: 1000, alto: 1000 },
  perfil: { ancho: 512, alto: 512 },
};

/* Calidad de WebP. 0.82 es el punto donde no se nota la pérdida y el
   peso cae a una cuarta parte. */
const CALIDAD = 0.82;

/** Tipos que el navegador puede decodificar. HEIC de iPhone no entra. */
export function tipoAceptado(tipo) {
  return /^image\/(jpeg|png|webp|gif|bmp)$/i.test(String(tipo || ""));
}

/** Valida el archivo antes de gastar memoria. Devuelve "" si está bien. */
export function revisarArchivo(file) {
  if (!file) return "No se eligió ninguna imagen.";
  if (!tipoAceptado(file.type)) {
    /* HEIC es el caso real: iPhone lo manda por defecto. Se pide JPG. */
    if (/heic|heif/i.test(file.type) || /\.heic$/i.test(file.name || ""))
      return "Las fotos HEIC no se pueden leer. Cámbiala a JPG en Ajustes del iPhone.";
    return "Formato no compatible. Usa JPG, PNG o WebP.";
  }
  if (file.size > MAX_BYTES_ENTRADA) {
    const mb = Math.round(file.size / (1024 * 1024));
    return `La imagen pesa ${mb} MB. El máximo es 20 MB.`;
  }
  return "";
}

/**
 * Encaja el rectángulo dentro del cuadro sin deformar y sin ampliar.
 * Una foto de 400 px no se convierte en 1000 px: se quedaría borrosa.
 */
export function calcularDestino(ancho, alto, limite) {
  const w = Number(ancho) || 0;
  const h = Number(alto) || 0;
  if (w <= 0 || h <= 0) return { ancho: 0, alto: 0 };

  const maxW = limite.ancho;
  const maxH = limite.alto;
  const escala = Math.min(maxW / w, maxH / h, 1);

  return {
    ancho: Math.max(1, Math.round(w * escala)),
    alto: Math.max(1, Math.round(h * escala)),
  };
}

/** Nombre de archivo seguro: sin acentos, sin espacios, máx 60 caracteres. */
export function nombreLimpio(nombre) {
  return String(nombre || "imagen")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "imagen";
}

/** Verdadero si el navegador puede exportar WebP (todos los modernos). */
function soportaWebP(canvas) {
  try {
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/** Lee el archivo como Image decodificable. Devuelve null si no se puede. */
function cargarImagen(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Comprime una imagen y devuelve un Blob WebP listo para subir.
 *
 * @param {File} file
 * @param {"portada"|"logo"|"producto"|"perfil"} uso
 * @returns {Promise<{blob: Blob|null, error: string}>}
 */
export async function comprimirImagen(file, uso = "producto") {
  const problema = revisarArchivo(file);
  if (problema) return { blob: null, error: problema };

  const limite = TAMANOS[uso] || TAMANOS.producto;
  const img = await cargarImagen(file);
  if (!img) return { blob: null, error: "No se pudo leer la imagen. Prueba con otra." };

  const destino = calcularDestino(img.naturalWidth, img.naturalHeight, limite);

  const canvas = document.createElement("canvas");
  canvas.width = destino.ancho;
  canvas.height = destino.alto;

  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: null, error: "El navegador no pudo procesar la imagen." };

  /* Fondo blanco: un PNG con transparencia se vería negro en JPEG. */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, destino.ancho, destino.alto);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, destino.ancho, destino.alto);

  const tipo = soportaWebP(canvas) ? "image/webp" : "image/jpeg";

  const calidad = CALIDAD;
  const blob = await new Promise((resolve) => {
    let listo = false;
    const terminar = (b) => {
      if (listo) return;
      listo = true;
      resolve(b);
    };
    /* Red de seguridad: en algunos navegadores toBlob no llama nunca al
       callback (pasa con canvas grandes en dispositivos con poca memoria)
       y sin esto la pantalla se quedaba en "Subiendo foto…" para siempre. */
    const reloj = setTimeout(() => terminar(null), 20000);
    try {
      canvas.toBlob((b) => {
        clearTimeout(reloj);
        terminar(b);
      }, tipo, calidad);
    } catch {
      clearTimeout(reloj);
      terminar(null);
    }
  });

  if (!blob) return { blob: null, error: "La imagen es demasiado grande para procesarla. Prueba con otra foto." };

  /* Se devuelven las medidas finales para poder enseñarlas: así el
     comerciante comprueba el resultado sin abrir Cloudflare. */
  return { blob, error: "", ancho: destino.ancho, alto: destino.alto };
}

/** 249_000 → "243 KB" */
export function pesoTexto(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
