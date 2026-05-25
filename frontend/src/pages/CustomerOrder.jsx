import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Search, ChefHat, ArrowRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import CartModal from '../components/CartModal';
import ProductDetailModal from '../components/ProductDetailModal';

const API_BASE_URL = 'http://localhost:5001/api/public';

// Bản đồ Emoji động theo tên danh mục ẩm thực Việt
const categoryEmojis = {
    'Phở': '🍜',
    'Bún bò': '🍲',
    'Bún bò trộn': '🥗',
    'Cơm chiên': '🍛',
    'Giải khát': '🥤',
    'Cà phê': '☕',
    'Trà sữa': '🍵',
    'Món ăn nhẹ': '🍟'
};

const CustomerOrder = () => {
    const { tableCode } = useParams();
    const navigate = useNavigate();
    const [tableInfo, setTableInfo] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    // Modals & Sheets
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Category scroll states
    const [activeCategory, setActiveCategory] = useState(null);
    const categoryTabsRef = useRef(null);
    const isManualScrolling = useRef(false);

    // Animation state for floating cart
    const [cartAnimate, setCartAnimate] = useState(false);
    
    // Header scroll state
    const [isScrolled, setIsScrolled] = useState(false);

    const { totalItems, totalPrice, cart, clearCart } = useCart();

    // Giả lập token được quét từ mã QR trên URL (vd: ?token=abc)
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token') || 'token_table_1_abc123';

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Lấy thông tin bàn
                const tableRes = await axios.get(`${API_BASE_URL}/tables/${tableCode}?token=${token}`);
                setTableInfo(tableRes.data.table);

                // Lấy menu
                const menuRes = await axios.get(`${API_BASE_URL}/menu`);
                setMenu(menuRes.data);
                
                // Active danh mục đầu tiên
                if (menuRes.data.length > 0) {
                    setActiveCategory(menuRes.data[0].id);
                }
            } catch (error) {
                console.error('Lỗi tải dữ liệu:', error);
                alert('Không thể tải thông tin bàn hoặc mã QR không hợp lệ!');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [tableCode, token]);

    // Scroll header effect
    useEffect(() => {
        const handleHeaderScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleHeaderScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleHeaderScroll);
    }, []);

    // Trình theo dõi vị trí cuộn để thay đổi Active Category Tab (Scrollspy)
    useEffect(() => {
        if (menu.length === 0) return;

        const handleScroll = () => {
            if (isManualScrolling.current) return;

            const scrollPosition = window.scrollY + 160; // Offset cho Sticky Header + Tabs + Search

            for (let i = 0; i < menu.length; i++) {
                const category = menu[i];
                const element = document.getElementById(`category-${category.id}`);
                if (element) {
                    const top = element.offsetTop;
                    const height = element.offsetHeight;
                    
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveCategory(category.id);
                        
                        // Tự động cuộn thanh ngang Category Tabs để hiển thị tab đang active
                        const tabElement = document.getElementById(`tab-${category.id}`);
                        if (tabElement && categoryTabsRef.current) {
                            const container = categoryTabsRef.current;
                            const containerWidth = container.offsetWidth;
                            const tabLeft = tabElement.offsetLeft;
                            const tabWidth = tabElement.offsetWidth;
                            
                            container.scrollTo({
                                left: tabLeft - (containerWidth / 2) + (tabWidth / 2),
                                behavior: 'smooth'
                            });
                        }
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [menu]);

    // Kích hoạt hiệu ứng nảy nhẹ khi thêm món mới vào giỏ
    useEffect(() => {
        if (totalItems > 0) {
            setCartAnimate(true);
            const timer = setTimeout(() => setCartAnimate(false), 400);
            return () => clearTimeout(timer);
        }
    }, [totalItems]);

    const scrollToCategory = (categoryId) => {
        const element = document.getElementById(`category-${categoryId}`);
        if (element) {
            isManualScrolling.current = true;
            setActiveCategory(categoryId);

            const headerOffset = 155; // Chiều cao Sticky Header + Tabs + Search
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Mở khóa scrollspy sau khi hoàn tất cuộn mượt
            setTimeout(() => {
                isManualScrolling.current = false;
            }, 600);
        }
    };

    const handleCheckout = async (customerNote) => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        
        try {
            const payload = {
                table_code: tableCode,
                qr_token: token,
                customer_note: customerNote,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    note: item.note
                }))
            };

            const response = await axios.post(`${API_BASE_URL}/orders`, payload);
            clearCart();
            setIsCartOpen(false);
            
            // Chuyển hướng sang trang trạng thái
            navigate(`/status/${response.data.order_id}`);
        } catch (error) {
            console.error('Lỗi đặt hàng:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi đặt món');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Hàm lấy danh sách món ăn bán chạy (Mỗi danh mục lấy 1 món đầu tiên)
    const getBestSellers = () => {
        const list = [];
        menu.forEach(cat => {
            if (cat.products.length > 0) {
                const availableProduct = cat.products.find(p => p.is_available) || cat.products[0];
                list.push(availableProduct);
            }
        });
        return list.slice(0, 4);
    };

    // Client-side search filter
    const getFilteredMenu = () => {
        if (!searchQuery.trim()) return menu;
        const query = searchQuery.toLowerCase().trim();
        return menu.map(category => ({
            ...category,
            products: category.products.filter(product =>
                product.name.toLowerCase().includes(query) ||
                (product.description && product.description.toLowerCase().includes(query))
            )
        })).filter(category => category.products.length > 0);
    };

    const bestSellers = getBestSellers();
    const filteredMenu = getFilteredMenu();

    if (loading) {
        return (
            <div className="bg-[#FDFCF9] min-h-screen pb-12 animate-fade-in">
                {/* Skeleton Header */}
                <div className="sticky top-0 z-40 bg-white border-b border-gray-100/50 px-5 py-3.5 flex justify-between items-center max-w-lg mx-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 shimmer flex-shrink-0"></div>
                        <div className="space-y-1.5">
                            <div className="w-24 h-4 bg-gray-100 shimmer rounded-md"></div>
                            <div className="w-16 h-3 bg-gray-100 shimmer rounded-md"></div>
                        </div>
                    </div>
                    <div className="w-20 h-7 bg-gray-100 shimmer rounded-full"></div>
                </div>

                {/* Skeleton Search */}
                <div className="px-5 py-2.5 max-w-lg mx-auto">
                    <div className="w-full h-11 bg-gray-100 shimmer rounded-2xl"></div>
                </div>

                {/* Skeleton Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 px-5 pb-3 pt-0.5 max-w-lg mx-auto">
                    <div className="w-20 h-9 bg-gray-100 shimmer rounded-2xl flex-shrink-0"></div>
                    <div className="w-24 h-9 bg-gray-100 shimmer rounded-2xl flex-shrink-0"></div>
                    <div className="w-28 h-9 bg-gray-100 shimmer rounded-2xl flex-shrink-0"></div>
                    <div className="w-20 h-9 bg-gray-100 shimmer rounded-2xl flex-shrink-0"></div>
                </div>

                {/* Skeleton Best Sellers Title */}
                <div className="p-4 max-w-lg mx-auto space-y-4">
                    <div className="w-40 h-5 bg-gray-100 shimmer rounded-md pl-1"></div>
                    {/* Horizontal cards shimmer */}
                    <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-4 px-4 pb-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-44 h-48 flex-shrink-0 bg-white rounded-3xl p-3 border border-gray-100 shadow-soft flex flex-col justify-between">
                                <div className="w-full h-24 bg-gray-100 shimmer rounded-2xl"></div>
                                <div className="space-y-1.5 mt-2">
                                    <div className="w-3/4 h-3.5 bg-gray-100 shimmer rounded-md"></div>
                                    <div className="w-1/2 h-3 bg-gray-100 shimmer rounded-md"></div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="w-12 h-4 bg-gray-100 shimmer rounded-md"></div>
                                    <div className="w-5 h-5 bg-gray-100 shimmer rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Menu items list shimmer */}
                    <div className="space-y-6 pt-4">
                        <div className="w-32 h-5 bg-gray-100 shimmer rounded-md pl-1"></div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-3.5 border border-gray-100 shadow-soft flex items-center justify-between gap-4">
                                <div className="flex-1 space-y-2.5 pr-2">
                                    <div className="w-2/3 h-4.5 bg-gray-100 shimmer rounded-md"></div>
                                    <div className="space-y-1.5">
                                        <div className="w-full h-3 bg-gray-100 shimmer rounded-md"></div>
                                        <div className="w-5/6 h-3 bg-gray-100 shimmer rounded-md"></div>
                                    </div>
                                    <div className="w-16 h-5 bg-gray-100 shimmer rounded-md mt-2"></div>
                                </div>
                                <div className="w-24 h-24 bg-gray-100 shimmer rounded-2xl flex-shrink-0"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!tableInfo) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-error-container/30 text-error w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-error/10">
                    <ChefHat size={32} />
                </div>
                <h2 className="text-xl font-heading font-bold text-on-surface mb-2">Bàn ăn không hợp lệ</h2>
                <p className="text-sm text-on-surface-variant/60 max-w-[280px] font-body">Mã bàn hoặc QR token đã hết hạn hoặc không đúng. Vui lòng quét lại mã QR tại bàn.</p>
            </div>
        );
    }

    return (
        <div className="bg-surface min-h-screen pb-32">
            
            {/* Sticky Header & Tabs Container */}
            <div className={`sticky top-0 z-40 transition-all duration-300 ${
                isScrolled 
                    ? 'header-scrolled' 
                    : 'bg-white/95 backdrop-blur-md'
            } border-b border-gray-100/50`}>
                
                {/* Header chính */}
                <div className="px-5 py-3 flex justify-between items-center max-w-lg mx-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-tr from-primary to-orange-500 text-white p-2.5 rounded-2xl shadow-md shadow-primary/15">
                            <ChefHat size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-heading font-extrabold text-on-surface tracking-tight flex items-center gap-1.5">
                                QR Order <span className="text-primary text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg bg-primary/5 border border-primary/10">PRO</span>
                            </h1>
                            <p className="text-[10px] text-on-surface-variant/50 font-heading font-semibold tracking-wider uppercase">Ẩm thực Việt tinh túy</p>
                        </div>
                    </div>
                    
                    {/* Bàn hiển thị */}
                    <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-100/50 rounded-full px-3.5 py-2 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-heading font-bold text-emerald-700 tracking-wide">{tableInfo.table_name}</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-5 pb-2.5 max-w-lg mx-auto">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            placeholder="Tìm món ăn..."
                            className={`w-full h-11 pl-11 pr-10 bg-surface-container-low/80 border rounded-2xl text-sm font-body search-input transition-all duration-300 placeholder:text-on-surface-variant/40 ${
                                isSearchFocused 
                                    ? 'border-primary/25 bg-white shadow-sm' 
                                    : 'border-gray-100/80'
                            }`}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories Horizontal Tabs */}
                {!searchQuery && (
                    <div 
                        ref={categoryTabsRef}
                        className="flex overflow-x-auto no-scrollbar gap-2 px-5 pb-3 pt-0.5 max-w-lg mx-auto scroll-smooth"
                    >
                        {menu.map((category) => (
                            category.products.length > 0 && (
                                <button
                                    key={category.id}
                                    id={`tab-${category.id}`}
                                    onClick={() => scrollToCategory(category.id)}
                                    className={`px-4 py-2.5 rounded-2xl text-xs font-heading font-bold whitespace-nowrap transition-all duration-300 border ${
                                        activeCategory === category.id
                                            ? 'bg-gradient-to-r from-primary to-orange-500 text-white border-transparent shadow-md shadow-primary/15 scale-[1.03]'
                                            : 'bg-white text-on-surface-variant/60 border-gray-100/80 hover:bg-surface-container-low hover:border-gray-200/80'
                                    }`}
                                >
                                    <span className="mr-1.5">
                                        {categoryEmojis[category.name] || '🍽️'}
                                    </span>
                                    <span>{category.name}</span>
                                </button>
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Menu List & Best Sellers */}
            <div className="p-4 max-w-lg mx-auto space-y-7">
                
                {/* Search Results Info */}
                {searchQuery && (
                    <div className="flex items-center gap-2 py-2">
                        <Search size={14} className="text-on-surface-variant/40" />
                        <span className="text-sm text-on-surface-variant/60 font-body">
                            {filteredMenu.reduce((sum, cat) => sum + cat.products.length, 0)} kết quả cho "{searchQuery}"
                        </span>
                    </div>
                )}

                {/* 1. BEST SELLERS CAROUSEL SLIDER */}
                {!searchQuery && bestSellers.length > 0 && (
                    <div className="mb-2 animate-float-up">
                        <h3 className="font-heading font-extrabold text-on-surface text-sm tracking-wide uppercase mb-3.5 pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-primary to-orange-500"></span>
                            <span>🔥 Gợi ý món chạy nhất</span>
                        </h3>
                        
                        <div className="flex overflow-x-auto gap-3.5 no-scrollbar pb-3 pt-0.5 -mx-4 px-4 scroll-smooth">
                            {bestSellers.map((product, idx) => {
                                const cartItems = cart.filter(item => item.product_id === product.id);
                                const qty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

                                return (
                                    <div 
                                        key={`featured-${product.id}`}
                                        onClick={() => handleProductSelect(product)}
                                        className={`w-44 flex-shrink-0 bg-white rounded-3xl p-3 border border-gray-100/80 shadow-soft flex flex-col relative transition-all duration-300 active:scale-[0.97] hover:shadow-soft-lg cursor-pointer group animate-float-up animate-float-up-${idx + 1}`}
                                    >
                                        {/* Star Badge */}
                                        <div className="absolute top-4 left-4 glass-card px-2 py-0.5 rounded-lg text-[9px] font-heading font-bold text-amber-600 flex items-center gap-0.5 z-10">
                                            <span>⭐</span>
                                            <span>4.9</span>
                                        </div>

                                        {/* Food Image */}
                                        <div className="w-full h-28 rounded-2xl overflow-hidden mb-3 border border-gray-50 bg-surface-container-low">
                                            <img 
                                                src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'} 
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* Name & Desc */}
                                        <h4 className="font-heading font-bold text-on-surface text-xs leading-snug line-clamp-1">{product.name}</h4>
                                        <p className="text-on-surface-variant/50 text-[10px] line-clamp-1 mt-0.5 leading-relaxed font-body">{product.description || 'Hương vị truyền thống thơm ngon'}</p>

                                        {/* Bottom Price & Add Badge */}
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-primary font-heading font-extrabold text-xs">{formatPrice(product.price)}</span>
                                            {qty > 0 ? (
                                                <span className="bg-gradient-to-r from-primary to-orange-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale-in font-heading">
                                                    {qty}
                                                </span>
                                            ) : (
                                                <span className="bg-primary/5 text-primary font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-primary/10">
                                                    +
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. MAIN CATEGORIES VERTICAL LIST */}
                {filteredMenu.map((category, catIdx) => (
                    category.products.length > 0 && (
                        <div 
                            key={category.id} 
                            id={`category-${category.id}`}
                            className="pt-2"
                        >
                            {/* Tiêu đề Danh mục */}
                            <div className={`flex items-center gap-2.5 mb-4 pl-1 animate-float-up animate-float-up-${Math.min(catIdx + 1, 5)}`}>
                                <span className="text-lg">{categoryEmojis[category.name] || '🍽️'}</span>
                                <h2 className="text-base font-heading font-extrabold text-on-surface uppercase tracking-wide">
                                    {category.name}
                                </h2>
                                <span className="text-[10px] font-heading font-bold text-on-surface-variant/40 bg-surface-container-high/60 px-2.5 py-1 rounded-full">
                                    {category.products.length} món
                                </span>
                            </div>
                            
                            {/* Grid món ăn */}
                            <div className="space-y-3">
                                {category.products.map(product => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={product} 
                                        onSelect={handleProductSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {/* Empty search results */}
                {searchQuery && filteredMenu.length === 0 && (
                    <div className="text-center py-16 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-surface-container-high/60 flex items-center justify-center">
                            <Search size={28} className="text-on-surface-variant/25" />
                        </div>
                        <p className="font-heading font-bold text-on-surface/60 text-sm">Không tìm thấy món ăn</p>
                        <p className="text-xs text-on-surface-variant/40 font-body">Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm</p>
                    </div>
                )}
            </div>

            {/* Floating Glassmorphic Cart Bar */}
            {totalItems > 0 && (
                <div 
                    className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md z-30 transition-all duration-400 ${
                        cartAnimate ? 'scale-[1.02]' : ''
                    }`}
                >
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full glass-panel-dark text-white shadow-2xl shadow-black/20 rounded-3xl p-4 flex justify-between items-center active:scale-[0.97] transition-all duration-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative bg-gradient-to-br from-primary to-orange-500 p-2.5 rounded-xl text-white shadow-md shadow-primary/20">
                                <ShoppingBag size={18} className="stroke-[2.5]" />
                                <span className="absolute -top-1.5 -right-1.5 bg-white text-primary font-heading font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce-subtle">
                                    {totalItems}
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-gray-400 font-heading font-bold uppercase tracking-wider">Tổng cộng</p>
                                <p className="text-base font-heading font-extrabold text-white">{formatPrice(totalPrice)}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-orange-500 text-white py-2.5 px-4 rounded-2xl font-heading font-bold text-xs shadow-md shadow-primary/10">
                            <span>Xem giỏ</span>
                            <ArrowRight size={14} className="stroke-[3]" />
                        </div>
                    </button>
                </div>
            )}

            {/* Food Detail Bottom Sheet */}
            <ProductDetailModal 
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                product={selectedProduct}
            />

            {/* Cart Bottom Sheet */}
            <CartModal 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                onCheckout={handleCheckout}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default CustomerOrder;
