import React from "react";

const ErrorDisplay = ({ message, onRetry }) => {
  return (
    <div 
      className="error-display" 
      style={{
        padding: "30px",
        margin: "15px 0",
        backgroundColor: "rgba(229, 9, 20, 0.1)",
        borderLeft: "4px solid #E50914",
        borderRadius: "4px",
        textAlign: "center"
      }}
    >
      <p style={{ color: "#fff", fontWeight: "bold", marginBottom: "15px" }}>
        🎬 {message || "Failed to retrieve streaming data."}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          style={{
            background: "#E50914",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
