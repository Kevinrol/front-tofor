import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BrowserCodeReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import { Modal } from '../Modal/Modal';
import { Flashlight, AlertCircle, Loader2, Check } from 'lucide-react';
import styles from './LectorCodigoBarrasModal.module.css';
import crudStyles from '../../styles/crud.module.css';

export interface LectorCodigoBarrasModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (codigo: string) => void;
}

const reproducirBeep = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // El navegador puede silenciar el audio sin interacción previa
  }
};

export const LectorCodigoBarrasModal: React.FC<LectorCodigoBarrasModalProps> = ({
  open,
  onClose,
  onScan,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [canTorch, setCanTorch] = useState<boolean>(false);
  const [codigoDetectado, setCodigoDetectado] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCodigoDetectado(null);
      setError(null);
      setTorchOn(false);
      return;
    }

    let isMounted = true;
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    const codeReader = new BrowserMultiFormatReader(hints);

    const iniciarEscaneo = async () => {
      setLoading(true);
      setError(null);
      setCodigoDetectado(null);

      try {
        const videoInputs = await BrowserCodeReader.listVideoInputDevices();
        if (!isMounted) return;
        setDevices(videoInputs);

        let targetDevice = selectedDeviceId;
        if (!targetDevice && videoInputs.length > 0) {
          const rearCam = videoInputs.find((d) =>
            /back|trasera|rear|environment/i.test(d.label)
          );
          targetDevice = rearCam ? rearCam.deviceId : videoInputs[0].deviceId;
          setSelectedDeviceId(targetDevice);
        }

        if (!videoRef.current) return;

        const controls = await codeReader.decodeFromVideoDevice(
          targetDevice || undefined,
          videoRef.current,
          (result, _err, ctrl) => {
            if (result && isMounted) {
              const text = result.getText();
              if (text) {
                ctrl.stop();
                reproducirBeep();
                setCodigoDetectado(text);
                setTimeout(() => {
                  if (isMounted) {
                    onScan(text);
                    onClose();
                  }
                }, 400);
              }
            }
          }
        );

        if (!isMounted) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setCanTorch(Boolean(controls.switchTorch));
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error al inicializar lector de código de barras:', err);
        setError(
          'No se pudo acceder a la cámara. Asegúrese de otorgar permisos de cámara en el navegador.'
        );
        setLoading(false);
      }
    };

    iniciarEscaneo();

    return () => {
      isMounted = false;
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch {
          // Noop
        }
        controlsRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        } catch {
          // Noop
        }
      }
    };
  }, [open, selectedDeviceId, onScan, onClose]);

  const toggleTorch = async () => {
    if (controlsRef.current?.switchTorch) {
      try {
        const nuevo = !torchOn;
        await controlsRef.current.switchTorch(nuevo);
        setTorchOn(nuevo);
      } catch (e) {
        console.warn('Torch no soportado por esta cámara:', e);
      }
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      title="Escanear Código de Barras (ZXing)"
      onClose={onClose}
      width={520}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '8px' }}>
          <button
            type="button"
            className={`${crudStyles.btn} ${crudStyles.btnGhost}`}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={styles.videoWrapper}>
          <video ref={videoRef} className={styles.video} playsInline muted autoPlay />

          {!loading && !error && !codigoDetectado && (
            <div className={styles.overlayGuide}>
              <div className={styles.targetBox}>
                <div className={styles.laserLine} />
              </div>
            </div>
          )}

          {loading && (
            <div className={styles.loadingOverlay}>
              <Loader2 size={28} className={crudStyles.spinner} />
              <span>Iniciando cámara...</span>
            </div>
          )}

          {codigoDetectado && (
            <div className={styles.loadingOverlay} style={{ background: 'rgba(5, 150, 105, 0.9)' }}>
              <Check size={36} color="#ffffff" />
              <span style={{ fontSize: '15px', fontWeight: 600 }}>
                Código detectado: {codigoDetectado}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {devices.length > 1 && (
          <div className={styles.controlsBar}>
            <select
              className={styles.selectDevice}
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              aria-label="Seleccionar cámara"
            >
              {devices.map((device, idx) => (
                <option key={device.deviceId || idx} value={device.deviceId}>
                  {device.label || `Cámara ${idx + 1}`}
                </option>
              ))}
            </select>

            {canTorch && (
              <button
                type="button"
                className={`${styles.torchBtn} ${torchOn ? styles.torchBtnActive : ''}`}
                onClick={toggleTorch}
                title="Linterna / Flash"
              >
                <Flashlight size={16} /> {torchOn ? 'Apagar' : 'Encender'}
              </button>
            )}
          </div>
        )}

        <p className={styles.instructions}>
          Coloque el código de barras del producto dentro del recuadro para capturarlo automáticamente.
        </p>
      </div>
    </Modal>
  );
};
