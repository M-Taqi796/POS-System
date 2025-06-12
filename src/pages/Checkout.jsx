import { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { XMarkIcon, MagnifyingGlassIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function Checkout() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const receiptRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) return prevCart;
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) return;

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const printReceipt = (orderId) => {
    const receiptWindow = window.open('', '_blank');
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @media print {
              body {
                font-family: 'Courier New', monospace;
                width: 80mm;
                margin: 0;
                padding: 10px;
              }
              .receipt {
                width: 100%;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
              }
              .items {
                width: 100%;
                margin: 10px 0;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
              }
              .total {
                border-top: 1px dashed #000;
                margin-top: 10px;
                padding-top: 10px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 0.8em;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>POS System</h2>
              <p>Receipt</p>
              <p>Order ID: ${orderId}</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
            <div class="items">
              ${cart.map(item => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>Rs. ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total">
              <div class="item">
                <span>Total:</span>
                <span>Rs. ${cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Please come again</p>
            </div>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
    receiptWindow.close();
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      // Create order
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        total: cart.reduce((total, item) => total + item.price * item.quantity, 0),
        status: 'completed',
        createdAt: new Date()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Update product stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          stock: item.stock - item.quantity
        });
      }

      // Print receipt with order ID
      printReceipt(orderRef.id);

      // Clear cart
      setCart([]);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark:text-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2">
          {/* Search Bar */}
          <div className="mb-4 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleAddToCart(product)}
              >
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg mb-4">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Rs. {product.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock}</span>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No products found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cart Summary</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-16 h-16">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rs. {item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(item.id, item.quantity - 1);
                          }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          -
                        </button>
                        <span className="text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(item.id, item.quantity + 1);
                          }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          +
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromCart(item.id);
                          }}
                          className="ml-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                    <p>Subtotal</p>
                    <p>Rs. {cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</p>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={printReceipt}
                      className="flex-1 btn-secondary flex items-center justify-center"
                      disabled={loading}
                    >
                      <PrinterIcon className="h-5 w-5 mr-2" />
                      Print Receipt
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="flex-1 btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Checkout'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Placed Successfully!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Your order has been placed and will be processed shortly.</p>
            <button
              onClick={() => {
                setShowSuccess(false);
                setCart([]);
              }}
              className="w-full btn-primary"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 