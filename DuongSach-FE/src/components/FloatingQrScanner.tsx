import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  Scan, 
  Camera, 
  Upload, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { Language } from '../types';
import './FloatingQrScanner.css';

interface FloatingQrScannerProps {
  language?: Language;
}

type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

export const FloatingQrScanner: React.FC<FloatingQrScannerProps> = ({ language = 'vi' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchedValue, setMatchedValue] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  useModalBehavior(isOpen, () => handleClose());

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isVi = language === 'vi';

  const getDetector = () => {
    if (detectorRef.current) return detectorRef.current;
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector) return null;
    detectorRef.current = new Detector({ formats: ['qr_code'] });
    return detectorRef.current;
  };

  // Listen to global open event
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
      setIsMatched(false);
    };
    window.addEventListener('open-qr-scanner', handleOpenEvent);
    return () => window.removeEventListener('open-qr-scanner', handleOpenEvent);
  }, []);

  // Camera stream handler
  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    setCameraError(null);
    stopCamera();
    try {
      if (!getDetector()) {
        setCameraError(isVi ? 'Trình duyệt chưa hỗ trợ nhận diện mã QR.' : 'QR recognition is not supported by this browser.');
      } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsScanning(true);
      } else {
        setCameraError(isVi ? 'Trình duyệt không hỗ trợ truy cập camera' : 'Camera not supported on this browser');
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(isVi ? 'Không thể truy cập camera. Vui lòng cấp quyền hoặc tải ảnh QR.' : 'Camera access denied. Please allow camera access or upload a QR image.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, cameraFacing]);

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    setIsMatched(false);
  };

  const triggerSuccess = (value: string) => {
    if (!value || isMatched) return;
    setMatchedValue(value);
    setIsMatched(true);
    setTimeout(() => {
      try {
        const target = new URL(value, window.location.origin);
        if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Unsupported QR protocol');
        if (target.origin === window.location.origin) window.location.assign(target.href);
        else window.open(target.href, '_blank', 'noopener,noreferrer');
        handleClose();
      } catch {
        setCameraError(isVi ? 'Mã QR không chứa đường dẫn hợp lệ.' : 'The QR code does not contain a valid link.');
        setIsMatched(false);
      }
    }, 1200);
  };

  useEffect(() => {
    if (!isScanning || isMatched) return;
    const scanFrame = async () => {
      const detector = getDetector();
      const video = videoRef.current;
      if (detector && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const results = await detector.detect(video);
          if (results[0]?.rawValue) {
            triggerSuccess(results[0].rawValue);
            return;
          }
        } catch (error) {
          console.error('Không thể nhận diện khung hình QR', error);
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };
    animationFrameRef.current = requestAnimationFrame(scanFrame);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isScanning, isMatched]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUploadedFile(objectUrl);
    const detector = getDetector();
    if (!detector) {
      setCameraError(isVi ? 'Trình duyệt chưa hỗ trợ đọc QR từ ảnh.' : 'QR image recognition is not supported by this browser.');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      bitmap.close();
      if (!results[0]?.rawValue) throw new Error('QR_NOT_FOUND');
      triggerSuccess(results[0].rawValue);
    } catch {
      setCameraError(isVi ? 'Không tìm thấy mã QR hợp lệ trong ảnh.' : 'No valid QR code was found in the image.');
    }
  };

  const toggleCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
  };

  return (
    <>
      {/* Modal Popup quét mã QR (Kích hoạt từ Header) */}
      {isOpen && (
        <div className="qr-popup-backdrop" onClick={handleClose}>
          <div 
            className="qr-popup-card" 
            onClick={(e) => e.stopPropagation()} 
            role="dialog" 
            aria-modal="true"
          >
            {/* Header */}
            <div className="qr-popup-header">
              <div className="qr-popup-title-box">
                <span className="qr-popup-header-icon">
                  <Scan size={20} />
                </span>
                <div>
                  <h3 className="qr-popup-title">
                    {isVi ? 'Quét Mã QR Trực Tuyến' : 'Scan QR Code'}
                  </h3>
                  <span className="qr-popup-subtitle">
                    {isVi ? 'Khám phá Di sản & Thông tin Đường Sách' : 'Explore Heritage & Book Street'}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                className="qr-popup-close-btn" 
                onClick={handleClose}
                aria-label="Đóng popup quét mã"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="qr-popup-tabs">
              <button
                type="button"
                className={`qr-tab-btn ${activeTab === 'camera' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('camera')}
              >
                <Camera size={15} />
                <span>{isVi ? 'Camera Trực tiếp' : 'Live Camera'}</span>
              </button>
              <button
                type="button"
                className={`qr-tab-btn ${activeTab === 'upload' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                <Upload size={15} />
                <span>{isVi ? 'Tải ảnh QR' : 'Upload Image'}</span>
              </button>
            </div>

            {/* Body */}
            <div className="qr-popup-body">
              {/* Tab 1: Live Camera Scanner */}
              {activeTab === 'camera' && (
                <div className="qr-camera-tab-content">
                  <div className={`camera-view-container ${isMatched ? 'is-matched' : ''}`}>
                    {/* Real Video Stream */}
                    <video 
                      ref={videoRef} 
                      className="camera-video-feed" 
                      playsInline 
                      muted 
                    />

                    {/* Thông báo khi camera không thể hoạt động */}
                    {cameraError && (
                      <div className="camera-error-notice">
                        <AlertCircle size={28} color="#E9BC63" />
                        <p>{cameraError}</p>
                        <button 
                          type="button" 
                          className="btn-retry-camera"
                          onClick={() => startCamera(cameraFacing)}
                        >
                          <RefreshCw size={14} />
                          <span>{isVi ? 'Thử lại' : 'Retry'}</span>
                        </button>
                      </div>
                    )}

                    {/* Khung ngắm quét mã */}
                    {!cameraError && (
                      <div className="camera-focus-frame">
                        <div className="camera-corner top-left" />
                        <div className="camera-corner top-right" />
                        <div className="camera-corner bottom-left" />
                        <div className="camera-corner bottom-right" />
                        <div className="camera-laser-scan" />
                      </div>
                    )}

                    {/* Hiệu ứng khi nhận diện thành công */}
                    {isMatched && (
                      <div className="camera-match-overlay">
                        <CheckCircle2 size={42} color="#4ade80" />
                        <div className="camera-match-badge">
                          <span>{isVi ? 'Đã nhận diện thành công!' : 'QR Code Verified!'}</span>
                          <small>{matchedValue}</small>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls & Status */}
                  <div className="qr-camera-controls-row">
                    <div className={`qr-status-pill ${isMatched ? 'is-success' : ''}`}>
                      <span className="qr-status-dot" />
                      <span>
                        {isMatched 
                          ? (isVi ? 'Đang chuyển trang...' : 'Opening destination...')
                          : (isVi ? 'Đang căn chỉnh khung quét...' : 'Scanning for QR code...')}
                      </span>
                    </div>

                    <button 
                      type="button" 
                      className="qr-flip-cam-btn"
                      onClick={toggleCameraFacing}
                      title={isVi ? 'Đổi camera trước/sau' : 'Flip Camera'}
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>

                </div>
              )}

              {/* Tab 2: Upload Image */}
              {activeTab === 'upload' && (
                <div className="qr-upload-tab-content">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="qr-file-input-hidden"
                    onChange={handleFileUpload}
                  />

                  <div 
                    className="qr-upload-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadedFile ? (
                      <div className="qr-uploaded-preview">
                        <img src={uploadedFile} alt="Uploaded QR preview" className="qr-upload-img" />
                        <span>{isVi ? 'Đang xử lý ảnh QR...' : 'Processing QR Image...'}</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={36} className="upload-drop-icon" />
                        <p className="upload-drop-title">
                          {isVi ? 'Chọn ảnh chứa mã QR từ thiết bị' : 'Select an image containing QR code'}
                        </p>
                        <span className="upload-drop-hint">PNG, JPG, WEBP ({isVi ? 'Tối đa 10MB' : 'Up to 10MB'})</span>
                        <button type="button" className="btn-select-file">
                          {isVi ? 'Duyệt tệp tin' : 'Browse Files'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Notice */}
            <div className="qr-popup-footer-notice">
              <span>{isVi ? 'Bảo mật & Tích hợp bởi Trung tâm Công nghệ AIC Lab' : 'Secured & Powered by AIC Lab'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

