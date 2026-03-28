import React from 'react';

const AdminChat = () => {
  return (
    <div style={{ width: '100%', height: '90vh', padding: '20px' }}>
      <h2 style={{ marginBottom: '15px' }}>Customer Support (Live Chat)</h2>
      {/* Ye iframe Tawk.to ka dashboard aapke panel ke andar khol dega */}
      <iframe 
        src="https://dashboard.tawk.to/" 
        style={{ 
          width: '100%', 
          height: '100%', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}
        title="Tawk.to Admin Dashboard"
      ></iframe>
    </div>
  );
};

export default AdminChat;