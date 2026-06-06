import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Key, Mail, ShieldAlert, Sparkles, ChefHat } from 'lucide-react';
import { authApiUrl } from '../config/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post(authApiUrl('/login'), { email, password });
            const { token, user } = res.data;

            // Lưu vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Chuyển hướng tới trang quản lý đơn hàng
            navigate('/staff/orders');
        } catch (err) {
            console.error('Lỗi đăng nhập:', err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
            {/* Background glowing circles */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>

            <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
                {/* Logo and header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
                        <ChefHat className="text-white h-9 w-9" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-1.5 font-heading">
                        QR Order Portal <Sparkles size={18} className="text-primary animate-bounce" />
                    </h2>
                    <p className="text-gray-400 text-xs mt-1.5 font-body">Cổng đăng nhập cho Nhân viên & Quản trị viên</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-2xl flex items-center gap-2.5">
                        <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
                        <span className="leading-relaxed font-body">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider pl-1 font-heading">Email cửa hàng</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                                <Mail size={16} />
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nhanvien@example.com"
                                required
                                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:border-primary focus:bg-white/10 focus:ring-1 focus:ring-primary outline-none transition-all duration-200 font-body placeholder-gray-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider pl-1 font-heading">Mật khẩu</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                                <Key size={16} />
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:border-primary focus:bg-white/10 focus:ring-1 focus:ring-primary outline-none transition-all duration-200 font-body placeholder-gray-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-extrabold h-[52px] rounded-2xl hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Đăng nhập hệ thống</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Info footer */}
                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 font-body leading-relaxed">
                        Hệ thống Order QR tối ưu cho Nhà hàng Ẩm thực Việt.<br />
                        Bản quyền © 2026. Tất cả quyền được bảo lưu.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
