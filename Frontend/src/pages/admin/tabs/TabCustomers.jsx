import React from 'react';
import { api } from '../../../services/api';
import { Badge } from '../AdminDashboard';

export default function TabCustomers({ users, setUsers, flash }) {
  const customers = users.filter(u => u.role === 'customer');

  const toggleUser = async (id) => {
    try {
      await api.toggleUserActive(id);
      setUsers(us => us.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      flash('User status updated');
    } catch (err) { flash(err.message, true); }
  };

  return (
    <div className="adm-content">
      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th>
              <th>Role</th><th>Joined</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(u => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><Badge status={u.role} /></td>
                <td><small>{new Date(u.created_at).toLocaleDateString('en-IN')}</small></td>
                <td><Badge status={u.is_active ? 'active' : 'inactive'} /></td>
                <td>
                  <button
                    className={u.is_active ? 'adm-btn-delete' : 'adm-btn-edit'}
                    onClick={() => toggleUser(u.id)}>
                    {u.is_active ? '🚫 Ban' : '✅ Unban'}
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
