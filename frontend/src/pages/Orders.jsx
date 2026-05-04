import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiPackage, FiClock, FiCheckCircle, FiCreditCard } from "react-icons/fi";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/api/orders/my");
      setOrders(res.data);
    } catch (error) {
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const selectPayment = async (orderId, paymentMethod) => {
    try {
      const res = await API.put(`/api/orders/${orderId}/payment`, { paymentMethod });
      toast.success(res.data.message);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process payment.");
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="orders-page">
      <div className="page-header">
        <h1>My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <FiPackage size={48} />
          <h3>No orders yet</h3>
          <p>Your order history will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-id">
                  <FiPackage size={16} />
                  <span>Order #{order._id.slice(-8).toUpperCase()}</span>
                </div>
                <span className={`status-badge status-${order.status}`}>
                  {order.status === "pending" ? (
                    <><FiClock size={14} /> Pending</>
                  ) : (
                    <><FiCheckCircle size={14} /> Completed</>
                  )}
                </span>
              </div>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <div className="order-item-info">
                      <span className="order-item-name">{item.productName}</span>
                      <span className="order-item-qty">x {item.quantity}</span>
                    </div>
                    <span className="order-item-price">
                      Rs.{(item.priceAtPurchase * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {order.status === "pending" && (
                <div className="payment-section">
                  <h4><FiCreditCard size={16} /> Select Payment Method</h4>
                  <div className="payment-options">
                    <button
                      className="btn btn-outline payment-btn"
                      onClick={() => selectPayment(order._id, "COD")}
                    >
                      💵 Cash on Delivery
                    </button>
                    <button
                      className="btn btn-primary payment-btn"
                      onClick={() => selectPayment(order._id, "UPI")}
                    >
                      📱 UPI
                    </button>
                  </div>
                </div>
              )}

              <div className="order-card-footer">
                <div>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                  {order.paymentMethod && (
                    <span className="payment-method-badge">Paid via {order.paymentMethod}</span>
                  )}
                </div>
                <span className="order-total">Total: Rs.{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
