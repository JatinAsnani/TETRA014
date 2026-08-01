import { useEffect, useRef } from 'react';

export default function GreenScreenCat({ videoSrc = '/cat_login.mp4', width = 540, height = 540 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Reset video source & load
    video.src = videoSrc;
    video.load();

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animId;

    function processFrame() {
      if (video.paused || video.ended || !video.videoWidth || !video.videoHeight) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      try {
        // Draw video frame onto canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Extract pixel data for Chroma Key processing
        const frame = ctx.getImageData(0, 0, width, height);
        const data = frame.data;
        const length = data.length;

        // Real-time Chroma Key Green Screen Threshold Algorithm
        for (let i = 0; i < length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Green Screen Detection logic
          if (g > 55 && g > r * 1.2 && g > b * 1.2) {
            const diff = g - Math.max(r, b);
            if (diff > 45) {
              data[i + 3] = 0; // 100% Transparent Alpha
            } else {
              data[i + 3] = Math.max(0, 255 - (diff * 5.5));
            }
          }
        }

        // Render key-out frame back to canvas
        ctx.putImageData(frame, 0, 0);
      } catch (err) {
        // Ignore transient canvas frame errors before video buffer is ready
      }

      animId = requestAnimationFrame(processFrame);
    }

    const handlePlay = () => {
      processFrame();
    };

    video.addEventListener('play', handlePlay);

    // Auto-play trigger
    video.play().catch((err) => console.log("Video autoplay suppressed:", err));

    return () => {
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(animId);
    };
  }, [videoSrc, width, height]);

  return (
    <div style={{ position: 'relative', width, height, display: 'inline-block' }}>
      {/* Hidden Video Source element */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{ display: 'none' }}
      />
      {/* Real-time Chroma Key Processed Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width,
          height,
          display: 'block',
          filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.6))',
        }}
      />
    </div>
  );
}
