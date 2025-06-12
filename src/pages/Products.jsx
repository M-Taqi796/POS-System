import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Products() {
  console.log('Products component rendering'); // Debug log

  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    imageUrl: '',
    costPrice: '',
  });

  useEffect(() => {
    console.log('Products useEffect running'); // Debug log
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    console.log('Fetching products...'); // Debug log
    try {
      setLoading(true);
      setError('');
      const querySnapshot = await getDocs(collection(db, 'products'));
      console.log('Query snapshot:', querySnapshot); // Debug log
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Products list:', productsList); // Debug log
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        setError('Image size should be less than 1MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!formData.name || !formData.price || !formData.costPrice || !formData.stock) {
        setError('Please fill in all required fields');
        return;
      }

      if (parseFloat(formData.costPrice) >= parseFloat(formData.price)) {
        setError('Cost price must be less than selling price');
        return;
      }

      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        // Convert image to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(imageFile);
        imageUrl = await base64Promise;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        imageUrl,
        updatedAt: new Date(),
        costPrice: parseFloat(formData.costPrice),
      };

      console.log('Saving product data:', productData); // Debug log

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        console.log('Product updated successfully'); // Debug log
      } else {
        productData.createdAt = new Date();
        const docRef = await addDoc(collection(db, 'products'), productData);
        console.log('New product added with ID:', docRef.id); // Debug log
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', stock: '', description: '', imageUrl: '', costPrice: '' });
      setImageFile(null);
      setImagePreview('');
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setError(`Failed to save product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      costPrice: product.costPrice?.toString() || '',
    });
    setImagePreview(product.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  try {
    if (loading && products.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading products...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dark:text-white p-4">
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold dark:text-white">Products</h1>
            <p className="mt-2 text-sm dark:text-gray-300">
              A list of all products in your inventory.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="btn-primary inline-flex items-center"
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: '', price: '', stock: '', description: '', imageUrl: '', costPrice: '' });
                setImageFile(null);
                setImagePreview('');
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg dark:bg-gray-800">
                {loading ? (
                  <div className="p-4 text-center dark:text-gray-300">Loading...</div>
                ) : products.length === 0 ? (
                  <div className="p-4 text-center dark:text-gray-300">No products found. Add your first product!</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Image</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Price</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Stock</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Cost Price</th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-16 w-16 object-cover rounded"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <span className="text-gray-400 dark:text-gray-500">No image</span>
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">{product.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">Rs. {product.price}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">{product.stock}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{product.description}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">Rs. {product.costPrice?.toFixed(2) || '0.00'}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium mb-4 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
                    <div className="mt-1 flex items-center space-x-4">
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                    <input
                      type="number"
                      required
                      className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="btn-secondary dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingProduct(null);
                      setFormData({ name: '', price: '', stock: '', description: '', imageUrl: '', costPrice: '' });
                      setImageFile(null);
                      setImagePreview('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary dark:bg-blue-600 dark:hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in Products component:', error);
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-4 rounded-md">
          <h2 className="text-lg font-medium">Something went wrong</h2>
          <p className="mt-2">Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      </div>
    );
  }
} 