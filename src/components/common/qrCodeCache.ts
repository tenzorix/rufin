import QRCodeStyling from 'qr-code-styling';
import { getEmbeddedLogoDataUrl } from '@/constants/qrLogos';

type CacheEntry = { dataUrl: string; width: number; height: number };

const cache = new Map<string, CacheEntry>();
const cacheSubscribers = new Set<() => void>();

const IMAGE_MARGIN = 25;
const IMAGE_SIZE = 0.35;

const defaultOptions = {
  dotsOptions: { type: 'rounded' as const, color: '#ffffff' },
  cornersSquareOptions: { type: 'extra-rounded' as const, color: '#ffffff' },
  cornersDotOptions: { color: '#ffffff' },
  backgroundOptions: { color: 'transparent' },
  imageOptions: { margin: IMAGE_MARGIN, imageSize: IMAGE_SIZE },
};

function cacheKey(
  value: string,
  logoImage?: string,
  size = 220,
  resolutionScale = 2,
  imageSize = IMAGE_SIZE
): string {
  return `${value}|${logoImage ?? ''}|${size}|${resolutionScale}|${IMAGE_MARGIN}|${imageSize}|transparent`;
}

export function getCachedQR(
  value: string,
  logoImage?: string,
  size = 220,
  resolutionScale = 2,
  imageSize = IMAGE_SIZE
): CacheEntry | null {
  return cache.get(cacheKey(value, logoImage, size, resolutionScale, imageSize)) ?? null;
}

export function subscribeToCacheUpdates(callback: () => void): () => void {
  cacheSubscribers.add(callback);
  return () => cacheSubscribers.delete(callback);
}

function notifyCacheUpdate(): void {
  cacheSubscribers.forEach((cb) => cb());
}


export function loadImageAsDataUrl(url: string): Promise<string> {
  const embedded = getEmbeddedLogoDataUrl(url);
  if (embedded) return Promise.resolve(embedded);

  return fetch(url)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}


export function ensureImageOnCanvas(
  qrCode: QRCodeStyling,
  imageDataUrl: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = qrCode as any;
  const drawingDone: Promise<void> = instance._canvasDrawingPromise ?? Promise.resolve();

  return drawingDone.then(
    () =>
      new Promise<void>((resolve) => {
        const svg: SVGElement | undefined = instance._svg;
        const svgImg = svg?.querySelector('image');
        const canvas: HTMLCanvasElement | undefined = instance._domCanvas;
        if (!svgImg || !canvas) { resolve(); return; }

        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(); return; }

        const x = parseFloat(svgImg.getAttribute('x') || '0');
        const y = parseFloat(svgImg.getAttribute('y') || '0');
        const w = parseFloat(svgImg.getAttribute('width') || '0');
        const h = parseFloat(svgImg.getAttribute('height') || '0');
        if (w === 0 || h === 0) { resolve(); return; }

        const img = new Image();
        img.onload = () => {
          const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = x + (w - drawW) / 2;
          const drawY = y + (h - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imageDataUrl;
      })
  );
}

export function preloadDepositQR(
  value: string,
  logoImage?: string,
  size = 220,
  resolutionScale = 2,
  imageSize = IMAGE_SIZE
): void {
  const key = cacheKey(value, logoImage, size, resolutionScale, imageSize);
  if (cache.has(key)) return;

  const pixelSize = size * resolutionScale;
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;';
  document.body.appendChild(container);

  const createQR = (imageDataUrl?: string) => {
    const qrCode = new QRCodeStyling({
      width: pixelSize,
      height: pixelSize,
      data: value,
      image: imageDataUrl,
      qrOptions: { errorCorrectionLevel: 'H' },
      ...defaultOptions,
      imageOptions: { margin: IMAGE_MARGIN, imageSize },
    });

    qrCode.append(container);

    const afterDraw = imageDataUrl
      ? ensureImageOnCanvas(qrCode, imageDataUrl)
      : ((qrCode as any)._canvasDrawingPromise ?? Promise.resolve());

    afterDraw.then(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) {
        document.body.removeChild(container);
        return;
      }

      canvas.toBlob((blob) => {
        document.body.removeChild(container);
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            cache.set(key, {
              dataUrl: reader.result as string,
              width: size,
              height: size,
            });
            notifyCacheUpdate();
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/png');
    }).catch(() => {
      document.body.removeChild(container);
    });
  };

  if (logoImage) {
    loadImageAsDataUrl(logoImage).then(createQR).catch(() => createQR());
  } else {
    createQR();
  }
}
