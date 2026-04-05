import { Link } from "react-router-dom";
import "../styled/Footer.css";

// Static data for footer columns
const NAV_LINKS = [
  { to: "/",        label: "Home"     },
  { to: "/about",   label: "About Us" },
  { to: "/contact", label: "Contact"  },
];

const CUISINES = ["🍝 Italian", "🍜 Asian", "🥗 Mediterranean", "🌮 Mexican", "🍛 Indian"];

const SOCIALS = ["🐦", "📸", "💼", "▶️"];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">

      <div className="footer__grid">

        {/* Column 1: Brand */}
        <div>
          <p className="footer__brand-title">Meal<span>ify</span></p>
          <p className="footer__brand-text">
            Discover amazing meals from around the world. Let us handle the
            "what's for dinner?" question every single day.
          </p>
          <div className="footer__socials">
            {SOCIALS.map((icon, index) => (
              <a key={index} href="#!" className="footer__social-btn" aria-label="Social link">
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Navigation links */}
        <div>
          <h4 className="footer__col-title">Navigate</h4>
          <ul className="footer__links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>→ {link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Cuisine links */}
        <div>
          <h4 className="footer__col-title">Cuisines</h4>
          <ul className="footer__links">
            {CUISINES.map((cuisine) => (
              <li key={cuisine}>
                <a href="#!">{cuisine}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Newsletter signup */}
        <div>
          <h4 className="footer__col-title">Stay Updated</h4>
          <p className="footer__newsletter-text">
            Get weekly meal inspiration delivered straight to your inbox.
          </p>
          <div className="footer__newsletter-form">
            <input
              type="email"
              placeholder="your@email.com"
              className="footer__newsletter-input"
            />
            <button className="footer__newsletter-btn">→</button>
          </div>
        </div>

      </div>

      {/* Bottom bar: copyright + legal links */}
      <div className="footer__bottom">
        <p className="footer__copyright">
          © {year} <span>Mealify</span>. Crafted with ❤️ &amp; 🍴
        </p>
        <div className="footer__legal">
          <a href="#!">Privacy Policy</a>
          <a href="#!">Terms of Use</a>
          <a href="#!">Cookie Policy</a>
        </div>
      </div>

    </footer>
  );
}
