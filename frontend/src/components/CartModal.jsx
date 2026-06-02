import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartModal = ({ isOpen, onClose, onCheckout, onEditItem, isSubmitting }) => {
    const { cart, updateQuantity, totalPrice, totalItems } = useCart();
    const [orderNote, setOrderNote] = useState('');

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleCheckoutClick = () => {
        if (cart.length === 0) return;
        onCheckout(orderNote);
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${
            isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}>
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            ></div>

            {/* Bottom Sheet */}
            <div className={`relative w-full max-w-lg bg-white rounded-t-[2rem] shadow-2xl flex flex-col h-[80vh] overflow-hidden z-10 transition-all duration-300 ease-out transform ${
                isOpen ? 'translate-y-0' : 'translate-y-full'
            }`}>
                
                {/* Drag Handle */}
                <div className="w-10 h-1 bg-gray-200/80 rounded-full mx-auto mt-3 mb-1 flex-shrink-0"></div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4 pt-1 border-b border-gray-100/80 flex-shrink-0">
                    <h2 className="text-xl font-heading font-extrabold text-on-surface flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                            <ShoppingBag size={18} className="text-primary" />
                        </div>
                        <div>
                            <span className="block text-base sm:text-lg">Giỏ hàng</span>
                            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider font-body block">{totalItems} món đã chọn</span>
                        </div>
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all duration-200"
                        aria-label="Đóng"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-1">
                    {cart.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-surface-container-high/60 flex items-center justify-center">
                                <ShoppingBag size={36} className="text-on-surface-variant/25" />
                            </div>
                            <div>
                                <p className="font-heading font-bold text-on-surface/70">Giỏ hàng đang trống</p>
                                <p className="text-xs text-on-surface-variant/50 max-w-[220px] mt-1 font-body leading-relaxed">Hãy quay lại thực đơn và chọn những món ngon nhé!</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {cart.map((item, index) => {
                                const toppingsPrice = (item.toppings || []).reduce((sum, t) => sum + Number(t.price), 0);
                                const rowTotal = (Number(item.price) + toppingsPrice) * item.quantity;
                                
                                return (
                                    <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100/60 last:border-b-0 group/item">
                                        {/* Item info */}
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h4 className="font-heading font-bold text-on-surface text-sm sm:text-base leading-snug line-clamp-2">
                                                    {item.name}
                                                </h4>
                                                {onEditItem && (
                                                    <button
                                                        onClick={() => onEditItem(index)}
                                                        className="p-1 rounded-lg text-primary/75 hover:text-primary hover:bg-primary/5 active:scale-90 transition-all duration-200"
                                                        aria-label="Sửa món này"
                                                        title="Sửa cấu hình món"
                                                    >
                                                        <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Toppings list split */}
                                            {item.toppings && item.toppings.length > 0 && (
                                                <div className="space-y-1 mt-1.5 mb-1 text-left">
                                                    {/* Món ăn cùng */}
                                                    {item.toppings.filter(t => t.type === 'cung').length > 0 && (
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            <span className="text-[10px] font-heading font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Ăn cùng:</span>
                                                            {item.toppings.filter(t => t.type === 'cung').map((top, tIdx) => (
                                                                <span 
                                                                    key={tIdx} 
                                                                    className="inline-flex items-center text-[10px] font-body font-semibold text-emerald-700 bg-emerald-500/[0.03] px-2 py-0.5 rounded-md border border-emerald-600/10"
                                                                >
                                                                    +{top.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Món ăn thêm */}
                                                    {item.toppings.filter(t => t.type === 'them').length > 0 && (
                                                        <div className="flex flex-wrap gap-1 items-center mt-1">
                                                            <span className="text-[10px] font-heading font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Ăn thêm:</span>
                                                            {item.toppings.filter(t => t.type === 'them').map((top, tIdx) => (
                                                                <span 
                                                                    key={tIdx} 
                                                                    className="inline-flex items-center text-[10px] font-body font-semibold text-amber-700 bg-amber-500/[0.03] px-2 py-0.5 rounded-md border border-amber-600/10"
                                                                >
                                                                    +{top.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <p className="text-primary font-heading font-extrabold text-sm mt-1">
                                                {formatPrice(rowTotal)}
                                            </p>
                                            
                                            {item.note && (
                                                <div className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/60 mt-2 bg-surface-container-low py-1.5 px-2.5 rounded-lg border border-gray-100/50 italic font-body">
                                                    <span>📝</span>
                                                    <span className="font-medium text-on-surface-variant/80">{item.note}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quantity stepper */}
                                        <div className="flex items-center gap-2 bg-surface-container-high/60 rounded-2xl p-1 flex-shrink-0">
                                            <button 
                                                onClick={() => updateQuantity(index, -1)}
                                                className="w-8 h-8 bg-white shadow-sm text-on-surface-variant rounded-xl flex items-center justify-center hover:text-primary transition-colors duration-200 active:scale-90"
                                            >
                                                <Minus size={14} className="stroke-[2.5]" />
                                            </button>
                                            <span className="w-5 text-center font-heading font-extrabold text-on-surface text-sm">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(index, 1)}
                                                className="w-8 h-8 bg-white shadow-sm text-on-surface-variant rounded-xl flex items-center justify-center hover:text-primary transition-colors duration-200 active:scale-90"
                                            >
                                                <Plus size={14} className="stroke-[2.5]" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Order note */}
                            <div className="mt-4 border-t border-gray-100/80 pt-4 pb-2">
                                <label className="flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-on-surface mb-2">
                                    <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                                        <ClipboardList size={13} className="text-primary" />
                                    </div>
                                    <span>Ghi chú chung cho đơn hàng</span>
                                </label>
                                <textarea
                                    placeholder="Lưu ý thêm cho cả đơn hàng (chia túi, mang ra cùng lúc...)"
                                    className="w-full border border-gray-200/80 rounded-2xl p-3 text-xs sm:text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/8 transition-all duration-300 h-16 resize-none bg-surface-container-low/50 font-body placeholder:text-on-surface-variant/40"
                                    value={orderNote}
                                    onChange={(e) => setOrderNote(e.target.value)}
                                    maxLength={150}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Checkout Footer as flex sibling */}
                {cart.length > 0 && (
                    <div className="bg-white/95 backdrop-blur-md border-t border-gray-100/80 px-5 pt-4 flex flex-col z-20 flex-shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <span className="font-body font-semibold text-on-surface-variant/70 text-sm">Tổng tiền tạm tính</span>
                            <span className="text-2xl font-heading font-extrabold text-primary">{formatPrice(totalPrice)}</span>
                        </div>
                        <button 
                            onClick={handleCheckoutClick}
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-heading font-bold h-[54px] rounded-2xl shadow-lg shadow-primary/15 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang gửi đơn hàng...</span>
                                </>
                            ) : (
                                <span>Gửi yêu cầu đặt món</span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartModal;

