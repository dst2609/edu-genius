import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import { Box, Button, Container } from "@mui/material";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container maxWidth="lg">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Welcome to <span className="highlight">EduGenius</span>
              </h1>
              <p className="hero-subtitle">
                Your AI-Powered Learning Companion
              </p>
              <p className="hero-description">
                Experience the future of education with intelligent tutoring,
                personalized course recommendations, and an AI chatbot ready to
                answer all your questions. Learn smarter, not harder.
              </p>
            </div>
            <div className="hero-image">
              <div className="floating-card card-1">
                <div className="card-icon">💡</div>
                <p>AI Learning</p>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">📚</div>
                <p>Courses</p>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">🤖</div>
                <p>Smart Chat</p>
              </div>
              <div className="floating-card card-4">
                <div className="card-icon">📅</div>
                <p>Study Planner</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container maxWidth="lg">
          <h2 className="section-title">Why Choose EduGenius?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Tutoring</h3>
              <p>
                Get personalized tutoring from our advanced AI model trained on
                educational content. Ask any question and get instant answers
                with detailed explanations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Curated Course Library</h3>
              <p>
                Browse through hundreds of carefully curated courses covering
                various subjects. Find courses that match your learning goals
                and pace.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Learning</h3>
              <p>
                Our smart recommendation engine suggests courses and topics
                tailored to your learning interests and progress level.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Support</h3>
              <p>
                Access our chatbot 24/7 for homework help, concept clarification,
                and learning guidance. No waiting, just instant answers.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>
                Monitor your learning journey with detailed progress reports,
                statistics, and personalized recommendations for improvement.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Premium Experience</h3>
              <p>
                Enjoy a beautiful, intuitive interface designed for optimal
                learning. Premium features unlock unlimited access to all
                content.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Certifications & Badges</h3>
              <p>
                Earn certificates upon course completion and collect badges
                for achievements. Build your learning portfolio and showcase
                your skills.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <Container maxWidth="lg">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up for free and create your learning profile</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Choose Courses</h3>
              <p>Browse and select courses that interest you</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Learn & Chat</h3>
              <p>Study with our AI chatbot ready to help anytime</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Track Progress</h3>
              <p>Monitor your growth and achieve your goals</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <Container maxWidth="lg">
          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="stat-number">10K+</h3>
              <p className="stat-label">Active Learners</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">500+</h3>
              <p className="stat-label">Courses Available</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">24/7</h3>
              <p className="stat-label">AI Support</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">95%</h3>
              <p className="stat-label">User Satisfaction</p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container maxWidth="lg">
          <div className="cta-content">
            <h2>Ready to Transform Your Learning?</h2>
            <p>
              Join thousands of students who are already learning smarter with
              EduGenius
            </p>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <Container maxWidth="lg">
          <div className="footer-content">
            <div className="footer-section">
              <h4>EduGenius</h4>
              <p>
                Empowering students with AI-powered learning for a smarter
                future.
              </p>
            </div>
            <div className="footer-section">
              <h4>Features</h4>
              <ul>
                <li>AI Chatbot</li>
                <li>Course Library</li>
                <li>Learning Tracking</li>
                <li>Personalization</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQ</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 EduGenius. All rights reserved.</p>
            <p>Building the future of education with AI</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;
