import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    
    // Thêm món vào giỏ
    const addToCart = (product, quantity = 1, note = '') => {
        setCart(prev => {
            // Kiểm tra xem món này đã có trong giỏ với note giống nhau chưa
            const existingItemIndex = prev.findIndex(item => item.product_id === product.id && item.note === note);
            
            if (existingItemIndex >= 0) {
                const newCart = [...prev];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                return [...prev, {
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                    quantity: quantity,
                    note: note
                }];
            }
        });
    };

    // Xoá món khỏi giỏ
    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    // Cập nhật số lượng
    const updateQuantity = (index, delta) => {
        setCart(prev => {
            const newCart = [...prev];
            const newQuantity = newCart[index].quantity + delta;
            
            if (newQuantity <= 0) {
                return prev.filter((_, i) => i !== index);
            }
            
            newCart[index].quantity = newQuantity;
            return newCart;
        });
    };

    const clearCart = () => setCart([]);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
};
