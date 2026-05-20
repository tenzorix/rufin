import QRCodeStyling from 'qr-code-styling';
import { useLayoutEffect, useRef, useState } from 'react';
import { getCachedQR, loadImageAsDataUrl, ensureImageOnCanvas, subscribeToCacheUpdates } from './qrCodeCache';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  resolutionScale?: number;
  logoImage?: string;
  logoImageSize?: number;
  badgeImage?: string;
}

export default function QRCode({
  value,
  size = 220,
  resolutionScale = 2,
  logoImage,
  logoImageSize = 0.35,
  badgeImage,
}: QRCodeDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [cached, setCached] = useState(() =>
    getCachedQR(value, logoImage, size, resolutionScale, logoImageSize)
  );

  useLayoutEffect(() => {
    const unsubscribe = subscribeToCacheUpdates(() => {
      setCached(getCachedQR(value, logoImage, size, resolutionScale, logoImageSize));
    });
    return unsubscribe;
  }, [value, logoImage, size, resolutionScale, logoImageSize]);

  useLayoutEffect(() => {
    if (cached) return;

    let cancelled = false;

    const createQR = (imageDataUrl?: string) => {
      if (cancelled || !ref.current) return;

      const pixelSize = size * resolutionScale;
      const qrCode = new QRCodeStyling({
        width: pixelSize,
        height: pixelSize,
        data: value,
        image: imageDataUrl,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: {
          type: 'rounded',
          color: '#ffffff',
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#ffffff',
        },
        cornersDotOptions: {
          color: '#ffffff',
        },
        backgroundOptions: {
          color: 'transparent',
        },
        imageOptions: {
          margin: 25,
          imageSize: logoImageSize,
        },
      });

      ref.current.innerHTML = '';
      qrCode.append(ref.current);
      const canvas = ref.current.querySelector('canvas');
      if (canvas) {
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      }

      if (imageDataUrl) {
        ensureImageOnCanvas(qrCode, imageDataUrl);
      }
    };

    if (logoImage) {
      loadImageAsDataUrl(logoImage).then((dataUrl) => {
        if (!cancelled) createQR(dataUrl);
      }).catch(() => {
        if (!cancelled) createQR();
      });
    } else {
      createQR();
    }

    return () => {
      cancelled = true;
    };
  }, [value, size, resolutionScale, logoImage, logoImageSize, cached]);

  if (cached) {
    return (
      <div className="relative inline-flex items-center justify-center">
        <img
          src={cached.dataUrl}
          alt="QR Code"
          width={cached.width}
          height={cached.height}
          style={{ width: cached.width, height: cached.height }}
        />
        {badgeImage && (
          <img
            src={badgeImage}
            className="absolute w-5 h-5 rounded-full"
            style={{ bottom: 'calc(50% - 6px)', left: 'calc(50% + 12px)' }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <div ref={ref} />
      {badgeImage && (
        <img
          src={badgeImage}
          className="absolute w-5 h-5 rounded-full"
          style={{ bottom: 'calc(50% - 6px)', left: 'calc(50% + 12px)' }}
        />
      )}
    </div>
  );
}