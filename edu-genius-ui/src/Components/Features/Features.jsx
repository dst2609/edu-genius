import React from "react";

const Features = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2 style={{ marginBottom: "30px" }}>Features</h2>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          maxWidth: "500px",
          margin: "0 auto",
          textAlign: "center",
          lineHeight: "2", // increases vertical spacing
        }}
      >
        <li>✅ Personalized learning paths</li>
        <li>✅ AI-driven recommendations</li>
        <li>✅ Progress tracking and analytics</li>
        <li>✅ Interactive practice sessions</li>
      </ul>
    </div>
  );
};

export default Features;
