// src/components/BarcodeScannerModal.jsx
import { useEffect, useRef, useState } from 'react';
import { X, ScanLine, Loader, CameraOff } from 'lucide-react';

const READER_ID = 'barcode-reader';

/**
 * مودال مسح الباركود بالكاميرا الخلفية.
 * مكتبة html5-qrcode تُحمّل فقط عند فتح المودال لتخفيف حجم التطبيق.
 */
export default function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [status, setStatus] = useState('loading'); // loading | scanning | error
  const onScanRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onScanRef.current = onScanSuccess;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    let scanner = null;
    let cancelled = false;
    let handled = false;

    const stop = async () => {
      if (!scanner) return;
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        /* تجاهل */
      }
    };

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        scanner = new Html5Qrcode(READER_ID, { verbose: false });
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: (w, h) => ({ width: Math.min(w * 0.85, 320), height: Math.min(h * 0.45, 160) }),
          },
          async (decodedText) => {
            if (handled) return;
            handled = true;
            if (navigator.vibrate) navigator.vibrate(60);
            await stop();
            onScanRef.current?.(decodedText.trim());
            onCloseRef.current?.();
          },
          () => {}
        );
        if (cancelled) await stop();
        else setStatus('scanning');
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      stop();
      setStatus('loading');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="btn btn-ghost btn-icon absolute top-4 left-4 z-10" aria-label="إغلاق">
          <X className="w-5 h-5" />
        </button>

        <h3 className="section-title !text-lg mb-1">
          <ScanLine className="w-5 h-5 text-brand" />
          مسح الباركود
        </h3>
        <p className="text-sm text-muted mb-4">وجّه الكاميرا نحو الباركود</p>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
          <div id={READER_ID} className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:object-cover" />

          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 text-sm">
              <Loader className="w-6 h-6 animate-spin" />
              جاري تشغيل الكاميرا...
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white/85 text-sm">
              <CameraOff className="w-8 h-8" />
              تعذر الوصول للكاميرا. تأكد من منح الإذن وأن الموقع يعمل عبر HTTPS.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
