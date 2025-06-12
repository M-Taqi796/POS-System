import { useState } from 'react';
import { auth } from '../config/firebase';
import { updatePassword, updateEmail } from 'firebase/auth';

export default function Settings() {
  const [formData, setFormData] = useState({
    email: auth.currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'New passwords do not match' });
          return;
        }
        await updatePassword(auth.currentUser, formData.newPassword);
      }

      if (formData.email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, formData.email);
      }

      setMessage({ type: 'success', text: 'Settings updated successfully' });
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto dark:text-white">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold dark:text-white">Settings</h1>
          <p className="mt-2 text-sm dark:text-gray-300">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current password
                </label>
                <input
                  type="password"
                  id="current-password"
                  className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New password
                </label>
                <input
                  type="password"
                  id="new-password"
                  className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm new password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  className="input-field mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>

              {message.text && (
                <div
                  className={`p-4 rounded-md ${
                    message.type === 'error' 
                      ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200' 
                      : 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div>
                <button type="submit" className="btn-primary dark:bg-blue-600 dark:hover:bg-blue-700">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 