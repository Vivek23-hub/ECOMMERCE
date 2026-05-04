import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  FiPackage, FiDollarSign, FiUsers, FiShoppingBag,
  FiAlertTriangle, FiEdit2, FiTrash2, FiPlus, FiX,
  FiCheckCircle, FiClock, FiBarChart2
} from "react-icons/fi";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: "", category: "", description: "", price: "", stock: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes, ordersRes] = await Promise.all([
        API.get("/api/orders/analytics"),
        API.get("/api/products"),
        API.get("/api/orders/all"),
      ]);
      setAnalytics(analyticsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ name: "", category: "", description: "", price: "", stock: "" });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await API.put(`/api/products/${editingProduct._id}`, form);
        toast.success("Product updated.");
      } else {
        await API.post("/api/products", form);
        toast.success("Product added.");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed.");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.delete(`/api/products/${id}`);
      toast.success("Product deleted.");
      loadData();
    } catch (error) {
      toast.error("Failed to delete product.");
    }
  };


  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><FiBarChart2 /> Admin Dashboard</h1>
        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}>Products</button>
          <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}>Orders</button>
        </div>
      </div>

      {activeTab === "dashboard" && analytics && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><FiPackage size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{analytics.totalOrders}</span>
                <span className="stat-label">Total Orders</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FiDollarSign size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">Rs.{analytics.totalRevenue.toLocaleString()}</span>
                <span className="stat-label">Total Revenue</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><FiUsers size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{analytics.totalUsers}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><FiShoppingBag size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{analytics.totalProducts}</span>
                <span className="stat-label">Total Products</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow"><FiClock size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{analytics.pendingOrders}</span>
                <span className="stat-label">Pending Orders</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teal"><FiCheckCircle size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{analytics.completedOrders}</span>
                <span className="stat-label">Completed Orders</span>
              </div>
            </div>
          </div>

          {analytics.leastStockProduct && (
            <div className="alert-card">
              <FiAlertTriangle size={20} />
              <div>
                <strong>Low Stock Alert:</strong> "{analytics.leastStockProduct.name}" has only{" "}
                <strong>{analytics.leastStockProduct.stock}</strong> units left.
              </div>
            </div>
          )}

          {analytics.outOfStockProducts > 0 && (
            <div className="alert-card danger">
              <FiAlertTriangle size={20} />
              <div>
                <strong>{analytics.outOfStockProducts}</strong> product(s) are out of stock.
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="admin-products">
          <div className="section-header">
            <h2>Manage Products ({products.length})</h2>
            <button className="btn btn-primary" onClick={openAddModal}>
              <FiPlus size={16} /> Add Product
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td className="product-name-cell">{p.name}</td>
                    <td><span className="table-badge">{p.category}</span></td>
                    <td>Rs.{p.price.toLocaleString()}</td>
                    <td>
                      <span className={`stock-indicator ${p.stock === 0 ? "danger" : p.stock <= 5 ? "warning" : "good"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => openEditModal(p)}>
                          <FiEdit2 size={15} />
                        </button>
                        <button className="btn-icon danger" onClick={() => deleteProduct(p._id)}>
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="admin-orders">
          <div className="section-header">
            <h2>All Orders ({orders.length})</h2>
          </div>

          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <div className="order-id">
                      <FiPackage size={16} />
                      <span>#{order._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <span className="order-user-info">{order.userName} ({order.userEmail})</span>
                  </div>
                  <div className="order-status-section">
                    <span className={`status-badge status-${order.status}`}>
                      {order.status === "pending" ? "Pending" : "Completed"}
                    </span>
                    {order.paymentMethod && (
                      <span className="payment-method-badge">{order.paymentMethod}</span>
                    )}
                  </div>
                </div>

                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <span className="order-item-name">{item.productName}</span>
                      <span className="order-item-qty">x {item.quantity}</span>
                      <span className="order-item-price">Rs.{(item.priceAtPurchase * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                  <span className="order-total">Rs.{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? "Edit Product" : "Add Product"}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} rows={3}
                  onChange={(e) => setForm({...form, description: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs.)</label>
                  <input type="number" min="0" value={form.price}
                    onChange={(e) => setForm({...form, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" min="0" value={form.stock}
                    onChange={(e) => setForm({...form, stock: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
