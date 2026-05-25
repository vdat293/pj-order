import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        // Nếu chưa đăng nhập, chuyển hướng về trang /login
        return <Navigate to="/login" replace />;
    }

    try {
        const parsedUser = JSON.parse(user);
        // Kiểm tra xem có đúng role nhân viên (host) không
        if (!['host', 'admin', 'cashier', 'kitchen'].includes(parsedUser.role)) {
            localStorage.clear();
            return <Navigate to="/login" replace />;
        }
    } catch (e) {
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;
