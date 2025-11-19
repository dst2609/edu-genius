import React from "react";
import { Container } from "@mui/material";

const Contact = () => {
  return (
    <Container maxWidth="md" style={{ marginTop: "96px", textAlign: "center" }}>
      <h1>
        Contact <span style={{ color: "#1976d2" }}>EduGenius</span>
      </h1>
      <p style={{ marginTop: 12 }}>
        We’d love to hear from you! Questions, feedback, or ideas — reach out anytime.
      </p>

      <div
        style={{
          marginTop: 28,
          display: "inline-block",
          padding: "24px 28px",
          borderRadius: 12,
          background: "#f5f8ff",
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 8 }}>📧 Email us at</div>
        <a
          href="mailto:edugenius@gmail.com"
          style={{ fontSize: 22, fontWeight: 700, color: "#1976d2", textDecoration: "none" }}
        >
          edugenius@gmail.com
        </a>
      </div>
    </Container>
  );
};

export default Contact;
