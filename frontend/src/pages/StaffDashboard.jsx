import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Bell, LogOut, Check, Utensils, Award, X, CheckCircle, Clock, 
  MapPin, AlertCircle, ShoppingBag, CreditCard, User, RotateCcw, Plus, Layers, Package, TrendingUp
} from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:5001/api/staff`;
const SOCKET_URL = `http://${window.location.hostname}:5001`;

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  
  // Trạng thái toast thông báo nhanh
  const [toast, setToast] = useState({ show: false, message: '', orderCode: '' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const socketRef = useRef(null);

  // Trạng thái chia tiền thanh toán món lẻ (bàn ghép)
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [selectedTableCode, setSelectedTableCode] = useState(null);
  const [selectedSplitItems, setSelectedSplitItems] = useState({}); // { [orderItemId]: quantity }



  // Lấy danh sách bàn kèm các món ăn chưa thanh toán gom nhóm theo từng đơn hàng cụ thể
  const getTablesWithUnpaid = () => {
    const tables = {};

    unpaidOrders.forEach(order => {
      const code = order.table_code;
      if (!tables[code]) {
        tables[code] = {
          table_name: order.table_name,
          table_code: code,
          orders: [] // Danh sách đơn hàng riêng lẻ
        };
      }

      tables[code].orders.push({
        id: order.id,
        order_code: order.order_code,
        created_at: order.created_at,
        items: (order.items || []).map(item => ({
          id: item.id,
          product_name: item.product_name,
          unit_price: parseFloat(item.unit_price) || 0,
          quantity: item.quantity || 0
        }))
      });
    });

    return tables;
  };

  // Tính tổng số tiền chia lẻ đã chọn
  const calculateSplitTotal = () => {
    if (!selectedTableCode) return 0;
    const table = getTablesWithUnpaid()[selectedTableCode];
    if (!table) return 0;

    let total = 0;
    table.orders.forEach(order => {
      order.items.forEach(item => {
        const qty = selectedSplitItems[item.id] || 0;
        total += qty * item.unit_price;
      });
    });

    return total;
  };

  // Tích hoặc hủy chọn toàn bộ đơn hàng
  const handleToggleOrderSelection = (order, isChecked) => {
    setSelectedSplitItems(prev => {
      const copy = { ...prev };
      order.items.forEach(item => {
        if (isChecked) {
          copy[item.id] = item.quantity; // Chọn tối đa số lượng
        } else {
          delete copy[item.id];
        }
      });
      return copy;
    });
  };

  // Kiểm tra xem đơn hàng đã được chọn toàn bộ hay chưa
  const isOrderFullySelected = (order) => {
    return order.items.every(item => selectedSplitItems[item.id] === item.quantity);
  };

  // Kiểm tra xem đơn hàng có bất kỳ món nào được chọn một phần hay không
  const isOrderPartiallySelected = (order) => {
    const hasSome = order.items.some(item => (selectedSplitItems[item.id] || 0) > 0);
    const isFully = isOrderFullySelected(order);
    return hasSome && !isFully;
  };

  // Xác nhận thanh toán các đơn được chọn trong phần chia món
  const handleSplitPaymentConfirm = async () => {
    if (!selectedTableCode) return;
    const table = getTablesWithUnpaid()[selectedTableCode];
    if (!table) return;

    // Tìm tất cả các order_id có ít nhất 1 món được chọn để thanh toán
    const orderIdsToPay = [];
    table.orders.forEach(order => {
      const hasSelectedItems = order.items.some(item => (selectedSplitItems[item.id] || 0) > 0);
      if (hasSelectedItems) {
        orderIdsToPay.push(order.id);
      }
    });

    if (orderIdsToPay.length === 0) return;

    try {
      // Gọi API cập nhật trạng thái 'completed' (đã thanh toán) cho tất cả các đơn hàng này
      const promises = orderIdsToPay.map(id => updateStatus(id, 'completed', 'Thanh toán lẻ/phân đơn'));
      await Promise.all(promises);

      alert(`💰 Đã thanh toán và cập nhật hóa đơn thành công cho các đơn hàng của ${table.table_name}!`);
      setIsSplitPaymentOpen(false);
      setSelectedSplitItems({});
      setSelectedTableCode(null);
    } catch (err) {
      console.error('Lỗi thanh toán chia lẻ:', err);
      alert('Không thể cập nhật trạng thái thanh toán lên hệ thống.');
    }
  };

  // Hàm tạo âm thanh thông báo cao cấp (Web Audio API)
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Âm thứ nhất (Cao độ C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Âm thứ hai (Cao độ E5 - trễ 0.1 giây)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.5);
      
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Không thể phát âm thanh thông báo:', e);
    }
  };

  // Lấy số lượng đơn hàng chờ nhận
  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/orders?status=pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCount(res.data.length);
    } catch (err) {
      console.error('Lỗi lấy số lượng đơn chờ:', err);
    }
  };

  // Lấy toàn bộ đơn hàng chưa thanh toán cho modal
  const fetchUnpaidOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/orders?status=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unpaid = res.data.filter(o => o.payment_status === 'unpaid' && o.status !== 'cancelled');
      setUnpaidOrders(unpaid);
    } catch (err) {
      console.error('Lỗi lấy danh sách đơn chưa thanh toán:', err);
    }
  };

  // Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/orders?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
      setError('');
      fetchPendingCount();
      fetchUnpaidOrders();
    } catch (err) {
      console.error('Lỗi lấy danh sách đơn hàng:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError('Không thể kết nối đến server để tải đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.clear();
    if (socketRef.current) socketRef.current.disconnect();
    navigate('/login');
  };

  // Cập nhật trạng thái đơn hàng
  const updateStatus = async (orderId, newStatus, note = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: newStatus,
        note: note || `Nhân viên chuyển trạng thái sang ${newStatus}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cập nhật local state nhanh chóng
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const isCompleted = newStatus === 'completed';
          return {
            ...order,
            status: newStatus,
            payment_status: isCompleted ? 'paid' : order.payment_status
          };
        }
        return order;
      }));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      alert('Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.');
    }
  };

  // Cập nhật thanh toán thủ công
  const updatePayment = async (orderId, paymentStatus, paymentMethod = 'cash') => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/orders/${orderId}/payment`, {
        payment_status: paymentStatus,
        payment_method: paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            payment_status: paymentStatus,
            payment_method: paymentMethod
          };
        }
        return order;
      }));
    } catch (err) {
      console.error('Lỗi cập nhật thanh toán:', err);
      alert('Không thể cập nhật thanh toán. Vui lòng thử lại.');
    }
  };

  // Theo dõi User và Socket.io
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Kết nối Socket.io
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Đã kết nối Socket.io nhân viên:', socket.id);
      socket.emit('join_staff');
    });

    // Lắng nghe đơn hàng mới từ Khách hàng
    socket.on('order:new', (newOrderInfo) => {
      console.log('🛎️ Đơn hàng mới:', newOrderInfo);
      
      // Kích hoạt chuông thông báo
      playNotificationSound();

      // Hiện Toast popup
      setToast({
        show: true,
        message: `Mới nhận đơn bàn "${newOrderInfo.table_name}"!`,
        orderCode: newOrderInfo.order_code
      });

      // Tự động load lại danh sách đơn hàng
      fetchOrders();
    });

    // Lắng nghe các thay đổi đồng bộ khác
    socket.on('order:status_updated', () => {
      fetchOrders();
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Tự động gọi lại đơn hàng khi tab thay đổi
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  // Đóng Toast sau 6 giây
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', orderCode: '' });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5"><Clock size={12}/>Chờ nhận</span>;
      case 'confirmed':
        return <span className="bg-sky-500/10 text-sky-500 border border-sky-500/20 px-3 py-1 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0"><Utensils size={12}/>Đang chế biến</span>;
      case 'served':
        return <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-3 py-1 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0"><Award size={12}/>Đã lên món</span>;
      case 'completed':
        return <span className="bg-green-600/10 text-green-500 border border-green-600/20 px-3 py-1 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle size={12}/>Đã thanh toán</span>;
      case 'cancelled':
        return <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5"><X size={12}/>Đã hủy</span>;
      default:
        return null;
    }
  };

  const getPaymentBadge = (status) => {
    if (status === 'paid') {
      return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-heading font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"><CreditCard size={10}/>Đã thanh toán</span>;
    }
    return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-heading font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"><Clock size={10}/>Chưa thanh toán</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Toast Notification Alert */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 max-w-sm bg-slate-900 border border-primary/40 rounded-2xl p-4 shadow-2xl flex gap-3 animate-float-up">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce">
            <Bell size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-heading font-bold text-sm text-white">{toast.message}</p>
            <p className="text-xs text-gray-400 font-body mt-0.5">Mã đơn: #{toast.orderCode.substring(0, 12)}</p>
          </div>
          <button onClick={() => setToast({ show: false, message: '', orderCode: '' })} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

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
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/20"
          >
            <Layers size={18} />
            <span>Màn nhận đơn</span>
          </button>

          <button
            onClick={() => navigate('/staff/menu')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <Package size={18} />
            <span>Quản lý thực đơn</span>
          </button>

          <button
            onClick={() => navigate('/staff/order-history')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <Clock size={18} />
            <span>Lịch sử gọi món</span>
          </button>

          <button
            onClick={() => navigate('/staff/revenue')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <TrendingUp size={18} />
            <span>Quản lý doanh thu</span>
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
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Modern Header */}
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 py-4 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Nút Hamburger bật Sidebar di động */}
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/10 cursor-pointer"
              >
                <Utensils size={18} />
              </button>
              <div className="text-left">
                <h1 className="text-lg font-extrabold tracking-tight font-heading flex items-center gap-1.5">
                  Bảng điều khiển nhận đơn
                </h1>
                <p className="text-xs text-gray-400 font-body hidden sm:block">Cập nhật đơn hàng thực khách tức thời</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  fetchUnpaidOrders();
                  setIsSplitPaymentOpen(true);
                  setSelectedTableCode(null);
                  setSelectedSplitItems({});
                }}
                className="p-2.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-heading font-bold"
              >
                <CreditCard size={16} />
                <span>Thanh toán</span>
              </button>
            </div>
          </div>
        </header>

      {/* Tabs bar */}
      <div className="bg-slate-900 border-b border-white/5 py-3 px-6 overflow-x-auto scrollbar-none flex justify-center">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'all', label: 'Tất cả đơn' },
            { id: 'pending', label: 'Chờ nhận đơn' },
            { id: 'confirmed', label: 'Đang chế biến' },
            { id: 'served', label: 'Đã lên món' },
            { id: 'cancelled', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 text-xs font-heading font-extrabold rounded-2xl border transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white border-transparent shadow-lg shadow-primary/10'
                  : 'bg-slate-950 text-gray-400 border-white/5 hover:border-white/10 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'pending' && pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-950 font-sans shadow-lg animate-bounce">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/25 border-t-primary mb-4"></div>
            <p className="text-gray-400 text-xs font-heading font-bold tracking-wider uppercase animate-pulse">ĐANG TẢI ĐƠN HÀNG...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-3xl p-6 flex flex-col items-center max-w-md mx-auto text-center mt-10">
            <AlertCircle size={32} className="text-rose-400 mb-3" />
            <p className="font-heading font-bold text-sm mb-4">{error}</p>
            <button onClick={fetchOrders} className="bg-primary hover:bg-primary/90 text-white font-heading font-bold px-5 py-2.5 rounded-2xl text-xs transition-colors flex items-center gap-2 cursor-pointer">
              <RotateCcw size={14}/>Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag size={48} className="text-gray-600 mb-4 animate-bounce" />
            <h3 className="text-base font-heading font-bold text-gray-400">Không có đơn hàng nào</h3>
            <p className="text-xs text-gray-500 mt-1 font-body">Trạng thái này hiện chưa ghi nhận yêu cầu gọi món nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {orders.map(order => (
              <div 
                key={order.id} 
                className={`relative bg-slate-900 border rounded-3xl overflow-hidden shadow-xl flex flex-col transition-all duration-300 ${
                  order.status === 'pending' 
                    ? 'border-amber-500/30 ring-1 ring-amber-500/20' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Highlight banner for new orders */}
                {order.status === 'pending' && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 animate-pulse"></div>
                )}

                {/* Card Header */}
                <div className="p-5 border-b border-white/5 bg-white/[0.01] flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      <h4 className="font-heading font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                        {order.table_name}
                      </h4>
                    </div>
                    <p className="text-[10px] text-gray-400 font-body">
                      Mã đơn: #{order.order_code.substring(0, 12)} • {formatTime(order.created_at)}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Customer note */}
                {order.customer_note && (
                  <div className="px-5 pt-3">
                    <div className="p-3 bg-white/5 border border-white/5 text-xs italic text-gray-300 rounded-2xl flex gap-2 font-body text-left">
                      <span className="text-primary font-bold font-heading not-italic">Lưu ý:</span>
                      <span>"{order.customer_note}"</span>
                    </div>
                  </div>
                )}

                {/* List Items */}
                <div className="p-5 flex-1 space-y-3">
                  <h5 className="text-[10px] font-heading font-bold text-gray-500 uppercase tracking-wider mb-2 pl-0.5">Món đã gọi</h5>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-2 last:border-0 last:pb-0">
                        <div className="flex-1 pr-3 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-extrabold text-primary">{item.quantity}x</span>
                            <span className="font-heading font-semibold text-gray-200">{item.product_name}</span>
                          </div>
                          
                          {/* Hiển thị toppings đi kèm món ăn cho bếp */}
                          {item.toppings && item.toppings.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-1 pl-3 text-[10px] font-bold font-body leading-tight">
                              {/* Ăn cùng (Trong tô) */}
                              {item.toppings.filter(t => t.type === 'cung').length > 0 && (
                                <div className="text-emerald-400">
                                  <span className="text-emerald-500 font-extrabold uppercase mr-1">[Ăn cùng]:</span>
                                  {item.toppings.filter(t => t.type === 'cung').map(t => t.topping_name || t.name).join(', ')}
                                </div>
                              )}
                              {/* Ăn thêm (Đĩa riêng) */}
                              {item.toppings.filter(t => t.type === 'them').length > 0 && (
                                <div className="text-orange-400">
                                  <span className="text-orange-500 font-extrabold uppercase mr-1">[Ăn thêm]:</span>
                                  {item.toppings.filter(t => t.type === 'them').map(t => t.topping_name || t.name).join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          {item.note && (
                            <p className="text-[10px] text-gray-400 italic mt-1 pl-3 border-l-2 border-primary/20 font-body">
                              {item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-heading font-bold text-gray-300 flex-shrink-0">{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment info and Total amount */}
                <div className="px-5 py-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 font-heading uppercase tracking-wider pl-0.5">Tổng cộng</p>
                    <p className="text-lg font-heading font-extrabold text-primary">{formatPrice(order.total_amount)}</p>
                  </div>
                  <div>
                    {getPaymentBadge(order.payment_status)}
                  </div>
                </div>

                {/* Quick Interactive Actions */}
                <div className="p-5 bg-slate-900 border-t border-white/5 flex flex-wrap gap-2.5">
                  {order.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateStatus(order.id, 'confirmed')}
                        className="flex-1 bg-gradient-to-r from-primary to-orange-500 text-white font-heading font-bold text-xs h-[42px] rounded-2xl hover:shadow-lg hover:shadow-primary/10 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check size={14}/> Duyệt nhận đơn
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'cancelled', 'Nhân viên từ chối đơn hàng')}
                        className="bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 font-heading font-bold text-xs px-4 h-[42px] rounded-2xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </>
                  )}

                  {order.status === 'confirmed' && (
                    <>
                      <button 
                        onClick={() => updateStatus(order.id, 'served')}
                        className="flex-1 bg-gradient-to-r from-primary to-orange-500 text-white font-heading font-bold text-xs h-[42px] rounded-2xl hover:shadow-lg hover:shadow-primary/10 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Utensils size={14}/> Đã lên món
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'cancelled', 'Hủy bởi bếp/nhân viên')}
                        className="bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-gray-400 hover:text-rose-400 font-heading font-bold text-xs px-3 h-[42px] rounded-2xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </>
                  )}

                  {order.status === 'served' && (
                    <div className="w-full text-center py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-heading font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5">
                      <CheckCircle size={14}/> Đã phục vụ xong (Chờ thanh toán)
                    </div>
                  )}

                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <div className="w-full text-center">
                      <p className="text-[10px] text-gray-500 font-body">Đơn hàng đã được lưu lịch sử lưu trữ</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>

      {/* OVERLAY THANH TOÁN CHIA MÓN / CHIA TIỀN */}
      {isSplitPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col animate-scale-in text-left text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-heading font-extrabold text-white">Thanh toán chia món nhanh (Bàn ghép)</h3>
                  <p className="text-xs text-gray-400 font-body">Chọn bàn, chọn từng món ăn cụ thể để tính tiền riêng lẻ</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSplitPaymentOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content split in 2 columns */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 py-6">
              
              {/* Column 1: Dining Tables List */}
              <div className="w-full md:w-1/3 flex flex-col gap-3 min-h-0">
                <h4 className="text-xs font-heading font-extrabold text-gray-500 uppercase tracking-wider pl-1 flex-shrink-0">Danh sách bàn hoạt động</h4>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {Object.keys(getTablesWithUnpaid()).length === 0 ? (
                    <div className="text-center py-10 text-gray-500 font-body text-xs">
                      Không có bàn nào đang có hóa đơn chưa thanh toán.
                    </div>
                  ) : (
                    Object.values(getTablesWithUnpaid()).map(table => (
                      <button
                        key={table.table_code}
                        onClick={() => {
                          setSelectedTableCode(table.table_code);
                          setSelectedSplitItems({});
                        }}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                          selectedTableCode === table.table_code
                            ? 'bg-gradient-to-r from-primary to-orange-500 border-transparent text-white shadow-lg shadow-primary/10'
                            : 'bg-slate-950/60 border-white/5 hover:border-white/10 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-heading font-extrabold text-sm">{table.table_name}</p>
                           <p className={`text-[10px] font-body mt-0.5 ${selectedTableCode === table.table_code ? 'text-white/80' : 'text-gray-400'}`}>
                            {table.orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)} món chưa thanh toán
                          </p>
                        </div>
                        <span className={`text-xs font-heading font-bold px-2 py-0.5 rounded-lg ${
                          selectedTableCode === table.table_code ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          {formatPrice(table.orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.unit_price * i.quantity), 0), 0))}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Items List & Quick Calculation */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40 border border-white/5 rounded-3xl p-5">
                {selectedTableCode ? (
                  <>
                    <h4 className="text-xs font-heading font-extrabold text-gray-400 uppercase tracking-wider pl-1 mb-4 flex-shrink-0">
                      Chi tiết theo Đơn hàng - {getTablesWithUnpaid()[selectedTableCode]?.table_name}
                    </h4>

                    {/* Scrollable list of order sections */}
                    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                      {(getTablesWithUnpaid()[selectedTableCode]?.orders || []).map((order, orderIdx) => {
                        const fullySelected = isOrderFullySelected(order);
                        const partiallySelected = isOrderPartiallySelected(order);

                        return (
                          <div key={order.id} className="bg-slate-950/70 border border-white/5 rounded-2xl p-4 space-y-3">
                            {/* Order Header / Checkbox */}
                            <div className="flex items-center gap-3 pb-2.5 border-b border-white/5">
                              <input 
                                type="checkbox"
                                ref={el => {
                                  if (el) {
                                    el.indeterminate = partiallySelected;
                                  }
                                }}
                                checked={fullySelected}
                                onChange={(e) => handleToggleOrderSelection(order, e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-offset-slate-900 border-white/10 accent-primary"
                              />
                              <div className="text-left">
                                <span className="text-xs font-heading font-extrabold text-gray-200">
                                  Đơn #{order.order_code.substring(0, 10)}
                                </span>
                                <span className="text-[10px] text-gray-500 font-body ml-2">
                                  (Yêu cầu lúc {formatTime(order.created_at)})
                                </span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-3">
                              {order.items.map((item, itemIdx) => {
                                const selectedQty = selectedSplitItems[item.id] || 0;

                                return (
                                  <div 
                                    key={item.id} 
                                    className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                                      selectedQty > 0
                                        ? 'bg-white/5 border-primary/20'
                                        : 'bg-slate-900/60 border-white/5'
                                    }`}
                                  >
                                    {/* Item Checkbox & Title */}
                                    <div className="flex items-center gap-3">
                                      <input 
                                        type="checkbox"
                                        checked={selectedQty > 0}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedSplitItems(prev => ({ ...prev, [item.id]: item.quantity }));
                                          } else {
                                            setSelectedSplitItems(prev => {
                                              const copy = { ...prev };
                                              delete copy[item.id];
                                              return copy;
                                            });
                                          }
                                        }}
                                        className="w-3.5 h-3.5 rounded text-primary focus:ring-primary focus:ring-offset-slate-900 border-white/10 accent-primary cursor-pointer"
                                      />
                                      <div className="text-left">
                                        <p className="text-xs font-heading font-semibold text-slate-300">
                                          {item.product_name} <span className="text-primary font-bold ml-1">(x{item.quantity})</span>
                                        </p>
                                        
                                        {/* Hiển thị toppings chi tiết cho hóa đơn chia tiền */}
                                        {item.toppings && item.toppings.length > 0 && (
                                          <div className="flex flex-col pl-2 mt-0.5 text-[9px] font-semibold font-body leading-snug">
                                            {item.toppings.filter(t => t.type === 'cung').length > 0 && (
                                              <span className="text-emerald-400">
                                                Ăn cùng: {item.toppings.filter(t => t.type === 'cung').map(t => t.topping_name || t.name).join(', ')}
                                              </span>
                                            )}
                                            {item.toppings.filter(t => t.type === 'them').length > 0 && (
                                              <span className="text-orange-400">
                                                Ăn thêm: {item.toppings.filter(t => t.type === 'them').map(t => t.topping_name || t.name).join(', ')}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        
                                        <p className="text-[9px] text-gray-500 font-body mt-0.5">{formatPrice(item.unit_price)} / món</p>
                                      </div>
                                    </div>

                                    {/* Total Price for this item quantity */}
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-xs font-heading font-bold text-gray-300">
                                        {formatPrice(item.unit_price * item.quantity)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Calculation Footer */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <p className="text-[10px] text-gray-500 font-heading uppercase tracking-wider">Tổng cộng tạm tính chia lẻ</p>
                        <p className="text-xl sm:text-2xl font-heading font-extrabold text-primary">
                          {formatPrice(calculateSplitTotal())}
                        </p>
                      </div>
                      <button
                        disabled={calculateSplitTotal() <= 0}
                        onClick={handleSplitPaymentConfirm}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-heading font-bold px-6 py-3.5 rounded-2xl text-xs hover:shadow-lg shadow-emerald-500/10 transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Xác nhận đã thu tiền
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-gray-500">
                    <CreditCard size={32} className="mb-2 opacity-30 animate-pulse" />
                    <p className="text-xs font-heading font-bold">Hãy chọn một bàn hoạt động ở cột bên trái</p>
                    <p className="text-[10px] font-body mt-0.5">Hệ thống sẽ tổng hợp danh sách các món chưa thanh toán.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default StaffDashboard;
