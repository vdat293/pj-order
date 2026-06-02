import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Utensils, Layers, Package, TrendingUp, LogOut, ArrowLeft, X, 
  Calendar, Clock, Filter, ShoppingBag, Search, ChevronDown, ChevronUp, 
  Eye, RotateCcw, Award, CheckCircle, HelpCircle, LayoutGrid, ListFilter,
  Sunrise, Sun, CloudSun, Moon, Stars, Hash, MapPin, Timer, XCircle, RefreshCw
} from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:5001/api/staff`;

const OrderHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  // Trạng thái bộ lọc thời gian & bàn & khung giờ
  const [timeFilter, setTimeFilter] = useState('today');
  const [hourFilter, setHourFilter] = useState('all');
  const [selectedTable, setSelectedTable] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dữ liệu đơn hàng gốc
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Handle view order details: modal on mobile, expand on desktop
  const handleViewDetails = useCallback((order) => {
    if (isMobile) {
      setModalOrder(order);
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
      setModalOrder(null);
    }
  }, [isMobile, expandedOrderId]);

  // Lấy danh sách bàn duy nhất từ dữ liệu đơn hàng để làm bộ lọc
  const getUniqueTables = () => {
    const tables = new Set();
    orders.forEach(o => {
      if (o.table_name) tables.add(o.table_name);
    });
    return Array.from(tables).sort();
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchOrderHistory = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    
    try {
      const res = await axios.get(`${API_BASE_URL}/orders?status=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Lỗi tải lịch sử gọi món:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError('Không thể kết nối đến server để tải lịch sử gọi món.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Chờ nhận', dot: 'bg-amber-400' },
      confirmed: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', label: 'Chế biến', dot: 'bg-sky-400' },
      served: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Đã lên món', dot: 'bg-purple-400' },
      completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Hoàn thành', dot: 'bg-emerald-400' },
      cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'Đã hủy', dot: 'bg-rose-400' },
    };
    const s = styles[status];
    if (!s) return null;
    return (
      <span className={`${s.bg} ${s.text} border ${s.border} px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase inline-flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
        {s.label}
      </span>
    );
  };

  // Xác định khung giờ của đơn hàng
  const getHourFrame = (dateString) => {
    const hour = new Date(dateString).getHours();
    if (hour >= 6 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  };

  // Lọc dữ liệu phía Client
  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchCode = order.order_code.toLowerCase().includes(query);
        const matchTable = order.table_name.toLowerCase().includes(query);
        if (!matchCode && !matchTable) return false;
      }
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (selectedTable !== 'all' && order.table_name !== selectedTable) return false;
      if (hourFilter !== 'all' && getHourFrame(order.created_at) !== hourFilter) return false;

      const orderDate = new Date(order.created_at);
      const today = new Date();
      
      if (timeFilter === 'today') {
        return orderDate.toDateString() === today.toDateString();
      } else if (timeFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return orderDate >= oneWeekAgo;
      } else if (timeFilter === 'month') {
        return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
      }

      return true;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Thống kê theo khung giờ
  const getHourFrameStats = () => {
    const stats = { morning: 0, noon: 0, afternoon: 0, evening: 0, night: 0 };
    filteredOrders.forEach(o => {
      const frame = getHourFrame(o.created_at);
      stats[frame] = (stats[frame] || 0) + 1;
    });
    return stats;
  };

  const hourStats = getHourFrameStats();

  // KPI data
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
  const totalValue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      
      {/* ============ SIDEBAR ============ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:flex'}`}>
        <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Utensils className="text-white h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-extrabold tracking-wider font-heading text-white uppercase">Phở Gia Truyền</h2>
            <p className="text-[10px] text-gray-400 font-body">Hệ thống quản trị Host</p>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden ml-auto text-slate-400 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

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

          <button
            onClick={() => navigate('/staff/order-history')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer ${
              location.pathname === '/staff/order-history'
                ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Clock size={18} />
            <span>Lịch sử gọi món</span>
          </button>

          <button
            onClick={() => navigate('/staff/revenue')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-heading font-bold transition-all duration-200 cursor-pointer ${
              location.pathname === '/staff/revenue'
                ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <TrendingUp size={18} />
            <span>Quản lý doanh thu</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/[0.06] space-y-3">
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

      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 min-w-0 flex flex-col animate-fade-in">
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.06] py-4 px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/10"
            >
              <Utensils size={18} />
            </button>
            <div className="text-left">
              <h1 className="text-lg lg:text-xl font-extrabold tracking-tight font-heading text-white flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Clock size={16} className="text-white" />
                </div>
                Lịch sử Gọi món
              </h1>
              <p className="text-xs text-gray-500 font-body hidden sm:block mt-0.5 ml-[42px]">Theo dõi lịch trình và thống kê chi tiết gọi món của thực khách</p>
            </div>
          </div>
          
          <button
            onClick={fetchOrderHistory}
            className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-heading font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer group"
          >
            <RefreshCw size={13} className="group-hover:rotate-180 transition-transform duration-500" />
            <span>Làm mới</span>
          </button>
        </header>

        <div className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 animate-scale-in">
              <XCircle className="flex-shrink-0" size={18} />
              <p className="text-sm font-body font-bold">{error}</p>
            </div>
          )}

          {/* ============ KPI CARDS ============ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {[
              {
                label: 'Tổng số đơn gọi',
                value: `${totalOrders}`,
                unit: 'đơn',
                icon: <ShoppingBag size={18} />,
                gradient: 'from-primary/20 to-orange-500/20',
                iconBg: 'bg-primary/15',
                iconColor: 'text-primary',
                valueColor: 'text-white',
                glow: 'shadow-primary/5',
              },
              {
                label: 'Đơn hoàn tất',
                value: `${completedOrders}`,
                unit: 'đơn',
                icon: <CheckCircle size={18} />,
                gradient: 'from-emerald-500/20 to-teal-500/20',
                iconBg: 'bg-emerald-500/15',
                iconColor: 'text-emerald-400',
                valueColor: 'text-emerald-400',
                glow: 'shadow-emerald-500/5',
              },
              {
                label: 'Đơn bị hủy',
                value: `${cancelledOrders}`,
                unit: 'đơn',
                icon: <XCircle size={18} />,
                gradient: 'from-rose-500/20 to-pink-500/20',
                iconBg: 'bg-rose-500/15',
                iconColor: 'text-rose-400',
                valueColor: 'text-rose-400',
                glow: 'shadow-rose-500/5',
              },
              {
                label: 'Tổng giá trị đơn',
                value: formatPrice(totalValue),
                unit: '',
                icon: <TrendingUp size={18} />,
                gradient: 'from-violet-500/20 to-purple-500/20',
                iconBg: 'bg-violet-500/15',
                iconColor: 'text-violet-400',
                valueColor: 'text-violet-400',
                glow: 'shadow-violet-500/5',
              },
            ].map((kpi, idx) => (
              <div key={idx} className={`relative overflow-hidden bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5 shadow-xl ${kpi.glow} animate-float-up animate-float-up-${idx + 1}`}>
                {/* Decorative gradient orb */}
                <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${kpi.gradient} rounded-full blur-2xl opacity-60`}></div>
                
                <div className={`relative z-10 w-9 h-9 ${kpi.iconBg} ${kpi.iconColor} rounded-xl flex items-center justify-center mb-3`}>
                  {kpi.icon}
                </div>
                <p className="relative z-10 text-[10px] font-heading font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                <h3 className={`relative z-10 text-xl font-heading font-extrabold ${kpi.valueColor} mt-1`}>
                  {kpi.value} <span className="text-sm font-bold text-gray-500">{kpi.unit}</span>
                </h3>
              </div>
            ))}
          </div>

          {/* ============ FILTER BAR - Pill Style ============ */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5 space-y-4 text-left backdrop-blur-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.04]">
              <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Filter size={14} />
              </div>
              <h3 className="text-xs font-heading font-extrabold text-white uppercase tracking-wider">Bộ lọc nâng cao</h3>
            </div>

            {/* ROW 1: Time filter pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'today', label: '📅 Hôm nay' },
                { id: 'week', label: '📆 1 tuần qua' },
                { id: 'month', label: '🗓️ Tháng này' },
                { id: 'all', label: '♾️ Tất cả' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeFilter(opt.id)}
                  className={`px-4 py-2 rounded-full text-xs font-heading font-bold border transition-all duration-300 cursor-pointer ${
                    timeFilter === opt.id
                      ? 'bg-gradient-to-r from-primary to-orange-500 border-transparent text-white shadow-md shadow-primary/20 scale-105'
                      : 'bg-slate-950/50 text-slate-400 border-white/[0.06] hover:text-white hover:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* ROW 2: Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><MapPin size={10} /> Bàn</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-primary/40 cursor-pointer transition-colors"
                >
                  <option value="all">Tất cả các bàn</option>
                  {getUniqueTables().map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Timer size={10} /> Khung giờ</label>
                <select
                  value={hourFilter}
                  onChange={(e) => setHourFilter(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-primary/40 cursor-pointer transition-colors"
                >
                  <option value="all">Tất cả</option>
                  <option value="morning">🌅 Sáng (06-10h)</option>
                  <option value="noon">☀️ Trưa (10-14h)</option>
                  <option value="afternoon">🌤️ Chiều (14-18h)</option>
                  <option value="evening">🌙 Tối (18-22h)</option>
                  <option value="night">🌃 Đêm (22-06h)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><ListFilter size={10} /> Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-primary/40 cursor-pointer transition-colors"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ nhận đơn</option>
                  <option value="confirmed">Đang chế biến</option>
                  <option value="served">Đã lên món</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã huỷ</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Search size={10} /> Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-600" size={13} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Bàn, mã đơn..."
                    className="w-full bg-slate-950/60 border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/40 text-left transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============ HOUR FRAME CHART - Vertical Bar Chart ============ */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 text-left backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 bg-violet-500/10 text-violet-400 rounded-lg flex items-center justify-center">
                <Clock size={14} />
              </div>
              <h3 className="text-xs font-heading font-extrabold text-white uppercase tracking-wider">
                Phân bố đơn theo khung giờ
              </h3>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {[
                { id: 'morning', label: 'Sáng', time: '6h-10h', count: hourStats.morning, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10', icon: <Sunrise size={16} className="text-amber-400" /> },
                { id: 'noon', label: 'Trưa', time: '10h-14h', count: hourStats.noon, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/10', icon: <Sun size={16} className="text-emerald-400" /> },
                { id: 'afternoon', label: 'Chiều', time: '14h-18h', count: hourStats.afternoon, gradient: 'from-sky-400 to-blue-500', bg: 'bg-sky-500/10', icon: <CloudSun size={16} className="text-sky-400" /> },
                { id: 'evening', label: 'Tối', time: '18h-22h', count: hourStats.evening, gradient: 'from-primary to-orange-500', bg: 'bg-primary/10', icon: <Moon size={16} className="text-primary" /> },
                { id: 'night', label: 'Đêm', time: '22h-6h', count: hourStats.night, gradient: 'from-rose-400 to-pink-500', bg: 'bg-rose-500/10', icon: <Stars size={16} className="text-rose-400" /> }
              ].map((slot, idx) => {
                const maxCount = Math.max(...Object.values(hourStats), 1);
                const heightPct = (slot.count / maxCount) * 100;
                const isActive = hourFilter === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setHourFilter(hourFilter === slot.id ? 'all' : slot.id)}
                    className={`relative group rounded-2xl p-4 flex flex-col items-center justify-end min-h-[160px] border transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-slate-800/80 border-white/10 shadow-lg scale-[1.02]' 
                        : 'bg-slate-950/30 border-white/[0.04] hover:border-white/[0.08] hover:bg-slate-950/50'
                    }`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {/* Vertical bar */}
                    <div className="w-full flex-1 flex items-end justify-center mb-3">
                      <div className="w-8 bg-slate-800 rounded-t-lg overflow-hidden relative" style={{ height: '80px' }}>
                        <div 
                          className={`absolute bottom-0 w-full bg-gradient-to-t ${slot.gradient} rounded-t-lg transition-all duration-700 ease-out`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="text-center space-y-1">
                      <div className={`w-8 h-8 ${slot.bg} rounded-lg flex items-center justify-center mx-auto`}>
                        {slot.icon}
                      </div>
                      <p className="text-xl font-heading font-extrabold text-white">{slot.count}</p>
                      <p className="text-[10px] text-gray-400 font-bold leading-tight">{slot.label}</p>
                      <p className="text-[8px] text-gray-600 font-bold">{slot.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============ ORDER TABLE ============ */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.04] text-left mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-sky-500/10 text-sky-400 rounded-lg flex items-center justify-center">
                  <LayoutGrid size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-white">Bảng danh sách gọi món</h3>
                  <p className="text-[10px] text-gray-500 font-body">Lịch sử chi tiết đơn hàng theo bộ lọc</p>
                </div>
              </div>
              <span className="text-[11px] font-heading font-bold px-3.5 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-gray-400">
                {filteredOrders.length} đơn
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 font-heading font-bold tracking-wider uppercase animate-pulse mt-5">ĐANG TẢI LỊCH SỬ...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-600" />
                </div>
                <p className="text-sm font-heading font-bold text-gray-500">Không tìm thấy đơn hàng</p>
                <p className="text-xs text-gray-600 font-body mt-1">Thử thay đổi bộ lọc để tìm kết quả phù hợp</p>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-gray-500 font-heading font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 text-[10px]">Mã đơn</th>
                      <th className="py-3.5 px-4 text-[10px]">Bàn gọi</th>
                      <th className="py-3.5 px-4 text-[10px]">Thời gian</th>
                      <th className="py-3.5 px-4 text-[10px]">Khung giờ</th>
                      <th className="py-3.5 px-4 text-[10px]">Trạng thái</th>
                      <th className="py-3.5 px-4 text-[10px] text-right">Tổng tiền</th>
                      <th className="py-3.5 px-4 text-[10px] text-center">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {filteredOrders.map(order => {
                      const hourFrame = getHourFrame(order.created_at);
                      const frameConfig = {
                        morning: { label: 'Sáng', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        noon: { label: 'Trưa', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        afternoon: { label: 'Chiều', color: 'text-sky-400', bg: 'bg-sky-500/10' },
                        evening: { label: 'Tối', color: 'text-primary', bg: 'bg-primary/10' },
                        night: { label: 'Đêm', color: 'text-rose-400', bg: 'bg-rose-500/10' }
                      }[hourFrame];

                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-white/[0.015] transition-all duration-200 group">
                            <td className="py-4 px-4 font-heading font-bold text-slate-400">
                              <span className="text-gray-600">#</span>{order.order_code.substring(0, 8)}
                            </td>
                            <td className="py-4 px-4 font-heading font-extrabold text-white">
                              {order.table_name}
                            </td>
                            <td className="py-4 px-4 text-gray-400 font-body text-[11px]">
                              {formatDateTime(order.created_at)}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`${frameConfig.bg} ${frameConfig.color} px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block`}>
                                {frameConfig.label}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="py-4 px-4 text-right font-heading font-extrabold text-primary">
                              {formatPrice(order.total_amount)}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => handleViewDetails(order)}
                                className={`p-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold ${
                                  expandedOrderId === order.id 
                                    ? 'bg-primary/10 text-primary border border-primary/20' 
                                    : 'bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white border border-transparent'
                                }`}
                              >
                                <Eye size={12} />
                                <span className="hidden sm:inline">{expandedOrderId === order.id ? 'Ẩn' : 'Xem'}</span>
                                {expandedOrderId === order.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded items row - Desktop only */}
                          {!isMobile && expandedOrderId === order.id && (
                            <tr className="animate-scale-in">
                              <td colSpan="7" className="bg-slate-950/40 p-4">
                                <div className="max-w-3xl border border-white/[0.06] rounded-2xl p-5 bg-slate-900/40 space-y-3 backdrop-blur-sm">
                                  <h4 className="text-[10px] font-heading font-extrabold text-gray-500 uppercase tracking-wider text-left pl-1 flex items-center gap-1.5">
                                    <ShoppingBag size={11} />
                                    Chi tiết món ăn đã gọi
                                  </h4>
                                  
                                  <div className="space-y-2.5 text-left">
                                    {order.items && order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-start text-xs p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                                        <div>
                                          <div className="flex items-center gap-1.5 font-body">
                                            <span className="w-6 h-6 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-heading font-extrabold text-[10px]">{item.quantity}x</span>
                                            <span className="font-heading font-bold text-slate-300">{item.product_name || item.name}</span>
                                            <span className="text-[10px] text-gray-600">({formatPrice(item.unit_price)})</span>
                                          </div>
                                          
                                          {item.toppings && item.toppings.length > 0 && (
                                            <div className="flex flex-col pl-8 mt-1.5 text-[9px] font-bold font-body leading-tight text-gray-400 space-y-0.5">
                                              {item.toppings.filter(t => t.type === 'cung').length > 0 && (
                                                <span className="text-emerald-400/80">
                                                  ↳ Ăn cùng: {item.toppings.filter(t => t.type === 'cung').map(t => t.topping_name || t.name).join(', ')}
                                                </span>
                                              )}
                                              {item.toppings.filter(t => t.type === 'them').length > 0 && (
                                                <span className="text-orange-400/80">
                                                  ↳ Ăn thêm: {item.toppings.filter(t => t.type === 'them').map(t => t.topping_name || t.name).join(', ')}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <span className="font-heading font-bold text-white bg-white/[0.04] px-2.5 py-1 rounded-lg">
                                          {formatPrice(item.subtotal)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ============ MOBILE POPUP MODAL ============ */}
      {modalOrder && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setModalOrder(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"></div>
          
          {/* Modal content */}
          <div 
            className="relative w-full sm:max-w-lg mx-auto bg-slate-900 border border-white/[0.08] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-heading font-extrabold text-white">Chi tiết đơn hàng</h3>
                  <p className="text-[10px] text-gray-400 font-body">#{modalOrder.order_code.substring(0, 10)}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalOrder(null)} 
                className="w-8 h-8 bg-white/[0.06] hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Order info bar */}
            <div className="px-5 py-3 bg-slate-950/40 border-b border-white/[0.04] flex items-center gap-4 flex-wrap text-[11px] flex-shrink-0">
              <div className="flex items-center gap-1.5 text-gray-400">
                <MapPin size={12} className="text-primary" />
                <span className="font-heading font-bold text-white">{modalOrder.table_name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock size={12} className="text-sky-400" />
                <span>{formatDateTime(modalOrder.created_at)}</span>
              </div>
              <div className="ml-auto">
                {getStatusBadge(modalOrder.status)}
              </div>
            </div>

            {/* Items list - scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2.5 no-scrollbar">
              {modalOrder.items && modalOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-heading font-extrabold text-[11px] flex-shrink-0">{item.quantity}x</span>
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-slate-200 block truncate">{item.product_name || item.name}</span>
                        <span className="text-[10px] text-gray-500">{formatPrice(item.unit_price)} / món</span>
                      </div>
                    </div>
                    
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="flex flex-col pl-9 mt-2 text-[10px] font-bold font-body text-gray-400 space-y-1">
                        {item.toppings.filter(t => t.type === 'cung').length > 0 && (
                          <span className="text-emerald-400/80 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                            Ăn cùng: {item.toppings.filter(t => t.type === 'cung').map(t => t.topping_name || t.name).join(', ')}
                          </span>
                        )}
                        {item.toppings.filter(t => t.type === 'them').length > 0 && (
                          <span className="text-orange-400/80 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-orange-400"></span>
                            Ăn thêm: {item.toppings.filter(t => t.type === 'them').map(t => t.topping_name || t.name).join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="font-heading font-bold text-white bg-white/[0.06] px-3 py-1.5 rounded-xl text-[11px] ml-3 flex-shrink-0">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal footer - total */}
            <div className="p-5 border-t border-white/[0.06] bg-slate-950/40 flex-shrink-0 rounded-b-3xl sm:rounded-b-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 font-heading font-bold uppercase tracking-wider">Tổng giá trị đơn</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{modalOrder.items?.length || 0} món</p>
                </div>
                <p className="text-xl font-heading font-extrabold text-primary">
                  {formatPrice(modalOrder.total_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderHistory;
