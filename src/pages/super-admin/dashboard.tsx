import React from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Navigate } from 'react-router-dom';

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Redirect if not super admin
  if (user?.email !== 'zopkit@gmail.com') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          Welcome Super Admin!
        </h1>
        <p className="text-center text-gray-600 mb-6">
          You have successfully logged in with super admin privileges.
        </p>
        <div className="bg-purple-50 p-4 rounded-md">
          <p className="text-purple-800 text-sm">
            Email: {user.email}
          </p>
          <p className="text-purple-800 text-sm mt-2">
            Role: Super Administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard; 