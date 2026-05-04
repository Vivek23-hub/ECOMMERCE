import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from "react-icons/fi";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await API.get("/api/cart");
      setCart(res.data.cart);
      setTotalAmount(res.data.totalAmount);
    } catch (error) {
      toast.error("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    try {
      await API.put("/api/cart", { productId, quantity });
      fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update quantity.");
    }
  };

  const removeItem = async (productId) => {
    try {
      await API.delete(`/api/cart/${productId}`);
      toast.success("Item removed from cart.");
      fetchCart();
    } catch (error) {
      toast.error("Failed to remove item.");
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await API.post("/api/orders/checkout");
      toast.success(res.data.message);
      navigate("/orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Checkout failed.");
    } finally {
      setCheckingOut(false);
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
    <div className="cart-page">
      <div className="page-header">
        <h1>Shopping Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <FiShoppingBag size={48} />
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
          <button className="btn btn-primary" onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.productId} className="cart-item-card">
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <span className="cart-item-category">{item.category}</span>
                  <span className="cart-item-price">₹{item.price.toLocaleString()}</span>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>

                  <span className="cart-item-total">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>

                  <button className="btn-icon danger" onClick={() => removeItem(item.productId)}>
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Items ({cart.length})</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
