import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiShield } from "react-icons/fi";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon">⚡</span>
          <span className="brand-text">SportZone</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          {(!user || !user.isAdmin) && (
            <Link to="/products" className="nav-link" onClick={() => setMenuOpen(false)}>
              Products
            </Link>
          )}

          {user ? (
            <>
              {user.isAdmin && (
                <Link to="/admin" className="nav-link admin-link" onClick={() => setMenuOpen(false)}>
                  <FiShield size={16} />
                  Admin
                </Link>
              )}
              {!user.isAdmin && (
                <>
                  <Link to="/cart" className="nav-link" onClick={() => setMenuOpen(false)}>
                    <FiShoppingCart size={16} />
                    Cart
                  </Link>
                  <Link to="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>
                    Orders
                  </Link>
                </>
              )}
              <div className="nav-user-section">
                <span className="nav-user-name">
                  <FiUser size={14} />
                  {user.name}
                </span>
                <button className="nav-logout-btn" onClick={handleLogout}>
                  <FiLogOut size={14} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth-section">
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="nav-btn-primary" onClick={() => setMenuOpen(false)}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
