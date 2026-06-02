import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Hàm so sánh hai tập hợp toppings xem có giống hệt nhau không
const areToppingsEqual = (t1 = [], t2 = []) => {
    if (t1.length !== t2.length) return false;
    const ids1 = t1.map(t => t.id).sort();
    const ids2 = t2.map(t => t.id).sort();
    return ids1.every((id, idx) => id === ids2[idx]);
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    
    // Thêm món vào giỏ
    const addToCart = (product, quantity = 1, note = '', selectedToppings = []) => {
        setCart(prev => {
            // Kiểm tra xem món này đã có trong giỏ với note và toppings giống hệt nhau chưa
            const existingItemIndex = prev.findIndex(item => 
                item.product_id === product.id && 
                item.note === note &&
                areToppingsEqual(item.toppings, selectedToppings)
            );
            
            if (existingItemIndex >= 0) {
                return prev.map((item, idx) => {
                    if (idx === existingItemIndex) {
                        return {
                            ...item,
                            quantity: item.quantity + quantity
                        };
                    }
                    return item;
                });
            } else {
                return [...prev, {
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                    quantity: quantity,
                    note: note,
                    toppings: selectedToppings
                }];
            }
        });
    };

    // Xoá món khỏi giỏ
    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    // Cập nhật số lượng đơn thuần từ stepper ngoài giỏ hàng
    const updateQuantity = (index, delta) => {
        setCart(prev => {
            const item = prev[index];
            if (!item) return prev;
            
            const newQuantity = item.quantity + delta;
            
            if (newQuantity <= 0) {
                return prev.filter((_, i) => i !== index);
            }
            
            return prev.map((item, idx) => {
                if (idx === index) {
                    return {
                        ...item,
                        quantity: newQuantity
                    };
                }
                return item;
            });
        });
    };

    // Cập nhật cấu hình chi tiết món ăn (số lượng, ghi chú, toppings) sau khi chỉnh sửa
    const updateCartItem = (index, updatedFields) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = {
                ...newCart[index],
                ...updatedFields
            };
            return newCart;
        });
    };

    const clearCart = () => setCart([]);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => {
        const toppingsPrice = (item.toppings || []).reduce((tSum, t) => tSum + Number(t.price), 0);
        return sum + ((Number(item.price) + toppingsPrice) * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            updateCartItem, 
            clearCart, 
            totalItems, 
            totalPrice 
        }}>
            {children}
        </CartContext.Provider>
    );
};

