import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Utensils, Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, 
  Layers, Package, Coffee, ChevronRight, LogOut, ArrowLeft, Image, Tag, DollarSign, ListFilter, PlusCircle
} from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:5001/api/staff`;

const MenuManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  // Tabs chính: 'products' (Món chính) hoặc 'toppings' (Món ăn cùng/thêm)
  const [mainTab, setMainTab] = useState('products');
  
  // Dữ liệu từ API
  const [products, setProducts] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Trạng thái bộ lọc
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [selectedToppingCategory, setSelectedToppingCategory] = useState('all');
  const [selectedToppingType, setSelectedToppingType] = useState('all'); // 'all', 'cung', 'them'

  // Trạng thái modal Món chính
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category_id: '',
    description: '',
    image_url: ''
  });

  // Trạng thái modal Topping
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState(null);
  const [toppingForm, setToppingForm] = useState({
    name: '',
    price: '',
    category_id: '',
    type: 'them' // 'them' hoặc 'cung'
  });

  // Sidebar di động thu gọn
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Đăng xuất
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Xác thực user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Tải dữ liệu ban đầu
  const fetchData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      // 1. Tải danh mục công khai
      const publicUrl = API_BASE_URL.replace('/staff', '/public');
      const catRes = await axios.get(`${publicUrl}/menu`);
      setCategories(catRes.data.map(cat => ({ id: cat.id, name: cat.name })));
      
      // Mặc định chọn danh mục đầu tiên cho form nếu chưa chọn
      if (catRes.data.length > 0) {
        setProductForm(prev => ({ ...prev, category_id: catRes.data[0].id }));
        setToppingForm(prev => ({ ...prev, category_id: catRes.data[0].id }));
      }

      // 2. Tải món chính
      const prodRes = await axios.get(`${API_BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(prodRes.data);

      // 3. Tải toppings
      const topRes = await axios.get(`${API_BASE_URL}/toppings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToppings(topRes.data);

    } catch (err) {
      console.error('Lỗi tải dữ liệu thực đơn:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError('Không thể kết nối đến server để tải thực đơn.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format tiền tệ
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // ========================== XỬ LÝ MÓN CHÍNH (PRODUCTS) ==========================
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      category_id: categories[0]?.id || '',
      description: '',
      image_url: ''
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      category_id: product.category_id,
      description: product.description || '',
      image_url: product.image_url || ''
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category_id) {
      alert('Vui lòng điền đầy đủ Tên món, Giá và Danh mục');
      return;
    }

    const token = localStorage.getItem('token');
    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      category_id: Number(productForm.category_id),
      description: productForm.description,
      image_url: productForm.image_url
    };

    try {
      if (editingProduct) {
        // Cập nhật
        await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Tạo mới
        await axios.post(`${API_BASE_URL}/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Lỗi khi lưu món chính:', err);
      alert(err.response?.data?.message || 'Không thể lưu món chính');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá món chính "${name}" không?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Lỗi khi xoá món chính:', err);
      alert('Không thể xoá món chính này. Hãy thử đặt trạng thái Ngưng phục vụ thay thế.');
    }
  };

  const handleToggleProductAvailable = async (product) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_BASE_URL}/products/${product.id}`, {
        name: product.name,
        price: product.price,
        category_id: product.category_id,
        description: product.description,
        image_url: product.image_url,
        is_available: !product.is_available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Cập nhật state nội bộ nhanh
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái phục vụ:', err);
      alert('Không thể cập nhật trạng thái phục vụ');
    }
  };

  // ========================== XỬ LÝ TOUPPING ==========================
  const handleOpenAddTopping = () => {
    setEditingTopping(null);
    setToppingForm({
      name: '',
      price: '',
      category_id: categories[0]?.id || '',
      type: 'them'
    });
    setIsToppingModalOpen(true);
  };

  const handleOpenEditTopping = (topping) => {
    setEditingTopping(topping);
    setToppingForm({
      name: topping.name,
      price: topping.price,
      category_id: topping.category_id || '',
      type: topping.type
    });
    setIsToppingModalOpen(true);
  };

  const handleSaveTopping = async (e) => {
    e.preventDefault();
    if (!toppingForm.name || toppingForm.price === '') {
      alert('Vui lòng nhập Tên món kèm/ăn cùng và Giá tiền');
      return;
    }

    const token = localStorage.getItem('token');
    const payload = {
      name: toppingForm.name,
      price: Number(toppingForm.price),
      category_id: toppingForm.category_id ? Number(toppingForm.category_id) : null,
      type: toppingForm.type
    };

    try {
      if (editingTopping) {
        await axios.put(`${API_BASE_URL}/toppings/${editingTopping.id}`, {
          ...payload,
          is_available: editingTopping.is_available
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/toppings`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsToppingModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Lỗi lưu topping:', err);
      alert(err.response?.data?.message || 'Không thể lưu món ăn kèm/cùng');
    }
  };

  const handleDeleteTopping = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá món ăn kèm "${name}" không?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE_URL}/toppings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error('Lỗi khi xoá món kèm:', err);
      alert('Không thể xoá món ăn kèm này');
    }
  };

  const handleToggleToppingAvailable = async (topping) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_BASE_URL}/toppings/${topping.id}`, {
        name: topping.name,
        price: topping.price,
        category_id: topping.category_id,
        type: topping.type,
        is_available: !topping.is_available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Cập nhật state nội bộ
      setToppings(prev => prev.map(t => t.id === topping.id ? { ...t, is_available: !t.is_available } : t));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái món kèm:', err);
      alert('Không thể cập nhật trạng thái phục vụ');
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredProducts = products.filter(p => {
    if (selectedProductCategory === 'all') return true;
    return p.category_id === Number(selectedProductCategory);
  });

  const filteredToppings = toppings.filter(t => {
    const matchCategory = selectedToppingCategory === 'all' || t.category_id === Number(selectedToppingCategory);
    const matchType = selectedToppingType === 'all' || t.type === selectedToppingType;
    return matchCategory && matchType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* 1. SIDEBAR CHO HOST/ADMIN */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:flex'}`}>
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <Utensils className="text-white h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-extrabold tracking-wider font-heading text-white uppercase">Phở Gia Truyền</h2>
            <p className="text-[10px] text-gray-400 font-body">Hệ thống quản trị Host</p>
          </div>
          {/* Nút đóng sidebar di động */}
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden ml-auto text-slate-400 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Danh sách tab điều hướng */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => navigate('/staff/orders')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer ${
              location.pathname === '/staff/orders'
                ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Layers size={18} />
            <span>Màn nhận đơn</span>
          </button>

          <button
            onClick={() => navigate('/staff/menu')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer ${
              location.pathname === '/staff/menu'
                ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Package size={18} />
            <span>Quản lý thực đơn</span>
          </button>
        </nav>

        {/* Thông tin User & Logout ở đáy */}
        <div className="p-4 border-t border-white/5 space-y-3">
          {user && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-extrabold font-heading text-white truncate">{user.name}</p>
                <p className="text-[9px] font-bold font-body text-primary uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 text-xs font-heading font-bold transition-all duration-200 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </aside>

      {/* Background Overlay cho Sidebar trên di động */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. CHỨA NỘI DUNG CHÍNH */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header di động */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Nút bật Sidebar di động */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/10"
            >
              <Utensils size={18} />
            </button>
            <div className="text-left">
              <h1 className="text-lg lg:text-xl font-extrabold tracking-tight font-heading text-white flex items-center gap-2">
                Quản lý Thực đơn
              </h1>
              <p className="text-xs text-gray-400 font-body hidden sm:block">Chỉnh sửa danh mục món ăn chính và các món kèm</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Nút quay lại Màn nhận đơn */}
            <button
              onClick={() => navigate('/staff/orders')}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-200 font-heading font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Quay lại Bàn đơn</span>
            </button>
          </div>
        </header>

        {/* Nội dung trang */}
        <div className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3">
              <X className="flex-shrink-0" size={18} />
              <p className="text-sm font-body font-bold">{error}</p>
            </div>
          )}

          {/* 3. MENU TABS CHÍNH */}
          <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl w-full max-w-md">
            <button
              onClick={() => setMainTab('products')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-heading font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                mainTab === 'products'
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>Món ăn chính</span>
            </button>

            <button
              onClick={() => setMainTab('toppings')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-heading font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                mainTab === 'toppings'
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coffee size={14} />
              <span>Món kèm & Ăn cùng</span>
            </button>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 font-body">Đang tải dữ liệu thực đơn...</p>
            </div>
          ) : (
            <>
              {/* ================================== TAB 1: MÓN CHÍNH ================================== */}
              {mainTab === 'products' && (
                <div className="space-y-6">
                  {/* BỘ LỌC VÀ THÊM MỚI */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <ListFilter size={16} className="text-gray-400" />
                      <span className="text-xs font-heading font-bold text-gray-400">Lọc danh mục:</span>
                      <select
                        value={selectedProductCategory}
                        onChange={(e) => setSelectedProductCategory(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50"
                      >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white text-xs font-heading font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10"
                    >
                      <PlusCircle size={16} />
                      <span>Thêm Món chính mới</span>
                    </button>
                  </div>

                  {/* GRID DANH SÁCH MÓN CHÍNH */}
                  {filteredProducts.length === 0 ? (
                    <div className="py-16 text-center bg-slate-900/20 border border-dashed border-white/10 rounded-3xl">
                      <Layers size={36} className="mx-auto text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-400 font-heading">Không tìm thấy món ăn nào</p>
                      <p className="text-xs text-slate-500 font-body mt-1">Vui lòng thay đổi bộ lọc hoặc thêm món mới</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredProducts.map(product => (
                        <div 
                          key={product.id}
                          className={`relative bg-slate-900/60 backdrop-blur-sm border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-white/10 hover:shadow-xl ${
                            !product.is_available ? 'opacity-70 border-white/5' : 'border-white/5'
                          }`}
                        >
                          <div>
                            {/* Đầu thẻ món: Ảnh và danh mục */}
                            <div className="flex gap-4">
                              <div className="w-16 h-16 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5 relative">
                                {product.image_url ? (
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = ''; }} // Fallback
                                  />
                                ) : (
                                  <Image size={24} className="text-slate-600" />
                                )}
                                {!product.is_available && (
                                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[9px] font-bold text-rose-400 uppercase tracking-widest text-center px-1">
                                    Hết món
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 text-left">
                                <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg">
                                  {product.category_name}
                                </span>
                                <h3 className="text-sm font-heading font-extrabold text-white mt-1.5">{product.name}</h3>
                                <p className="text-xs font-bold text-primary font-heading mt-0.5">{formatPrice(product.price)}</p>
                              </div>
                            </div>

                            {/* Mô tả món ăn */}
                            {product.description && (
                              <p className="text-xs text-gray-400 font-body mt-4 line-clamp-2 text-left">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Khu vực Actions */}
                          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                            {/* Trạng thái Phục vụ (is_available) */}
                            <button
                              onClick={() => handleToggleProductAvailable(product)}
                              className="flex items-center gap-2 text-left cursor-pointer group"
                            >
                              {product.is_available ? (
                                <span className="text-emerald-400 flex items-center gap-1.5 text-xs font-heading font-bold">
                                  <ToggleRight size={24} className="text-emerald-500" />
                                  <span>Đang bán</span>
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center gap-1.5 text-xs font-heading font-bold">
                                  <ToggleLeft size={24} className="text-slate-600" />
                                  <span>Ngưng bán</span>
                                </span>
                              )}
                            </button>

                            {/* Sửa / Xóa */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditProduct(product)}
                                className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all duration-200 cursor-pointer"
                                title="Sửa thông tin"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="p-2 bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-500 hover:text-rose-400 rounded-xl transition-all duration-200 cursor-pointer"
                                title="Xóa món"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ================================== TAB 2: TOPPINGS & MÓN ĂN THÊM ================================== */}
              {mainTab === 'toppings' && (
                <div className="space-y-6">
                  {/* BỘ LỌC VÀ THÊM MỚI */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Bộ lọc Loại món thêm */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-bold text-gray-400">Phân loại món:</span>
                        <select
                          value={selectedToppingType}
                          onChange={(e) => setSelectedToppingType(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50"
                        >
                          <option value="all">Tất cả món kèm</option>
                          <option value="cung">Món ăn cùng (Trong tô - Ví dụ: Gân, Nạm)</option>
                          <option value="them">Món ăn thêm (Gọi riêng - Ví dụ: Quẩy, Trứng)</option>
                        </select>
                      </div>

                      {/* Bộ lọc Danh mục đi kèm */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-heading font-bold text-gray-400">Danh mục gắn kèm:</span>
                        <select
                          value={selectedToppingCategory}
                          onChange={(e) => setSelectedToppingCategory(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50"
                        >
                          <option value="all">Tất cả danh mục</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenAddTopping}
                      className="px-4 py-2.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white text-xs font-heading font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10 whitespace-nowrap"
                    >
                      <PlusCircle size={16} />
                      <span>Thêm Món kèm mới</span>
                    </button>
                  </div>

                  {/* DANH SÁCH TOPPINGS CHIA LÀM HAI KHỐI RIÊNG BIỆT */}
                  {filteredToppings.length === 0 ? (
                    <div className="py-16 text-center bg-slate-900/20 border border-dashed border-white/10 rounded-3xl">
                      <Coffee size={36} className="mx-auto text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-400 font-heading">Không tìm thấy món kèm/ăn cùng nào</p>
                      <p className="text-xs text-slate-500 font-body mt-1">Vui lòng thay đổi bộ lọc hoặc thêm món kèm mới</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* BẢNG 1: MÓN ĂN CÙNG (TYPE === 'CUNG') */}
                      {(selectedToppingType === 'all' || selectedToppingType === 'cung') && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-left">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <h2 className="text-md font-heading font-extrabold text-white">Món Ăn Cùng (Ăn trong bát phở)</h2>
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-body">
                              Ví dụ: Gân bò, Nạm bò, Tái thêm...
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredToppings.filter(t => t.type === 'cung').map(topping => (
                              <ToppingCard 
                                key={topping.id}
                                topping={topping}
                                formatPrice={formatPrice}
                                handleToggle={handleToggleToppingAvailable}
                                handleEdit={handleOpenEditTopping}
                                handleDelete={handleDeleteTopping}
                              />
                            ))}
                            {filteredToppings.filter(t => t.type === 'cung').length === 0 && (
                              <div className="col-span-full py-6 text-center text-slate-500 text-xs font-body italic">
                                Không có món ăn cùng nào trong bộ lọc này
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* BẢNG 2: MÓN ĂN THÊM (TYPE === 'THEM') */}
                      {(selectedToppingType === 'all' || selectedToppingType === 'them') && (
                        <div className="space-y-4 pt-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-left">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <h2 className="text-md font-heading font-extrabold text-white">Món Ăn Thêm (Gọi đĩa riêng/Ăn ngoài)</h2>
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-body">
                              Ví dụ: Trứng chần, Quẩy giòn, Bánh phở thêm, Coca...
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredToppings.filter(t => t.type === 'them').map(topping => (
                              <ToppingCard 
                                key={topping.id}
                                topping={topping}
                                formatPrice={formatPrice}
                                handleToggle={handleToggleToppingAvailable}
                                handleEdit={handleOpenEditTopping}
                                handleDelete={handleDeleteTopping}
                              />
                            ))}
                            {filteredToppings.filter(t => t.type === 'them').length === 0 && (
                              <div className="col-span-full py-6 text-center text-slate-500 text-xs font-body italic">
                                Không có món ăn thêm nào trong bộ lọc này
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ================================== MODAL THÊM / SỬA MÓN CHÍNH ================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-float-up text-left">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h2 className="text-md font-heading font-extrabold text-white">
                {editingProduct ? `Sửa món chính: ${editingProduct.name}` : 'Thêm món chính mới'}
              </h2>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 font-body">
              {/* Tên món */}
              <div className="space-y-1">
                <label className="text-xs font-heading font-bold text-gray-400">Tên món ăn <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Utensils className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Ví dụ: Phở bò tái nạm"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Hàng: Giá và Danh mục */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-heading font-bold text-gray-400">Giá bán (đ) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="Ví dụ: 45000"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-heading font-bold text-gray-400">Danh mục <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <select
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-primary/50 appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Đường dẫn ảnh */}
              <div className="space-y-1">
                <label className="text-xs font-heading font-bold text-gray-400">Đường dẫn ảnh sản phẩm (URL)</label>
                <div className="relative">
                  <Image className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/pho-bo.jpg"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Mô tả sản phẩm */}
              <div className="space-y-1">
                <label className="text-xs font-heading font-bold text-gray-400">Mô tả chi tiết</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Mô tả các thành phần cấu tạo món ăn..."
                  rows="3"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50 resize-none"
                />
              </div>

              {/* Lưu */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-heading font-bold rounded-xl text-xs text-center transition-all duration-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white font-heading font-extrabold rounded-xl text-xs text-center transition-all duration-200 cursor-pointer shadow-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================== MODAL THÊM / SỬA MÓN KÈM (TOPPING) ================================== */}
      {isToppingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-float-up text-left">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h2 className="text-md font-heading font-extrabold text-white">
                {editingTopping ? `Sửa món ăn kèm: ${editingTopping.name}` : 'Thêm món ăn kèm mới'}
              </h2>
              <button 
                onClick={() => setIsToppingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTopping} className="mt-4 space-y-4 font-body">
              {/* Tên món kèm */}
              <div className="space-y-1">
                <label className="text-xs font-heading font-bold text-gray-400">Tên món kèm/ăn cùng <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Coffee className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <input
                    type="text"
                    required
                    value={toppingForm.name}
                    onChange={(e) => setToppingForm({ ...toppingForm, name: e.target.value })}
                    placeholder="Ví dụ: Gân bò thêm, Trứng chần..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Hàng: Giá và Phân loại */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-heading font-bold text-gray-400">Giá bán (đ) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={toppingForm.price}
                      onChange={(e) => setToppingForm({ ...toppingForm, price: e.target.value })}
                      placeholder="Ví dụ: 10000"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-heading font-bold text-gray-400">Phân loại món kèm <span className="text-rose-500">*</span></label>
                  <select
                    value={toppingForm.type}
                    onChange={(e) => setToppingForm({ ...toppingForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                  >
                    <option value="cung">Món ăn cùng (Trong tô)</option>
                    <option value="them">Món ăn thêm (Gọi đĩa riêng)</option>
                  </select>
                </div>
              </div>

              {/* Gắn với danh mục sản phẩm (tùy chọn) */}
              <div className="space-y-1">
                <label className="text-xs font-heading font-bold text-gray-400">Gắn với Danh mục món chính (Tùy chọn)</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <select
                    value={toppingForm.category_id}
                    onChange={(e) => setToppingForm({ ...toppingForm, category_id: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-primary/50 appearance-none"
                  >
                    <option value="">(Không giới hạn danh mục)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-500">Nếu chọn danh mục, món kèm này sẽ chỉ hiển thị khi khách hàng chọn món chính thuộc danh mục đó.</p>
              </div>

              {/* Lưu */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsToppingModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-heading font-bold rounded-xl text-xs text-center transition-all duration-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white font-heading font-extrabold rounded-xl text-xs text-center transition-all duration-200 cursor-pointer shadow-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Component thẻ nhỏ cho Topping để tái sử dụng
const ToppingCard = ({ topping, formatPrice, handleToggle, handleEdit, handleDelete }) => {
  return (
    <div 
      className={`bg-slate-900/40 border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-white/10 ${
        !topping.is_available ? 'opacity-70 border-white/5' : 'border-white/5'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="text-left">
          <h4 className="text-xs font-heading font-extrabold text-white">{topping.name}</h4>
          <span className="text-[10px] text-gray-500 font-body">
            {topping.category_name ? `Gắn với: ${topping.category_name}` : 'Mọi danh mục'}
          </span>
        </div>
        <p className="text-xs font-bold text-primary font-heading">{formatPrice(topping.price)}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        {/* Toggle bán */}
        <button
          onClick={() => handleToggle(topping)}
          className="flex items-center gap-1.5 cursor-pointer text-left"
        >
          {topping.is_available ? (
            <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-heading font-bold">
              <ToggleRight size={20} className="text-emerald-500" />
              <span>Đang bán</span>
            </span>
          ) : (
            <span className="text-rose-400 flex items-center gap-1 text-[11px] font-heading font-bold">
              <ToggleLeft size={20} className="text-slate-600" />
              <span>Hết món</span>
            </span>
          )}
        </button>

        {/* Cụm chỉnh sửa/xóa */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(topping)}
            className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
            title="Sửa món kèm"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => handleDelete(topping.id, topping.name)}
            className="p-1.5 bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-all duration-200 cursor-pointer"
            title="Xóa món kèm"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
