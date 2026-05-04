import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiSearch, FiShoppingCart, FiFilter } from "react-icons/fi";

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, category, products]);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/api/products");
      setProducts(res.data);
      const cats = [...new Set(res.data.map((p) => p.category))];
      setCategories(cats);
    } catch (error) {
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let result = [...products];

    if (search) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== "All") {
      result = result.filter((p) => p.category === category);
    }

    setFiltered(result);
  };

  const addToCart = async (productId) => {
    if (!user) {
      toast.error("Please login to add items to cart.");
      return;
    }

    try {
      const res = await API.post("/api/cart", { productId, quantity: 1 });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart.");
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Our Products</h1>
        <p>Discover premium sports gear for every athlete</p>
      </div>

      <div className="products-filters">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="product-search"
          />
        </div>

        <div className="category-filter">
          <FiFilter className="filter-icon" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} id="category-filter">
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No products found.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-card-header">
                <span className="product-category-badge">{product.category}</span>
                {product.stock === 0 && <span className="out-of-stock-badge">Out of Stock</span>}
              </div>
              <div className="product-card-body">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-meta">
                  <span className="product-price">₹{product.price.toLocaleString()}</span>
                  <span className={`product-stock ${product.stock <= 5 ? "low-stock" : ""}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Unavailable"}
                  </span>
                </div>
              </div>
              {user && !user.isAdmin && (
                <button
                  className="btn btn-primary btn-full product-add-btn"
                  onClick={() => addToCart(product._id)}
                  disabled={product.stock === 0}
                >
                  <FiShoppingCart size={16} />
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
