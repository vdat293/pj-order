import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CustomerOrder from './pages/CustomerOrder';
import OrderStatus from './pages/OrderStatus';
import RestaurantHome from './pages/RestaurantHome';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import MenuManagement from './pages/MenuManagement';
import RevenueManagement from './pages/RevenueManagement';
import OrderHistory from './pages/OrderHistory';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* Trang chủ công khai của quán */}
          <Route path="/" element={<RestaurantHome />} />
          
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

          {/* Lịch sử gọi món */}
          <Route 
            path="/staff/order-history" 
            element={
              <PrivateRoute>
                <OrderHistory />
              </PrivateRoute>
            } 
          />

          {/* Quản lý doanh thu thực tế */}
          <Route 
            path="/staff/revenue" 
            element={
              <PrivateRoute>
                <RevenueManagement />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
