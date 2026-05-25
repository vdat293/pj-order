import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipboardCheck, ThumbsUp, ChefHat, CheckCircle, ArrowLeft, Receipt, PhoneCall, Timer, Sparkles } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api/public';

const OrderStatus = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [countdown, setCountdown] = useState(720);
    const [showServedPopup, setShowServedPopup] = useState(false);

    useEffect(() => {
        if (!orderData) return;
        const { status } = orderData;
        if (status === 'served' || status === 'completed') {
            setShowServedPopup(true);
            const timer = setTimeout(() => {
                navigate(`/order/${orderData.table_code}`);
            }, 4000); // 4 seconds
            return () => clearTimeout(timer);
        }
    }, [orderData, navigate]);

    const handleClosePopup = () => {
        if (orderData) {
            navigate(`/order/${orderData.table_code}`);
        }
    };

    const fetchOrderDetails = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
            setOrderData(res.data.order);
            setError(null);
        } catch (err) {
            console.error('Lỗi lấy chi tiết đơn hàng:', err);
            setError(err.response?.data?.message || 'Không thể lấy thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
        const interval = setInterval(() => {
            fetchOrderDetails();
        }, 4000);
        return () => clearInterval(interval);
    }, [orderId]);

    useEffect(() => {
        if (!orderData) return;
        const { status } = orderData;
        let initialSeconds = 900;
        if (status === 'confirmed') initialSeconds = 600;
        if (status === 'served' || status === 'completed') initialSeconds = 0;
        setCountdown(initialSeconds);
    }, [orderData]);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('vi-VN');
    };

    const handleCallStaff = () => {
        alert('🛎️ Đã phát tín hiệu yêu cầu hỗ trợ! Nhân viên sẽ tới bàn của bạn ngay lập tức.');
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-surface">
                <div className="relative flex items-center justify-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-primary/15 border-t-primary"></div>
                    <ChefHat className="absolute text-primary h-6 w-6 animate-pulse" />
                </div>
                <p className="text-on-surface-variant/60 font-heading font-bold text-xs mt-4 tracking-wider animate-pulse uppercase">ĐANG TRUY XUẤT ĐƠN HÀNG...</p>
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-error-container/30 text-error w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-error/10">
                    <Receipt size={32} />
                </div>
                <h2 className="text-xl font-heading font-bold text-on-surface mb-2">Không tìm thấy đơn hàng</h2>
                <p className="text-sm text-on-surface-variant/60 max-w-[280px] mb-6 font-body">Mã đơn #{orderId} không hợp lệ hoặc đã bị hủy.</p>
                <button 
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-primary to-orange-500 text-white font-heading font-bold px-6 py-3 rounded-2xl shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all duration-200"
                >
                    Quay lại thực đơn
                </button>
            </div>
        );
    }

    const { status, order_code, total_amount, created_at, table_name, table_code, items } = orderData;

    const steps = [
        { key: 'pending', label: 'Đã gửi đơn', icon: ClipboardCheck, desc: 'Chờ nhận đơn' },
        { key: 'confirmed', label: 'Đang nấu', icon: ThumbsUp, desc: 'Bếp đang làm món' },
        { key: 'served', label: 'Đã phục vụ', icon: CheckCircle, desc: 'Thưởng thức món ăn' }
    ];

    const getActiveStepIndex = () => {
        if (status === 'pending') return 0;
        if (status === 'confirmed') return 1;
        if (status === 'served' || status === 'completed') return 2;
        return 0;
    };

    const activeStepIndex = getActiveStepIndex();

    const getTimelineEvents = (createdAtStr) => {
        const time = new Date(createdAtStr);
        const list = [];
        list.push({ time: time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), title: 'Đã gửi đơn hàng', desc: 'Yêu cầu gọi món đã được chuyển thành công tới hệ thống của quán.', active: true });
        if (status === 'confirmed' || status === 'served' || status === 'completed') {
            const confirmTime = new Date(time.getTime() + 45000);
            list.push({ time: confirmTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), title: 'Đã duyệt & Đang nấu', desc: 'Nhân viên phục vụ đã duyệt đơn hàng và bếp đang thực hiện nấu.', active: true });
        }
        if (status === 'served' || status === 'completed') {
            const serveTime = new Date(time.getTime() + 300000);
            list.push({ time: serveTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), title: 'Đã phục vụ & Hoàn tất', desc: 'Tất cả các món ăn đã được bưng lên đầy đủ. Cảm ơn quý khách!', active: true });
        }
        return list.reverse();
    };

    const timelineEvents = getTimelineEvents(created_at);

    return (
        <div className="bg-surface min-h-screen pb-20">
            
            {/* Header */}
            <div className="sticky top-0 z-40 glass-panel border-b border-gray-100/50">
                <div className="px-5 py-3.5 flex justify-between items-center max-w-lg mx-auto">
                    <button 
                        onClick={() => navigate(`/order/${table_code}`)}
                        className="p-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-2xl transition-all duration-200 flex items-center justify-center border border-gray-100/80 bg-white/80"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <span className="text-sm font-heading font-bold text-on-surface tracking-tight">Theo dõi đơn hàng</span>
                    <button 
                        onClick={handleCallStaff}
                        className="p-2.5 text-primary hover:bg-primary/5 rounded-2xl transition-all duration-200 flex items-center justify-center border border-primary/15 bg-white/80 gap-1.5"
                    >
                        <PhoneCall size={14} />
                        <span className="text-[10px] font-heading font-bold tracking-wide uppercase">Gọi bàn</span>
                    </button>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-5">
                
                {/* Countdown Timer Card */}
                {status !== 'served' && status !== 'completed' ? (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden animate-float-up">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/15 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                        
                        <div className="flex justify-between items-center relative z-10">
                            <div className="space-y-1.5">
                                <span className="bg-primary/15 text-primary border border-primary/25 text-[10px] font-heading font-bold tracking-wider uppercase px-3 py-1.5 rounded-xl inline-block">
                                    Đang chế biến
                                </span>
                                <h3 className="text-lg font-heading font-extrabold tracking-tight mt-2">Dự kiến phục vụ sau</h3>
                                <p className="text-xs text-gray-400 font-body">Đầu bếp đang thực hiện đơn hàng của bạn</p>
                            </div>
                            
                            <div className="relative flex items-center justify-center w-24 h-24 bg-white/5 rounded-full border border-white/10">
                                <div className="absolute inset-2 rounded-full border-[3px] border-white/10 border-t-primary animate-spin" style={{animationDuration: '3s'}}></div>
                                <div className="flex flex-col items-center justify-center relative z-10">
                                    <Timer size={16} className="text-primary mb-1" />
                                    <span className="text-lg font-heading font-extrabold tracking-tighter tabular-nums">
                                        {formatCountdown(countdown)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-emerald-950 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden animate-float-up">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                        
                        <div className="flex justify-between items-center relative z-10">
                            <div className="space-y-1.5">
                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-heading font-bold tracking-wider uppercase px-3 py-1.5 rounded-xl inline-block">
                                    Hoàn thành
                                </span>
                                <h3 className="text-lg font-heading font-extrabold tracking-tight mt-2">Món đã phục vụ đủ!</h3>
                                <p className="text-xs text-gray-400 font-body">Chúc quý khách có bữa ăn thật ngon miệng</p>
                            </div>
                            
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/15">
                                <Sparkles className="text-emerald-400 h-10 w-10 animate-bounce" style={{animationDuration: '2s'}} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Stepper Progress */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-soft animate-float-up animate-float-up-2">
                    <h3 className="font-heading font-extrabold text-on-surface text-sm tracking-wide uppercase mb-6 pl-1 flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-primary to-orange-500"></span>
                        Tiến trình lên món
                    </h3>

                    <div className="relative pl-8 space-y-6">
                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100 rounded-full">
                            <div 
                                className="w-full bg-gradient-to-b from-primary to-orange-500 transition-all duration-700 ease-out rounded-full"
                                style={{ height: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
                            ></div>
                        </div>

                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = index < activeStepIndex;
                            const isActive = index === activeStepIndex;
                            const isUpcoming = index > activeStepIndex;

                            return (
                                <div key={step.key} className="relative flex gap-4 items-start">
                                    <div className="absolute -left-[30px] z-10">
                                        <div 
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border relative ${
                                                isCompleted 
                                                    ? 'bg-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/20'
                                                    : isActive
                                                        ? 'bg-gradient-to-br from-primary to-orange-500 text-white border-transparent shadow-lg shadow-primary/20 scale-110'
                                                        : 'bg-white text-on-surface-variant/30 border-gray-200'
                                            }`}
                                        >
                                            {isActive && (
                                                <span className="absolute inset-0 rounded-full bg-primary/40 animate-radar"></span>
                                            )}
                                            <StepIcon size={14} className="stroke-[2.5] relative z-10" />
                                        </div>
                                    </div>

                                    <div className="flex-1 -mt-0.5">
                                        <h4 
                                            className={`text-sm font-heading font-bold transition-colors duration-300 ${
                                                isActive 
                                                    ? 'text-primary'
                                                    : isUpcoming 
                                                        ? 'text-on-surface-variant/40' 
                                                        : 'text-on-surface/80'
                                            }`}
                                        >
                                            {step.label}
                                        </h4>
                                        <p className="text-xs text-on-surface-variant/50 mt-0.5 font-body">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Receipt Card */}
                <div className="bg-white rounded-t-3xl pt-6 px-6 pb-9 border border-gray-100/80 border-b-transparent shadow-soft relative paper-teeth overflow-hidden animate-float-up animate-float-up-3">
                    <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                    
                    <h3 className="font-heading font-extrabold text-on-surface text-sm tracking-wide uppercase mb-4 pl-1 flex items-center gap-2 border-b border-gray-100/80 pb-3 flex-shrink-0">
                        <Receipt size={16} className="text-primary" />
                        <span>Biên lai đặt món</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-4 bg-surface-container-low/60 rounded-2xl p-4 mb-5 text-left border border-gray-100/50">
                        <div>
                            <p className="text-[9px] text-on-surface-variant/50 font-heading font-bold uppercase tracking-wider">Mã đơn hàng</p>
                            <p className="text-xs font-heading font-extrabold text-on-surface mt-1">#{order_code.substring(0, 12)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-on-surface-variant/50 font-heading font-bold uppercase tracking-wider">Vị trí bàn</p>
                            <p className="text-xs font-heading font-extrabold text-emerald-700 mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                {table_name}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-start text-sm">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-heading font-extrabold text-on-surface">{item.quantity}x</span>
                                        <span className="font-heading font-semibold text-on-surface/80">{item.product_name}</span>
                                    </div>
                                    {item.note && (
                                        <p className="text-[11px] text-on-surface-variant/50 italic mt-1 pl-4 border-l-2 border-primary/15 font-body">
                                            Ghi chú: {item.note}
                                        </p>
                                    )}
                                </div>
                                <span className="font-heading font-bold text-on-surface/70 flex-shrink-0">{formatPrice(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-gray-200/80 my-4"></div>

                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs text-on-surface-variant/50">
                            <span className="font-body">Tạm tính món ăn:</span>
                            <span className="font-heading font-bold">{formatPrice(total_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-on-surface-variant/50">
                            <span className="font-body">Ưu đãi đơn QR (10%):</span>
                            <span className="font-heading font-bold text-emerald-500">-10% (Tại quầy)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-on-surface-variant/50">
                            <span className="font-body">Phí phục vụ bàn:</span>
                            <span className="font-heading font-bold text-emerald-500">Miễn phí</span>
                        </div>
                        <div className="border-t border-gray-100/80 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-heading font-extrabold text-on-surface text-sm">Tổng cộng đơn hàng:</span>
                            <span className="text-xl font-heading font-extrabold text-primary">{formatPrice(total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-soft animate-float-up animate-float-up-4">
                    <h3 className="font-heading font-extrabold text-on-surface text-sm tracking-wide uppercase mb-5 pl-1 flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-primary to-orange-500"></span>
                        Nhật ký chuẩn bị
                    </h3>

                    <div className="relative pl-6 space-y-6">
                        <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-gray-100/80 rounded-full"></div>

                        {timelineEvents.map((evt, idx) => (
                            <div key={idx} className="relative flex gap-3.5 items-start">
                                <div className="absolute -left-[22px] z-10">
                                    <div 
                                        className={`w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center transition-all duration-300 ${
                                            idx === 0 
                                                ? 'border-primary shadow-sm scale-110' 
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        {idx === 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>}
                                    </div>
                                </div>

                                <div className="flex-1 -mt-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-heading font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                                            {evt.time}
                                        </span>
                                        <h5 className="text-xs font-heading font-bold text-on-surface/80">{evt.title}</h5>
                                    </div>
                                    <p className="text-[11px] text-on-surface-variant/50 mt-1.5 leading-relaxed font-body">{evt.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-2 animate-float-up animate-float-up-5">
                    <button 
                        onClick={() => navigate(`/order/${table_code}`)}
                        className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-heading font-bold h-[54px] rounded-2xl shadow-lg shadow-primary/15 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        Tiếp tục gọi thêm món ăn
                    </button>
                    <button 
                        onClick={handleCallStaff}
                        className="w-full bg-white border border-gray-200/80 hover:border-gray-300 text-on-surface font-heading font-bold h-[54px] rounded-2xl active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2 shadow-soft"
                    >
                        <PhoneCall size={16} />
                        <span>Yêu cầu nhân viên hỗ trợ</span>
                    </button>
                </div>

            </div>

            {/* Pop-up Thông báo Lên món thành công & Chúc ngon miệng */}
            {showServedPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-scale-in">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 mb-5 relative">
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                            </span>
                            <Sparkles className="h-10 w-10 text-emerald-500 animate-bounce" style={{ animationDuration: '2s' }} />
                        </div>
                        <h3 className="text-xl font-heading font-extrabold text-slate-900 mb-2">Món ăn đã được phục vụ</h3>
                        <p className="text-sm text-gray-500 font-body mb-6 max-w-[260px] leading-relaxed">
                            Chúc quý khách có bữa ăn thật ngon miệng. Hệ thống sẽ đưa bạn trở lại thực đơn sau giây lát...
                        </p>
                        <button
                            onClick={handleClosePopup}
                            className="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-heading font-bold py-3.5 rounded-2xl text-xs hover:shadow-lg shadow-primary/10 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                        >
                            Quay lại thực đơn ngay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderStatus;
