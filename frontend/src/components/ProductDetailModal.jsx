import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';

const EMPTY_ARRAY = [];

const ProductDetailModal = ({ 
    isOpen, 
    onClose, 
    product,
    isEditMode = false,
    initialQuantity = 1,
    initialNote = '',
    initialToppings = EMPTY_ARRAY,
    onUpdate
}) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [selectedToppings, setSelectedToppings] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setQuantity(initialQuantity || 1);
                setNote(initialNote || '');
                setSelectedToppings(initialToppings ? [...initialToppings] : []);
            } else {
                setQuantity(1);
                setNote('');
                setSelectedToppings([]);
            }
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, product, isEditMode, initialQuantity, initialNote, initialToppings]);

    if (!product) return null;

    const handleAdd = () => {
        if (isEditMode && onUpdate) {
            onUpdate(quantity, note, selectedToppings);
        } else {
            addToCart(product, quantity, note, selectedToppings);
        }
        onClose();
    };

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleToppingToggle = (topping) => {
        setSelectedToppings(prev => {
            const exists = prev.some(t => t.id === topping.id);
            if (exists) {
                return prev.filter(t => t.id !== topping.id);
            } else {
                return [...prev, topping];
            }
        });
    };

    const getUnitTotal = () => {
        const toppingsPrice = selectedToppings.reduce((sum, t) => sum + Number(t.price), 0);
        return Number(product.price) + toppingsPrice;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const toppingsCung = (product.toppings || []).filter(t => t.type === 'cung');
    const toppingsThem = (product.toppings || []).filter(t => t.type === 'them');

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
            <div className={`relative w-full max-w-lg bg-[#f8f9fa] rounded-t-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 transition-all duration-300 ease-out transform ${
                isOpen ? 'translate-y-0' : 'translate-y-full'
            }`}>
                
                {/* Drag Handle */}
                <div className="w-10 h-1 bg-gray-200/80 rounded-full mx-auto mt-3 mb-1 flex-shrink-0"></div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-4 z-20 bg-white/95 backdrop-blur-sm p-2 rounded-full text-on-surface-variant hover:text-on-surface transition-colors duration-200 shadow-sm border border-gray-100/50"
                    aria-label="Đóng"
                >
                    <X size={16} strokeWidth={2.5} />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain pb-6">
                    {/* Food Image — compact on mobile */}
                    <div className="relative w-full h-48 sm:h-60 bg-surface-container-low overflow-hidden flex-shrink-0">
                        <img 
                            src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"></div>
                        
                        {/* Price badge on image */}
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-white/50">
                            <span className="text-base font-heading font-extrabold text-primary">{formatPrice(product.price)}</span>
                        </div>
                    </div>

                    {/* Block 1: Food Header Info */}
                    <div className="px-5 pt-4 pb-4 bg-white">
                        <h2 className="text-lg sm:text-xl font-heading font-extrabold text-on-surface tracking-tight leading-snug">{product.name}</h2>
                        <p className="text-on-surface-variant/70 text-xs sm:text-sm leading-relaxed mt-2 font-body">
                            {product.description || 'Món ăn được chuẩn bị từ nguyên liệu tươi ngon nhất, giữ trọn hương vị ẩm thực đặc sắc.'}
                        </p>
                    </div>

                    {/* Block 2A: Món ăn cùng (Accompanying Ingredients: Gân, Nạm, Bò viên...) */}
                    {toppingsCung.length > 0 && (
                        <div className="mt-2">
                            {/* Section title strip */}
                            <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-y border-gray-100 flex-shrink-0">
                                <div className="text-left">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-heading block">Món ăn cùng (Tùy chọn)</span>
                                    <span className="text-[9px] text-gray-400 font-body block mt-0.5">Ví dụ: ăn phở tái cùng nạm hầm, gân bò, bò viên... để bát phở tròn vị</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-200/65 px-2.5 py-0.5 rounded-full font-body">Chọn nhiều</span>
                            </div>
                            
                            {/* Toppings List Group */}
                            <div className="divide-y divide-gray-100 px-5 bg-white">
                                {toppingsCung.map(topping => {
                                    const isSelected = selectedToppings.some(t => t.id === topping.id);
                                    return (
                                        <div
                                            key={topping.id}
                                            onClick={() => handleToppingToggle(topping)}
                                            className="flex items-center justify-between py-4 cursor-pointer active:bg-gray-50/50 transition-colors duration-150"
                                        >
                                            {/* Topping name */}
                                            <span className={`text-xs sm:text-sm font-body font-semibold transition-colors duration-150 ${
                                                isSelected ? 'text-primary font-bold' : 'text-on-surface/85'
                                            }`}>
                                                {topping.name}
                                            </span>
                                            
                                            {/* Right side: Price & Custom Checkbox */}
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs sm:text-sm font-heading font-extrabold ${
                                                    isSelected ? 'text-primary' : 'text-on-surface-variant/70'
                                                }`}>
                                                    +{formatPrice(topping.price)}
                                                </span>
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
                                                    isSelected 
                                                        ? 'bg-primary border-primary text-white shadow-sm shadow-primary/10' 
                                                        : 'border-gray-300 bg-white'
                                                }`}>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 stroke-[4] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Block 2B: Món ăn thêm (Side Add-ons: Trứng chần, Quẩy giòn, Bánh phở thêm...) */}
                    {toppingsThem.length > 0 && (
                        <div className="mt-2">
                            {/* Section title strip */}
                            <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-y border-gray-100 flex-shrink-0">
                                <div className="text-left">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-heading block">Món ăn thêm (Tùy chọn)</span>
                                    <span className="text-[9px] text-gray-400 font-body block mt-0.5">Ví dụ: gọi thêm trứng chần bổ dưỡng, đĩa quẩy giòn, bánh phở thêm...</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-200/65 px-2.5 py-0.5 rounded-full font-body">Chọn nhiều</span>
                            </div>
                            
                            {/* Toppings List Group */}
                            <div className="divide-y divide-gray-100 px-5 bg-white">
                                {toppingsThem.map(topping => {
                                    const isSelected = selectedToppings.some(t => t.id === topping.id);
                                    return (
                                        <div
                                            key={topping.id}
                                            onClick={() => handleToppingToggle(topping)}
                                            className="flex items-center justify-between py-4 cursor-pointer active:bg-gray-50/50 transition-colors duration-150"
                                        >
                                            {/* Topping name */}
                                            <span className={`text-xs sm:text-sm font-body font-semibold transition-colors duration-150 ${
                                                isSelected ? 'text-primary font-bold' : 'text-on-surface/85'
                                            }`}>
                                                {topping.name}
                                            </span>
                                            
                                            {/* Right side: Price & Custom Checkbox */}
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs sm:text-sm font-heading font-extrabold ${
                                                    isSelected ? 'text-primary' : 'text-on-surface-variant/70'
                                                }`}>
                                                    +{formatPrice(topping.price)}
                                                </span>
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
                                                    isSelected 
                                                        ? 'bg-primary border-primary text-white shadow-sm shadow-primary/10' 
                                                        : 'border-gray-300 bg-white'
                                                }`}>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 stroke-[4] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Block 3: Note Input */}
                    <div className="mt-2 bg-white border-t border-gray-100 pt-4 px-5 pb-2">
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold text-on-surface mb-2.5">
                            <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                                <MessageSquare size={12} className="text-primary" />
                            </div>
                            Ghi chú cho nhà bếp
                            <span className="text-on-surface-variant/50 text-[11px] font-body font-normal">(Không bắt buộc)</span>
                        </label>
                        <textarea
                            placeholder="Ví dụ: ít cay, nhiều đá, không lấy hành..."
                            className="w-full border border-gray-200/80 rounded-xl p-3 text-xs sm:text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/8 transition-all duration-300 h-[72px] resize-none bg-surface-container-low/50 font-body placeholder:text-on-surface-variant/40"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={150}
                        />
                        <div className="text-right text-[11px] text-on-surface-variant/40 mt-1 font-body">
                            {note.length}/150 ký tự
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer — safe area aware */}
                <div className="bg-white border-t border-gray-100/80 px-4 pt-3 flex items-center gap-3 z-20 flex-shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 bg-surface-container-high/80 rounded-xl p-1">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors duration-200 active:scale-90"
                            disabled={quantity <= 1}
                        >
                            <Minus size={16} />
                        </button>
                        <span className="w-7 text-center font-heading font-extrabold text-on-surface text-base">{quantity}</span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors duration-200 active:scale-90"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAdd}
                        className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-heading font-bold h-[48px] rounded-xl shadow-lg shadow-primary/15 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <span className="text-sm font-semibold">{isEditMode ? 'Cập nhật giỏ' : 'Thêm vào giỏ'}</span>
                        <span className="w-1 h-1 rounded-full bg-white/50"></span>
                        <span className="font-extrabold text-sm">{formatPrice(getUnitTotal() * quantity)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;


