import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductDetailModal = ({ isOpen, onClose, product }) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setNote('');
        }
    }, [isOpen, product]);

    if (!product) return null;

    const handleAdd = () => {
        addToCart(product, quantity, note);
        onClose();
    };

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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
            <div className={`relative w-full max-w-lg bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden z-10 transition-all duration-300 ease-out transform ${
                isOpen ? 'translate-y-0' : 'translate-y-full'
            }`}>
                
                {/* Drag Handle */}
                <div className="w-10 h-1 bg-gray-200/80 rounded-full mx-auto mt-3 mb-1 flex-shrink-0"></div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-5 z-20 glass-card p-2.5 rounded-full text-on-surface-variant hover:text-on-surface transition-colors duration-200"
                    aria-label="Đóng"
                >
                    <X size={18} strokeWidth={2.5} />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {/* Food Image */}
                    <div className="relative w-full h-60 bg-surface-container-low rounded-2xl overflow-hidden mb-6 shadow-soft group flex-shrink-0">
                        <img 
                            src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                        
                        {/* Price badge on image */}
                        <div className="absolute bottom-3 right-3 glass-card px-3.5 py-2 rounded-2xl">
                            <span className="text-lg font-heading font-extrabold text-primary">{formatPrice(product.price)}</span>
                        </div>
                    </div>

                    {/* Food Header */}
                    <div className="mb-4">
                        <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-on-surface tracking-tight">{product.name}</h2>
                    </div>

                    {/* Description */}
                    <p className="text-on-surface-variant/80 text-sm leading-relaxed mb-6 font-body">
                        {product.description || 'Món ăn được chuẩn bị từ nguyên liệu tươi ngon nhất, giữ trọn hương vị ẩm thực đặc sắc.'}
                    </p>

                    <div className="border-t border-gray-100/80 my-5"></div>

                    {/* Note Input */}
                    <div className="mb-2">
                        <label className="flex items-center gap-2 text-sm font-heading font-semibold text-on-surface mb-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
                                <MessageSquare size={14} className="text-primary" />
                            </div>
                            Ghi chú cho nhà bếp
                            <span className="text-on-surface-variant/50 text-xs font-body font-normal">(Không bắt buộc)</span>
                        </label>
                        <textarea
                            placeholder="Ví dụ: ít cay, nhiều đá, không lấy hành..."
                            className="w-full border border-gray-200/80 rounded-2xl p-4 text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/8 transition-all duration-300 h-20 resize-none bg-surface-container-low/50 font-body placeholder:text-on-surface-variant/40"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={150}
                        />
                        <div className="text-right text-xs text-on-surface-variant/40 mt-1.5 font-body">
                            {note.length}/150 ký tự
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer as flex sibling */}
                <div className="bg-white border-t border-gray-100/80 p-4 pb-7 flex items-center gap-3.5 z-20 flex-shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.03)] w-full">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 bg-surface-container-high/80 rounded-2xl p-1.5">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors duration-200 active:scale-90"
                            disabled={quantity <= 1}
                        >
                            <Minus size={18} />
                        </button>
                        <span className="w-7 text-center font-heading font-extrabold text-on-surface text-lg">{quantity}</span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors duration-200 active:scale-90"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAdd}
                        className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-heading font-bold h-[52px] rounded-2xl shadow-lg shadow-primary/15 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2.5"
                    >
                        <span>Thêm vào giỏ</span>
                        <span className="w-1 h-1 rounded-full bg-white/50"></span>
                        <span className="font-extrabold">{formatPrice(product.price * quantity)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;
