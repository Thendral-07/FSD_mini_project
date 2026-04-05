import "../styled/about.css";

const teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Frontend Developer",
    bio: "Passionate about creating responsive and intuitive user interfaces with React.",
    avatar: "👩‍💻",
    email: "sarah@mealify.com",
    social: ["LinkedIn", "GitHub"],
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Backend Developer",
    bio: "Expert in API development and database optimization for scalable applications.",
    avatar: "👨‍💻",
    email: "michael@mealify.com",
    social: ["LinkedIn", "Twitter"],
  },
  {
    id: 3,
    name: "Emma Davis",
    role: "UI/UX Designer",
    bio: "Creative designer focused on delivering beautiful and user-centered design solutions.",
    avatar: "👩‍🎨",
    email: "emma@mealify.com",
    social: ["Dribbble", "LinkedIn"],
  },
  {
    id: 4,
    name: "James Wilson",
    role: "Product Manager",
    bio: "Strategic thinker dedicated to building products that solve real user problems.",
    avatar: "👨‍💼",
    email: "james@mealify.com",
    social: ["LinkedIn", "Twitter"],
  },
];

export default function About() {
  return (
    <div className="about-container">
      <section className="about-hero">
        <h1 className="about-title">About Mealify</h1>
        <p className="about-subtitle">
          Revolutionizing the way you discover meals
        </p>
        <p className="about-description">
          Mealify is an innovative application designed to help you overcome decision fatigue when it comes to meals. Using powerful APIs and intuitive design, we make meal selection quick, easy, and fun. Whether you're looking for inspiration or want to explore new cuisines, Mealify has you covered.
        </p>
      </section>

      <section className="mission-section">
        <div className="mission-content">
          <div className="mission-card">
            <h2>🎯 Our Mission</h2>
            <p>
              To simplify meal planning and inspire culinary exploration by providing instant access to a diverse selection of delicious meal options at your fingertips.
            </p>
          </div>
          <div className="mission-card">
            <h2>✨ Our Vision</h2>
            <p>
              To become the go-to platform for food enthusiasts worldwide, fostering a community of adventurous eaters and home cooks.
            </p>
          </div>
          <div className="mission-card">
            <h2>🚀 Our Values</h2>
            <p>
              Innovation, User-Centricity, Quality, and Sustainability guide every decision we make in building Mealify.
            </p>
          </div>
        </div>
      </section>

      <section className="team-section">
        <h2 className="team-title">Meet Our Team</h2>
        <p className="team-subtitle">
          Talented professionals dedicated to bringing you the best meal discovery experience
        </p>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div key={member.id} className="team-card">
              <div className="card-header">
                <div className="member-avatar">{member.avatar}</div>
                <div className="member-info">
                  <h3 className="member-name">{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                </div>
              </div>
              <p className="member-bio">{member.bio}</p>
              <div className="member-contact">
                <span className="contact-icon">✉️</span>
                <a href={`mailto:${member.email}`}>{member.email}</a>
              </div>
              <div className="member-social">
                {member.social.map((platform, idx) => (
                  <button key={idx} className="social-btn">
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <div className="stat">
          <h3 className="stat-number">50K+</h3>
          <p className="stat-label">Daily Users</p>
        </div>
        <div className="stat">
          <h3 className="stat-number">1000+</h3>
          <p className="stat-label">Meal Recipes</p>
        </div>
        <div className="stat">
          <h3 className="stat-number">4</h3>
          <p className="stat-label">Team Members</p>
        </div>
        <div className="stat">
          <h3 className="stat-number">100%</h3>
          <p className="stat-label">Customer Satisfaction</p>
        </div>
      </section>
    </div>
  );
}