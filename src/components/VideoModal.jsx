import React, { useEffect } from "react";

const VideoModal = ({ isOpen, videoUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="video-overlay show"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="video-modal-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
        style={{
          width: "100%",
          maxWidth: "900px",
          position: "relative",
          aspectRatio: "16/9",
          backgroundColor: "#000",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}
      >
        <button 
          onClick={onClose}
          aria-label="Close trailer"
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            zIndex: 10,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s"
          }}
        >
          ✕
        </button>

        {videoUrl ? (
          <iframe
            src={`${videoUrl}?autoplay=1`}
            title="Trailer Player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{
              width: "100%",
              height: "100%",
              border: "none"
            }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#b3b3b3" }}>
            <p>Trailer details are not available for this movie.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;
