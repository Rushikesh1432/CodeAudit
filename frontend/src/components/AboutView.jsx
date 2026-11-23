import React from "react";

export default function AboutView() {
  const members = [
    {
      id: 1,
      name: "Keshav Rathi",
      role: "Lead ML & Architecture Engineer",
      bio: "ModernBERT multi-view representation learning, feature fusion, and classification heads.",
      avatar: "👨‍💻",
      github: "https://github.com/keshavrathi07",
      linkedin: "https://linkedin.com",
    },
    {
      id: 2,
      name: "Mohammed Emad Uddin",
      role: "Agent Forensics & Tooling Engineer",
      bio: "Agent A & B toolsets, AST traversal, cyclomatic complexity heuristics, and evidence validation.",
      avatar: "🔬",
      github: "https://github.com/emad-360",
      linkedin: "https://linkedin.com",
    },
    {
      id: 3,
      name: "Chilimikoti Rushikesh",
      role: "Explainable AI (XAI) Specialist",
      bio: "Source-code line-level counterfactual attribution engine and attribution visualization.",
      avatar: "📊",
      github: "https://github.com/Rushikesh1432",
      linkedin: "https://www.linkedin.com/in/rushikesh-chilimikoti-65b49632b/",
    },
    {
      id: 4,
      name: "Krishan Kumar Agarwal",
      role: "LLM Council & Debate Engineer",
      bio: "Multi-agent consensus mechanism, streaming SSE pipelines, and dispute arbitration.",
      avatar: "⚖️",
      github: "https://github.com",
      linkedin: "https://linkedin.com",
    },
    {
      id: 5,
      name: "Aishwarya Shabad",
      role: "Full-Stack & Systems Designer",
      bio: "FastAPI orchestration, responsive glassmorphic UI system, and persistent state management.",
      avatar: "🎨",
      github: "https://github.com/aishwarya9887",
      linkedin: "https://linkedin.com",
    },
  ];

  return (
    <div className="about-container">
      <div className="about-hero glass glass--card">
        <div className="about-badge">Research Team G1272</div>
        <h2 className="about-title">Meet Team G1272</h2>
        <p className="about-subtitle">
          AICD_MultiView is engineered by Team G1272. We combine multi-view representation learning,
          autonomous forensic agents, and multi-agent dispute consensus to pioneer robust, interpretable
          detection of AI-generated code.
        </p>
      </div>

      <div className="team-grid">
        {members.map((m) => (
          <div key={m.id} className="glass glass--card member-card">
            <div className="member-card__avatar">
              <span className="member-card__emoji">{m.avatar}</span>
            </div>

            <div className="member-card__body">
              <h3 className="member-card__name">{m.name}</h3>
              <div className="member-card__role">{m.role}</div>
              <p className="member-card__bio">{m.bio}</p>
            </div>

            <div className="member-card__socials">
              <a
                href={m.github}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn social-btn--github"
                aria-label={`${m.name} GitHub`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>

              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn social-btn--linkedin"
                aria-label={`${m.name} LinkedIn`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
