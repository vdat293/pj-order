import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, LogIn } from 'lucide-react';

const RestaurantHome = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-soft p-7 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <ChefHat size={32} />
                </div>
                <h1 className="text-2xl font-heading font-extrabold text-on-surface mb-2">
                    Website của quán
                </h1>
                <p className="text-sm text-on-surface-variant/70 font-body leading-relaxed mb-6">
                    Phiên gọi món QR đã hết hạn hoặc không còn hợp lệ. Vui lòng quét lại mã QR tại bàn để tiếp tục gọi món.
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-heading font-bold text-xs"
                >
                    <LogIn size={15} />
                    Nhân viên đăng nhập
                </button>
            </div>
        </div>
    );
};

export default RestaurantHome;
