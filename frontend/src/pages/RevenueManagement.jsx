import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Utensils, Layers, Package, TrendingUp, LogOut, X, 
  Calendar, CreditCard, DollarSign, ShoppingBag, Search, 
  Award, Clock, Wallet, BarChart3, PieChart, MapPin,
  Sunrise, Moon, XCircle, FileSpreadsheet, ArrowUpRight
} from 'lucide-react';
import { SERVICE_SHIFT_OPTIONS, createServiceShiftStats, getServiceShift } from '../utils/serviceShift';
import { staffApiUrl } from '../config/api';

const RevenueManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  // Trạng thái bộ lọc thời gian
  const [filterType, setFilterType] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dữ liệu API thống kê & đơn hàng
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sidebar di động thu gọn
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Lấy thông tin user đăng nhập
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Hàm tải dữ liệu thống kê và danh sách hóa đơn từ server
  const fetchRevenueData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    
    try {
      let queryStr = `?filterType=${filterType}`;
      if (filterType === 'custom' && startDate && endDate) {
        queryStr += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const statsRes = await axios.get(staffApiUrl(`/revenue/stats${queryStr}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      const ordersRes = await axios.get(staffApiUrl(`/revenue/orders${queryStr}&search=${searchQuery}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(ordersRes.data);

    } catch (err) {
      console.error('Lỗi tải dữ liệu doanh thu:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError('Không thể kết nối đến server để tải số liệu doanh thu.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [filterType, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRevenueData();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    const token = localStorage.getItem('token');
    let queryStr = `?filterType=${filterType}`;
    if (filterType === 'custom' && startDate && endDate) {
      queryStr += `&startDate=${startDate}&endDate=${endDate}`;
    }
    axios.get(staffApiUrl(`/revenue/orders${queryStr}&search=`), {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setOrders(res.data));
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

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'card': return 'Thẻ ngân hàng';
      case 'other': return 'Khác';
      default: return method;
    }
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash': return <Wallet size={14} />;
      case 'bank_transfer': return <ArrowUpRight size={14} />;
      case 'card': return <CreditCard size={14} />;
      default: return <DollarSign size={14} />;
    }
  };

  // Xuất báo cáo CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Không có dữ liệu hóa đơn để xuất báo cáo.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Mã hóa đơn,Tên bàn,Ngày thanh toán,Phương thức thanh toán,Tổng tiền (VND),Chi tiết món ăn\n";

    orders.forEach(order => {
      const itemsStr = order.items.map(i => `${i.product_name} (x${i.quantity})`).join('; ');
      const row = [
        `#${order.order_code}`,
        order.table_name,
        formatDateTime(order.created_at),
        getPaymentMethodLabel(order.payment_method),
        order.total_amount,
        `"${itemsStr}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_cao_doanh_thu_${filterType}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Thống kê theo ca phục vụ: ca ngày có thể kéo dài đến trước 17h, ca tối có thể kéo qua 22h.
  const getServiceShiftStats = () => {
    const stats = createServiceShiftStats();
    orders.forEach(o => {
      const shift = getServiceShift(o.created_at);
      if (shift) stats[shift] = (stats[shift] || 0) + 1;
    });
    return stats;
  };

  const serviceShiftStats = getServiceShiftStats();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      
      {/* ============ SIDEBAR ============ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:flex'}`}>
        <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Utensils className="text-white h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-extrabold tracking-wider font-heading text-white">Phở Hương Phú</h2>
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
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <BarChart3 size={16} className="text-white" />
                </div>
                Báo cáo Doanh thu
              </h1>
              <p className="text-xs text-gray-500 font-body hidden sm:block mt-0.5 ml-[42px]">Thống kê doanh thu, hóa đơn thực tế đã thanh toán</p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-30 disabled:hover:from-emerald-500 disabled:hover:to-teal-500 text-white text-xs font-heading font-bold rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/15"
          >
            <FileSpreadsheet size={14} />
            <span>Xuất báo cáo</span>
          </button>
        </header>

        {/* Nội dung báo cáo */}
        <div className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 animate-scale-in">
              <XCircle className="flex-shrink-0" size={18} />
              <p className="text-sm font-body font-bold">{error}</p>
            </div>
          )}

          {/* ============ TIME FILTER BAR ============ */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
            {/* Quick filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'today', label: '📅 Hôm nay' },
                { id: 'yesterday', label: '⏪ Hôm qua' },
                { id: 'seven_days', label: '📆 7 ngày qua' },
                { id: 'this_month', label: '🗓️ Tháng này' },
                { id: 'custom', label: '⚙️ Tùy chọn' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterType(opt.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-heading font-bold border transition-all duration-300 cursor-pointer ${
                    filterType === opt.id
                      ? 'bg-gradient-to-r from-primary to-orange-500 border-transparent text-white shadow-md shadow-primary/20 scale-105'
                      : 'bg-slate-950/50 text-slate-400 border-white/[0.06] hover:text-white hover:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom date + search */}
            <div className="flex items-center gap-3 flex-wrap">
              {filterType === 'custom' && (
                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.06] text-xs text-slate-300">
                  <Calendar size={14} className="text-primary" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent border-0 text-white outline-none focus:ring-0"
                  />
                  <span className="text-slate-600 font-bold px-1">→</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent border-0 text-white outline-none focus:ring-0"
                  />
                </div>
              )}

              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-60">
                <Search className="absolute left-3 top-2.5 text-gray-600" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bàn, mã hóa đơn..."
                  className="w-full bg-slate-950/60 border border-white/[0.06] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/40 text-left transition-colors"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={handleResetSearch} 
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest animate-pulse">Đang nạp dữ liệu thống kê...</p>
            </div>
          ) : (
            <>
              {/* ============ KPI CARDS ============ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {[
                  {
                    label: 'Doanh thu thực tế',
                    value: formatPrice(stats?.overview?.total_revenue || 0),
                    subtitle: 'Đã loại trừ đơn hủy',
                    icon: <DollarSign size={20} />,
                    gradient: 'from-emerald-500/20 to-teal-500/20',
                    iconBg: 'bg-emerald-500/15',
                    iconColor: 'text-emerald-400',
                    valueColor: 'text-emerald-400',
                    subtitleColor: 'text-emerald-400/60',
                  },
                  {
                    label: 'Hóa đơn hoàn thành',
                    value: `${stats?.overview?.total_orders || 0}`,
                    unit: 'đơn',
                    subtitle: 'Thanh toán hoàn tất 100%',
                    icon: <ShoppingBag size={20} />,
                    gradient: 'from-primary/20 to-orange-500/20',
                    iconBg: 'bg-primary/15',
                    iconColor: 'text-primary',
                    valueColor: 'text-white',
                    subtitleColor: 'text-gray-500',
                  },
                  {
                    label: 'Giá trị TB / đơn',
                    value: formatPrice(stats?.overview?.avg_order_value || 0),
                    subtitle: 'Tính trên mỗi hóa đơn',
                    icon: <TrendingUp size={20} />,
                    gradient: 'from-sky-500/20 to-blue-500/20',
                    iconBg: 'bg-sky-500/15',
                    iconColor: 'text-sky-400',
                    valueColor: 'text-sky-400',
                    subtitleColor: 'text-gray-500',
                  },
                  {
                    label: 'Doanh thu món kèm',
                    value: formatPrice(stats?.overview?.toppings_revenue || 0),
                    subtitle: `Chiếm ${stats?.overview?.total_revenue > 0 ? ((stats?.overview?.toppings_revenue / stats?.overview?.total_revenue) * 100).toFixed(1) : 0}% tổng`,
                    icon: <Award size={20} />,
                    gradient: 'from-violet-500/20 to-purple-500/20',
                    iconBg: 'bg-violet-500/15',
                    iconColor: 'text-violet-400',
                    valueColor: 'text-violet-400',
                    subtitleColor: 'text-violet-400/60',
                  },
                ].map((kpi, idx) => (
                  <div key={idx} className={`relative overflow-hidden bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5 shadow-xl animate-float-up`} style={{ animationDelay: `${idx * 60}ms` }}>
                    {/* Decorative gradient orb */}
                    <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${kpi.gradient} rounded-full blur-2xl opacity-60`}></div>
                    
                    <div className={`relative z-10 w-10 h-10 ${kpi.iconBg} ${kpi.iconColor} rounded-xl flex items-center justify-center mb-3`}>
                      {kpi.icon}
                    </div>
                    <p className="relative z-10 text-[10px] font-heading font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                    <h3 className={`relative z-10 text-lg sm:text-xl font-heading font-extrabold ${kpi.valueColor} mt-1 truncate`}>
                      {kpi.value} {kpi.unit && <span className="text-sm font-bold text-gray-500">{kpi.unit}</span>}
                    </h3>
                    <p className={`relative z-10 text-[10px] font-body ${kpi.subtitleColor} mt-1.5`}>{kpi.subtitle}</p>
                  </div>
                ))}
              </div>

              {/* ============ CHARTS & INSIGHTS ============ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between backdrop-blur-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.04] mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                        <BarChart3 size={14} />
                      </div>
                      <div>
                        <h3 className="text-sm font-heading font-extrabold text-white">Xu hướng Doanh thu</h3>
                        <p className="text-[10px] text-gray-500 font-body">Biểu đồ biến động doanh thu theo ngày</p>
                      </div>
                    </div>
                  </div>

                  {!stats || !stats.dailyTrend || stats.dailyTrend.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 size={24} className="text-gray-600" />
                      </div>
                      <p className="text-sm font-heading font-bold text-gray-500">Không có dữ liệu xu hướng</p>
                      <p className="text-xs text-gray-600 font-body mt-1">Chưa ghi nhận doanh thu trong khoảng thời gian này</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Bar chart */}
                      <div className="w-full h-52 sm:h-60 relative flex items-end justify-between px-1 pt-6">
                        {stats.dailyTrend.map((d) => {
                          const maxRevenue = Math.max(...stats.dailyTrend.map(x => x.total_revenue), 1);
                          const heightPct = (d.total_revenue / maxRevenue) * 85;
                          
                          return (
                            <div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end px-0.5">
                              {/* Revenue bar */}
                              <div 
                                style={{ height: `${heightPct}%` }}
                                className="w-full max-w-[18px] bg-gradient-to-t from-primary via-orange-500 to-amber-400 rounded-t-lg transition-all duration-500 hover:brightness-125 shadow-lg shadow-primary/10 relative cursor-pointer"
                              >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-heading font-bold text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20 scale-90 group-hover:scale-100">
                                  <p className="text-gray-400">{d.date}</p>
                                  <p className="text-primary">{formatPrice(d.total_revenue)}</p>
                                  <p className="text-slate-400">{d.count} đơn</p>
                                </div>
                              </div>
                              {/* Date label */}
                              <span className="text-[7px] sm:text-[8px] text-slate-600 font-body mt-2 font-bold">
                                {d.date.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right sidebar: Payment methods + Top products */}
                <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 space-y-6 flex flex-col justify-between backdrop-blur-sm">
                  {/* Payment methods */}
                  <div>
                    <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04] mb-4">
                      <div className="w-6 h-6 bg-violet-500/10 text-violet-400 rounded-lg flex items-center justify-center">
                        <PieChart size={12} />
                      </div>
                      <h3 className="text-xs font-heading font-extrabold text-white uppercase tracking-wider">
                        Phương thức thanh toán
                      </h3>
                    </div>
                    
                    {!stats || !stats.paymentBreakdown || stats.paymentBreakdown.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">Chưa ghi nhận phương thức thanh toán</p>
                    ) : (
                      <div className="space-y-3.5">
                        {stats.paymentBreakdown.map(pay => {
                          const totalRev = stats?.overview?.total_revenue || 1;
                          const pct = (pay.total_revenue / totalRev) * 100;
                          
                          return (
                            <div key={pay.payment_method} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-heading font-semibold text-slate-300 flex items-center gap-1.5">
                                  <span className="w-5 h-5 bg-white/[0.04] rounded-md flex items-center justify-center text-primary">
                                    {getPaymentIcon(pay.payment_method)}
                                  </span>
                                  {getPaymentMethodLabel(pay.payment_method)}
                                </span>
                                <span className="font-heading font-bold text-primary text-[11px]">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden border border-white/[0.03]">
                                <div 
                                  style={{ width: `${pct}%` }} 
                                  className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-700"
                                ></div>
                              </div>
                              <p className="text-[10px] text-gray-500 font-body">{formatPrice(pay.total_revenue)}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top products */}
                  <div className="pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04] mb-4">
                      <div className="w-6 h-6 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center">
                        <Award size={12} />
                      </div>
                      <h3 className="text-xs font-heading font-extrabold text-white uppercase tracking-wider">
                        Top 5 bán chạy
                      </h3>
                    </div>
                    
                    {!stats || !stats.topProducts || stats.topProducts.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">Chưa có món ăn nào bán ra</p>
                    ) : (
                      <div className="space-y-2.5">
                        {stats.topProducts.map((prod, index) => {
                          const medals = ['🥇', '🥈', '🥉'];
                          return (
                            <div key={index} className="flex justify-between items-center text-xs p-2 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                              <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <span className="w-6 h-6 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm flex-shrink-0">
                                  {index < 3 ? medals[index] : <span className="text-[10px] text-gray-500">#{index + 1}</span>}
                                </span>
                                <span className="font-heading font-bold text-slate-300 truncate text-[11px]">
                                  {prod.product_name}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="font-heading font-extrabold text-white text-[11px]">{prod.quantity_sold}</span>
                                <p className="text-[9px] text-gray-500 font-body">{formatPrice(prod.total_revenue)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ============ SERVICE SHIFT CHART ============ */}
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 text-left backdrop-blur-sm">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-7 h-7 bg-sky-500/10 text-sky-400 rounded-lg flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  <h3 className="text-xs font-heading font-extrabold text-white uppercase tracking-wider">
                    Phân bố đơn theo ca phục vụ
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_SHIFT_OPTIONS.map((shift, idx) => {
                    const slot = {
                      ...shift,
                      count: serviceShiftStats[shift.id],
                      gradient: shift.id === 'day' ? 'from-amber-400 to-orange-500' : 'from-primary to-orange-500',
                      bg: shift.id === 'day' ? 'bg-amber-500/10' : 'bg-primary/10',
                      icon: shift.id === 'day' ? <Sunrise size={16} className="text-amber-400" /> : <Moon size={16} className="text-primary" />,
                    };
                    const maxCount = Math.max(...Object.values(serviceShiftStats), 1);
                    const heightPct = (slot.count / maxCount) * 100;
                    return (
                      <div key={slot.id} className="relative group rounded-2xl p-4 flex flex-col items-center justify-end min-h-[160px] bg-slate-950/30 border border-white/[0.04] hover:border-white/[0.08] hover:bg-slate-950/50 transition-all duration-300" style={{ animationDelay: `${idx * 80}ms` }}>
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============ REVENUE BY TABLE + QUICK INSIGHTS ============ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                
                {/* Revenue by Table */}
                <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.04] mb-4">
                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-extrabold text-white">Doanh thu theo Bàn</h3>
                      <p className="text-[10px] text-gray-500 font-body">Bàn nào mang lại doanh thu cao nhất?</p>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-14 h-14 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <MapPin size={20} className="text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-heading font-bold">Chưa có dữ liệu bàn</p>
                    </div>
                  ) : (() => {
                    // Tính doanh thu theo bàn
                    const tableRevenue = {};
                    orders.forEach(o => {
                      if (!tableRevenue[o.table_name]) {
                        tableRevenue[o.table_name] = { revenue: 0, count: 0 };
                      }
                      tableRevenue[o.table_name].revenue += parseFloat(o.total_amount) || 0;
                      tableRevenue[o.table_name].count += 1;
                    });
                    const sorted = Object.entries(tableRevenue)
                      .map(([name, data]) => ({ name, ...data }))
                      .sort((a, b) => b.revenue - a.revenue);
                    const maxRevenue = sorted[0]?.revenue || 1;

                    return (
                      <div className="space-y-3 max-h-[320px] overflow-y-auto no-scrollbar pr-1">
                        {sorted.map((table, idx) => {
                          const pct = (table.revenue / maxRevenue) * 100;
                          const medals = ['🥇', '🥈', '🥉'];
                          return (
                            <div key={table.name} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                                    {idx < 3 ? medals[idx] : <span className="text-[10px] text-gray-500 font-bold">#{idx + 1}</span>}
                                  </span>
                                  <span className="font-heading font-bold text-white text-xs">{table.name}</span>
                                  <span className="text-[10px] text-gray-500 font-body">{table.count} đơn</span>
                                </div>
                                <span className="font-heading font-extrabold text-primary text-xs">{formatPrice(table.revenue)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Quick Insights */}
                <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.04] mb-4">
                    <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                      <TrendingUp size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-extrabold text-white">Chỉ số Nổi bật</h3>
                      <p className="text-[10px] text-gray-500 font-body">Tổng hợp nhanh các chỉ số quan trọng</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Peak shift */}
                    {(() => {
                      const peakEntry = Object.entries(serviceShiftStats).reduce((a, b) => a[1] >= b[1] ? a : b, ['none', 0]);
                      const peakLabels = { day: '🌅 Ca ngày', evening: '🌙 Ca tối' };
                      return (
                        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] text-center">
                          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Clock size={18} />
                          </div>
                          <p className="text-[10px] text-gray-500 font-heading font-bold uppercase tracking-wider">Ca cao điểm</p>
                          <p className="text-sm font-heading font-extrabold text-white mt-1">{peakLabels[peakEntry[0]] || 'N/A'}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{peakEntry[1]} đơn</p>
                        </div>
                      );
                    })()}

                    {/* Best table */}
                    {(() => {
                      const tableRevenue = {};
                      orders.forEach(o => {
                        tableRevenue[o.table_name] = (tableRevenue[o.table_name] || 0) + (parseFloat(o.total_amount) || 0);
                      });
                      const best = Object.entries(tableRevenue).sort((a, b) => b[1] - a[1])[0];
                      return (
                        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] text-center">
                          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <MapPin size={18} />
                          </div>
                          <p className="text-[10px] text-gray-500 font-heading font-bold uppercase tracking-wider">Bàn hot nhất</p>
                          <p className="text-sm font-heading font-extrabold text-white mt-1">{best ? best[0] : 'N/A'}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{best ? formatPrice(best[1]) : ''}</p>
                        </div>
                      );
                    })()}

                    {/* Avg items per order */}
                    {(() => {
                      const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
                      const avgItems = orders.length > 0 ? (totalItems / orders.length).toFixed(1) : '0';
                      return (
                        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] text-center">
                          <div className="w-10 h-10 bg-sky-500/10 text-sky-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <ShoppingBag size={18} />
                          </div>
                          <p className="text-[10px] text-gray-500 font-heading font-bold uppercase tracking-wider">TB món / đơn</p>
                          <p className="text-sm font-heading font-extrabold text-white mt-1">{avgItems} món</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">trên {orders.length} đơn</p>
                        </div>
                      );
                    })()}

                    {/* Total orders count */}
                    {(() => {
                      const totalOrders = stats?.overview?.total_orders || 0;
                      return (
                        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] text-center">
                          <div className="w-10 h-10 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Award size={18} />
                          </div>
                          <p className="text-[10px] text-gray-500 font-heading font-bold uppercase tracking-wider">Hiệu suất</p>
                          <p className="text-sm font-heading font-extrabold text-white mt-1">{totalOrders} đơn</p>
                          <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Hoàn thành 100%</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

    </div>
  );
};

export default RevenueManagement;
