import React from 'react';
import { UserTable } from '../components/users/UserTable';

export const Users: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Users Management</h1>
      <UserTable />
    </div>
  );
};
