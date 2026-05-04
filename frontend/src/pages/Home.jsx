import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiArrowRight, FiShoppingBag, FiTruck, FiShield } from "react-icons/fi";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🏆 #1 Sports Gear Store</div>
          <h1 className="hero-title">
            Gear Up For <span className="hero-highlight">Greatness</span>
          </h1>
          <p className="hero-subtitle">
            Premium sportswear, equipment, and accessories for athletes who demand the best.
            From training to game day — we've got you covered.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop Now <FiArrowRight />
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-outline btn-lg">
                Create Account
              </Link>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-shape"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiShoppingBag size={28} />
            </div>
            <h3>Premium Quality</h3>
            <p>Handpicked sportswear and equipment from top brands worldwide.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FiTruck size={28} />
            </div>
            <h3>Fast Delivery</h3>
            <p>Quick and reliable shipping to get you game-ready in no time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FiShield size={28} />
            </div>
            <h3>Secure Shopping</h3>
            <p>Your data is protected with enterprise-grade security.</p>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="categories-section">
        <h2 className="section-title">Shop By Category</h2>
        <div className="categories-grid">
          {["Footwear", "Apparel", "Equipment", "Accessories"].map((cat) => (
            <Link to="/products" key={cat} className="category-card">
              <div className="category-overlay">
                <h3>{cat}</h3>
                <span className="category-explore">
                  Explore <FiArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
