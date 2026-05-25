import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, onSelect }) => {
    const { cart, addToCart, updateQuantity } = useCart();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const cartItems = cart.filter(item => item.product_id === product.id);
    const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleIncrement = (e) => {
        e.stopPropagation();
        if (!product.is_available) return;
        addToCart(product, 1, '');
    };

    const handleDecrement = (e) => {
        e.stopPropagation();
        if (totalQty === 0) return;
        const itemIndex = cart.findIndex(item => item.product_id === product.id);
        if (itemIndex >= 0) {
            updateQuantity(itemIndex, -1);
        }
    };

    const handleCardClick = () => {
        if (product.is_available && onSelect) {
            onSelect(product);
        }
    };

    return (
        <div 
            onClick={handleCardClick}
            className={`group bg-white rounded-3xl p-3.5 border flex items-center justify-between gap-4 mb-1.5 cursor-pointer transition-all duration-300 active:scale-[0.98] relative ${
                totalQty > 0 
                    ? 'active-added-card border-primary/10' 
                    : 'border-gray-100/80 hover:border-gray-200/80 hover:shadow-soft'
            } ${
                !product.is_available ? 'opacity-60 select-none grayscale-[30%]' : ''
            }`}
        >
            {/* Food info left */}
            <div className="flex-1 flex flex-col justify-between min-h-[88px] pr-2">
                <div>
                    <h3 className="font-heading font-bold text-on-surface text-base sm:text-lg line-clamp-1 tracking-tight">
                        {product.name}
                    </h3>
                    <p className="text-on-surface-variant/70 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed font-body">
                        {product.description || 'Hương vị thơm ngon truyền thống, được chế biến từ những nguyên liệu tuyển chọn.'}
                    </p>
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-primary font-heading font-extrabold text-base sm:text-lg">
                        {formatPrice(product.price)}
                    </span>
                    {!product.is_available && (
                        <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-100/80">
                            Hết món
                        </span>
                    )}
                </div>
            </div>

            {/* Food image right */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-surface-container-low border border-gray-100/50 shadow-sm">
                    <img 
                        src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                </div>

                {/* Sold out overlay */}
                {!product.is_available && (
                    <div className="absolute inset-0 bg-black/15 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            Tạm hết
                        </span>
                    </div>
                )}

                {/* Add/Counter button */}
                {product.is_available && (
                    <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[100px]">
                        {totalQty === 0 ? (
                            <button 
                                onClick={handleIncrement}
                                className="w-full bg-white text-primary border border-primary/15 hover:border-primary/40 font-bold text-xs py-2 rounded-full shadow-md shadow-primary/5 flex items-center justify-center gap-1 active:scale-90 transition-all duration-200 hover:bg-primary/5"
                            >
                                <Plus size={14} className="stroke-[3]" />
                                <span className="font-heading">THÊM</span>
                            </button>
                        ) : (
                            <div 
                                className="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-xs py-1 px-1 rounded-full shadow-lg shadow-primary/20 flex items-center justify-between animate-scale-in"
                            >
                                <button 
                                    onClick={handleDecrement}
                                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center active:scale-85 transition-all duration-200"
                                >
                                    <Minus size={12} className="stroke-[3]" />
                                </button>
                                <span className="w-5 text-center font-extrabold text-sm select-none font-heading">{totalQty}</span>
                                <button 
                                    onClick={handleIncrement}
                                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center active:scale-85 transition-all duration-200"
                                >
                                    <Plus size={12} className="stroke-[3]" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
