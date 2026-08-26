import React from "react";

export const CardSkeleton = () => {
  return (
    <div 
      className="skeleton" 
      style={{
        height: "270px",
        minWidth: "180px",
        maxWidth: "180px",
        backgroundColor: "var(--bg-card)",
        borderRadius: "6px"
      }} 
    />
  );
};

export const RowSkeleton = () => {
  return (
    <div className="row" style={{ padding: "20px 0" }}>
      <div 
        className="skeleton" 
        style={{
          height: "28px",
          width: "180px",
          backgroundColor: "var(--bg-card)",
          marginBottom: "15px",
          borderRadius: "4px"
        }} 
      />
      <div style={{ display: "flex", gap: "20px", overflow: "hidden" }}>
        {Array(6).fill().map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};

export const HeroSkeleton = () => {
  return (
    <div 
      className="skeleton" 
      style={{
        height: "80vh",
        backgroundColor: "var(--bg-dark)",
        display: "flex",
        alignItems: "center"
      }}
    >
      <div style={{ padding: "50px", textAlign: "left", maxWidth: "600px" }}>
        <div 
          className="skeleton" 
          style={{
            height: "50px",
            width: "350px",
            backgroundColor: "var(--bg-card)",
            marginBottom: "20px",
            borderRadius: "6px"
          }} 
        />
        <div 
          className="skeleton" 
          style={{
            height: "20px",
            width: "250px",
            backgroundColor: "var(--bg-card)",
            marginBottom: "30px",
            borderRadius: "4px"
          }} 
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <div 
            className="skeleton" 
            style={{
              height: "45px",
              width: "120px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "4px"
            }} 
          />
          <div 
            className="skeleton" 
            style={{
              height: "45px",
              width: "120px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "4px"
            }} 
          />
        </div>
      </div>
    </div>
  );
};
