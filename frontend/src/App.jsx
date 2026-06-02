import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CustomerOrder from './pages/CustomerOrder';
import OrderStatus from './pages/OrderStatus';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import MenuManagement from './pages/MenuManagement';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* Chuyển hướng tạm thời từ root sang 1 bàn mẫu (Sprint 1) */}
          <Route path="/" element={<Navigate to="/order/T01?token=token_table_1_abc123" replace />} />
          
          {/* Trang đặt món của Khách hàng */}
          <Route path="/order/:tableCode" element={<CustomerOrder />} />
          
          {/* Trang Trạng thái đơn hàng */}
          <Route path="/status/:orderId" element={<OrderStatus />} />

          {/* Cổng đăng nhập cho nhân viên */}
          <Route path="/login" element={<Login />} />

          {/* Bảng điều khiển nhận đơn của nhân viên */}
          <Route 
            path="/staff/orders" 
            element={
              <PrivateRoute>
                <StaffDashboard />
              </PrivateRoute>
            } 
          />

          {/* Bảng quản lý thực đơn món ăn & toppings của nhân viên */}
          <Route 
            path="/staff/menu" 
            element={
              <PrivateRoute>
                <MenuManagement />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;

