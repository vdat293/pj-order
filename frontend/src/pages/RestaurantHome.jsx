import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  Clock,
  GlassWater,
  Leaf,
  MapPin,
  Menu as MenuIcon,
  Navigation,
  Phone,
  Soup,
  Truck,
  Utensils,
  X,
  ChevronDown,
  Star,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import heroImage from '../assets/hero.png';
import { publicApiUrl } from '../config/api';

/* ─── Restaurant config (env) ─── */
const restaurant = {
  name: import.meta.env.VITE_RESTAURANT_NAME || 'Phở Hương Phú',
  description:
    import.meta.env.VITE_RESTAURANT_DESCRIPTION ||
    'Phở Hương Phú phục vụ phở, bún bò, cơm gà và lẩu bò tại 14 Phạm Thị Tân. Món nóng, vị dễ ăn, phù hợp ăn tại quán và mang đi.',
  phone: import.meta.env.VITE_RESTAURANT_PHONE || 'Đang cập nhật',
  phoneHref: import.meta.env.VITE_RESTAURANT_PHONE_HREF || '',
  zalo: import.meta.env.VITE_RESTAURANT_ZALO || 'Đang cập nhật',
  zaloHref: import.meta.env.VITE_RESTAURANT_ZALO_HREF || '',
  address: import.meta.env.VITE_RESTAURANT_ADDRESS || '14 Phạm Thị Tân',
  hours: import.meta.env.VITE_RESTAURANT_HOURS || 'Đang cập nhật',
  serviceArea: import.meta.env.VITE_RESTAURANT_SERVICE_AREA || 'Phục vụ tại quán, mang đi và gọi món QR tại bàn',
  mapUrl: import.meta.env.VITE_RESTAURANT_MAP_URL || 'https://www.google.com/maps?cid=4222439019284246754',
  mapEmbedUrl:
    import.meta.env.VITE_RESTAURANT_MAP_EMBED_URL ||
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7833.321304983537!2d106.66432217570507!3d10.98896635523606!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d1005738666d%3A0x3a991deaa62fb0e2!2zUGjhu58gSMawxqFuZyBQaMO6ICggUGjhu58sIELDum4gQsOyLCBDxqFtIEfDoCwgTOG6qXUgQsOyICkgMTQgUGjhuqFtIFRo4buLIFTDom4!5e0!3m2!1svi!2s!4v1780752353605!5m2!1svi!2s',
  orderPath: import.meta.env.VITE_DEFAULT_ORDER_PATH || ''
};

const phoneDigits = restaurant.phone.replace(/\D/g, '');
const zaloDigits = restaurant.zalo.replace(/\D/g, '');
const phoneContactHref = restaurant.phoneHref || (phoneDigits ? `tel:${phoneDigits}` : '#info');
const zaloContactHref = restaurant.zaloHref || (zaloDigits ? `https://zalo.me/${zaloDigits}` : '#info');

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);
};

const flattenMenu = (menu) => menu.flatMap((category) => category.products || []);

const isDrinkCategory = (name = '') => {
  const normalized = name.toLowerCase();
  return normalized.includes('nước') || normalized.includes('trà') || normalized.includes('cà phê') || normalized.includes('sữa');
};

/* ─── Scroll-triggered animation hook ─── */
const useReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

/* ─── Featured product card — mobile-first design ─── */
const ProductFeatureCard = ({ product, label, tone = 'primary', onOrder, index = 0 }) => {
  const isGreen = tone === 'green';
  const [ref, isVisible] = useReveal();

  return (
    <article
      ref={ref}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft transition-all duration-700 md:flex-row ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Image — shorter on mobile for less scroll */}
      <div className="relative h-[200px] overflow-hidden sm:h-[240px] md:h-auto md:w-1/2">
        <img
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src={product.image_url || heroImage}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent md:bg-gradient-to-r" />
        {/* Badge */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3.5 sm:py-1.5 sm:text-xs ${
            isGreen
              ? 'bg-emerald-500/90 text-white'
              : 'bg-gradient-to-r from-[#8f000d] to-[#c41e2a] text-white'
          }`}
        >
          {isGreen ? <Sparkles size={12} /> : <Star size={12} />}
          {label}
        </span>
      </div>

      {/* Content — tighter padding on mobile */}
      <div className="flex flex-1 p-4 sm:p-5 md:p-7">
        <div className="flex w-full flex-col justify-between gap-3">
          <div>
            <h3 className="mb-1 font-heading text-lg font-bold leading-snug text-on-surface sm:text-[20px]">
              {product.name}
            </h3>
            <p className="text-sm leading-relaxed text-on-surface-variant sm:text-body-md line-clamp-2">
              {product.description || 'Món ăn được chuẩn bị nóng, hương vị truyền thống và nguyên liệu tươi mỗi ngày.'}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="rounded-lg bg-primary-container/50 px-3 py-1.5 sm:rounded-xl sm:px-4 sm:py-2">
              <span className="text-lg font-extrabold text-[#8f000d] sm:text-xl">{formatPrice(product.price)}</span>
            </div>
            <button
              className={`relative overflow-hidden rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm ${
                product.is_available
                  ? 'bg-gradient-to-r from-[#8f000d] to-[#c41e2a] active:scale-[0.96]'
                  : 'cursor-not-allowed bg-surface-container-high text-on-surface-variant'
              }`}
              disabled={!product.is_available}
              onClick={onOrder}
            >
              {product.is_available ? 'Đặt nhanh' : 'Hết món'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

/* ─── Skeleton loader ─── */
const SkeletonCard = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft md:flex-row">
    <div className="h-[200px] shimmer sm:h-[240px] md:w-1/2" />
    <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5 md:p-7">
      <div>
        <div className="mb-2 h-5 w-3/4 rounded-lg shimmer" />
        <div className="mb-1 h-4 w-full rounded-lg shimmer" />
        <div className="h-4 w-2/3 rounded-lg shimmer" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 rounded-lg shimmer" />
        <div className="h-9 w-20 rounded-lg shimmer" />
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════
   MAIN COMPONENT — Landing page giới thiệu quán
   ════════════════════════════════════════════════ */
const RestaurantHome = () => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);

  /* Scroll-aware navbar + bottom bar */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setShowBottomBar(y > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Close mobile menu on link tap */
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let mounted = true;

    const fetchMenu = async () => {
      try {
        const response = await axios.get(publicApiUrl('/menu'));
        if (mounted) {
          setMenu(response.data || []);
          setError('');
        }
      } catch (err) {
        console.error('Không thể tải thực đơn:', err);
        if (mounted) {
          setError('Chưa tải được thực đơn từ hệ thống order. Vui lòng thử lại sau.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMenu();
    return () => { mounted = false; };
  }, []);

  const products = useMemo(() => flattenMenu(menu), [menu]);

  const availableProducts = useMemo(() => {
    return products.filter((product) => product.is_available);
  }, [products]);

  const featuredProducts = useMemo(() => {
    return [...availableProducts]
      .sort((a, b) => Number(b.order_count || 0) - Number(a.order_count || 0))
      .slice(0, 2);
  }, [availableProducts]);

  const heroPhoto = featuredProducts.find((product) => product.image_url)?.image_url || heroImage;
  const infoPhoto = availableProducts.find((product) => product.image_url && product.image_url !== heroPhoto)?.image_url || heroPhoto;

  const drinkProducts = useMemo(() => {
    return menu
      .filter((category) => isDrinkCategory(category.name))
      .flatMap((category) => category.products || [])
      .filter((product) => product.is_available)
      .slice(0, 4);
  }, [menu]);

  const toppingNames = useMemo(() => {
    const names = new Set();
    products.forEach((product) => {
      (product.toppings || []).forEach((topping) => {
        if (topping.is_available !== false) {
          names.add(topping.name);
        }
      });
    });
    return Array.from(names).slice(0, 8);
  }, [products]);

  const handleOrderClick = () => {
    if (restaurant.orderPath) {
      navigate(restaurant.orderPath);
      return;
    }
    document.getElementById('info')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* Reveal refs */
  const [aboutRef, aboutVisible] = useReveal();
  const [menuRef, menuVisible] = useReveal();
  const [infoRef, infoVisible] = useReveal();
  const [mapRef, mapVisible] = useReveal();

  const navLinks = [
    { label: 'Trang chủ', href: '#top' },
    { label: 'Thực đơn', href: '#menu' },
    { label: 'Giới thiệu', href: '#about' },
    { label: 'Liên hệ', href: '#info' }
  ];

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface selection:bg-primary-container selection:text-[#92030f]">

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? 'header-scrolled py-1 shadow-soft sm:py-2'
            : 'bg-transparent py-2 sm:py-3'
        }`}
      >
        <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-14 sm:px-6">
          {/* Brand */}
          <a className="flex items-center gap-2" href="#top">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 sm:h-10 sm:w-10 ${
              scrolled ? 'bg-gradient-to-br from-[#8f000d] to-[#c41e2a]' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <Utensils size={18} className="text-white sm:h-5 sm:w-5" />
            </div>
            <span className={`text-lg font-heading font-bold transition-colors duration-300 sm:text-xl ${
              scrolled ? 'text-[#8f000d]' : 'text-white'
            }`}>
              {restaurant.name}
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                className={`relative text-sm font-semibold uppercase tracking-wider transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:transition-all after:duration-300 hover:after:w-full ${
                  scrolled
                    ? 'text-on-surface-variant hover:text-[#8f000d] after:bg-[#8f000d]'
                    : 'text-white/80 hover:text-white after:bg-white'
                }`}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 ${
                scrolled
                  ? 'bg-gradient-to-r from-[#8f000d] to-[#c41e2a] text-white shadow-glow-primary'
                  : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
              }`}
              href={phoneContactHref}
            >
              Gọi ngay
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 lg:hidden ${
              scrolled
                ? 'text-[#8f000d] hover:bg-primary-container/40'
                : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </nav>

      {/* ═══════════════ MOBILE MENU OVERLAY ═══════════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMobileMenu}
      />
      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[min(85vw,320px)] bg-white shadow-2xl transition-transform duration-500 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <div className="flex h-14 items-center justify-between px-5">
          <span className="font-heading text-lg font-bold text-[#8f000d]">{restaurant.name}</span>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            onClick={closeMobileMenu}
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex h-[calc(100%-56px)] flex-col justify-between px-5 pb-8">
          {/* Nav links */}
          <div className="space-y-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                className="flex items-center rounded-xl px-4 py-3.5 text-base font-semibold text-on-surface transition-colors active:bg-primary-container/30"
                href={link.href}
                onClick={closeMobileMenu}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Bottom CTA in slide menu */}
          <div className="space-y-3 border-t border-surface-container-high pt-6">
            <a
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8f000d] to-[#c41e2a] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg"
              href={phoneContactHref}
            >
              <Phone size={18} />
              Gọi đặt bàn
            </a>
            <a
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-emerald-700"
              href={zaloContactHref}
            >
              <MessageCircle size={18} />
              Nhắn Zalo
            </a>
            <a
              className="flex items-center justify-center gap-2 rounded-xl bg-surface-container px-6 py-3 text-sm font-semibold text-on-surface-variant"
              href={restaurant.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={16} />
              Chỉ đường
            </a>
          </div>
        </div>
      </div>

      <main id="top">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <img
              alt={`${restaurant.name} hero`}
              className="h-full w-full scale-105 object-cover"
              src={heroPhoto}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/70" />
          </div>

          {/* Decorative blurs */}
          <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
            <div className="absolute -left-16 top-1/4 h-48 w-48 rounded-full bg-[#8f000d]/10 blur-3xl sm:h-64 sm:w-64" />
            <div className="absolute -right-16 bottom-1/3 h-56 w-56 rounded-full bg-amber-500/8 blur-3xl sm:h-80 sm:w-80" />
          </div>

          {/* Hero content — mobile-first sizing */}
          <div className="relative z-10 w-full max-w-3xl px-5 text-center text-white sm:px-6">
            {/* Tag */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm animate-fade-in sm:mb-6 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm">
              <Soup size={14} className="text-amber-300 sm:h-4 sm:w-4" />
              <span>Ẩm thực Việt truyền thống</span>
            </div>

            <h1 className="mb-4 font-heading text-[clamp(32px,8vw,56px)] font-extrabold leading-[1.1] tracking-tight animate-slide-up sm:mb-6">
              {restaurant.name}
            </h1>

            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-white/80 animate-fade-in sm:mb-10 sm:max-w-xl sm:text-base sm:text-white/85" style={{ animationDelay: '200ms' }}>
              {restaurant.description}
            </p>

            {/* CTA buttons — stacked on mobile, row on tablet+ */}
            <div className="flex flex-col items-center gap-3 animate-fade-in sm:flex-row sm:justify-center sm:gap-4" style={{ animationDelay: '400ms' }}>
              <a
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8f000d] to-[#c41e2a] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 active:scale-[0.97] sm:w-auto sm:px-8 sm:py-3.5"
                href="#menu"
              >
                Xem thực đơn
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all duration-300 active:scale-[0.97] sm:w-auto sm:px-8 sm:py-3.5"
                href={phoneContactHref}
              >
                <Phone size={16} />
                Gọi ngay
              </a>
              <a
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600/90 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm transition-all duration-300 active:scale-[0.97] sm:w-auto sm:px-8 sm:py-3.5"
                href={restaurant.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={16} />
                Chỉ đường
              </a>
            </div>
          </div>

          {/* Scroll indicator — hidden on very small screens */}
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/50 hidden sm:block">
            <ChevronDown size={24} className="animate-bounce" />
          </div>
        </section>

        {/* ═══════════════ ABOUT ═══════════════ */}
        <section className="relative overflow-hidden py-14 sm:py-20 lg:py-24" id="about">
          <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-primary-container/20 blur-3xl pointer-events-none sm:h-96 sm:w-96" />

          <div ref={aboutRef} className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className={`mb-10 text-center transition-all duration-700 sm:mb-16 ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <span className="mb-3 inline-block rounded-full bg-primary-container/50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8f000d] sm:mb-4 sm:px-4 sm:py-1.5 sm:text-xs">
                Câu chuyện của chúng tôi
              </span>
              <h2 className="mb-3 font-heading text-2xl font-bold text-on-surface sm:mb-4 sm:text-3xl lg:text-4xl">
                Về <span className="text-[#8f000d]">{restaurant.name}</span>
              </h2>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-on-surface-variant sm:max-w-2xl sm:text-body-md">
                {restaurant.name} là quán ăn gia đình tại {restaurant.address}, phục vụ phở, bún bò, cơm gà và lẩu bò với trải nghiệm gọi món nhanh tại bàn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
              {[
                {
                  icon: Soup,
                  title: 'Hương vị quen thuộc',
                  body: 'Mỗi phần ăn được nêm nếm theo khẩu vị Việt, giữ vị nước dùng thanh, thịt mềm và món ăn luôn nóng khi phục vụ.',
                  gradient: 'from-[#8f000d] to-[#c41e2a]'
                },
                {
                  icon: Utensils,
                  title: 'Không gian dễ ghé',
                  body: 'Quán hướng tới cảm giác gần gũi, sạch sẽ và thuận tiện cho khách ăn sáng, ăn trưa, ăn tối hoặc mang đi.',
                  gradient: 'from-amber-500 to-orange-500'
                },
                {
                  icon: Leaf,
                  title: 'Thực đơn cập nhật',
                  body: 'Món ăn, topping và tình trạng hết món được quản lý trực tiếp từ hệ thống order để khách xem đúng thông tin hiện tại.',
                  gradient: 'from-emerald-500 to-green-600'
                }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <article
                    className={`group relative overflow-hidden rounded-2xl bg-white p-5 text-center shadow-soft transition-all duration-500 sm:p-6 md:p-8 ${
                      aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${(i + 1) * 150}ms` }}
                    key={item.title}
                  >
                    <div className={`relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg transition-transform duration-500 group-hover:scale-110 sm:mb-6 sm:h-16 sm:w-16`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <h3 className="relative mb-2 font-heading text-base font-bold text-on-surface sm:mb-3 sm:text-lg">{item.title}</h3>
                    <p className="relative text-sm leading-relaxed text-on-surface-variant sm:text-body-md">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURED MENU ═══════════════ */}
        <section className="relative overflow-hidden bg-surface-container-low py-14 sm:py-20 lg:py-24" id="menu">
          <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-primary-container/15 blur-3xl pointer-events-none sm:h-96 sm:w-96" />

          <div ref={menuRef} className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className={`mb-8 flex flex-col gap-3 sm:mb-14 sm:gap-4 md:flex-row md:items-end md:justify-between transition-all duration-700 ${
              menuVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
              <div>
                <span className="mb-2 inline-block rounded-full bg-primary-container/50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8f000d] sm:mb-4 sm:px-4 sm:py-1.5 sm:text-xs">
                  Được yêu thích nhất
                </span>
                <h2 className="mb-1 font-heading text-2xl font-bold text-on-surface sm:mb-2 sm:text-3xl lg:text-4xl">
                  Thực Đơn <span className="text-[#8f000d]">Nổi Bật</span>
                </h2>
                <p className="text-sm leading-relaxed text-on-surface-variant sm:text-body-md">
                  Những món phở tâm huyết được lấy trực tiếp từ hệ thống order.
                </p>
              </div>
              <button
                className="group inline-flex items-center gap-2 self-start text-sm font-bold uppercase tracking-wider text-[#8f000d] transition-all duration-300 md:self-auto"
                onClick={handleOrderClick}
              >
                Xem toàn bộ menu
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-2 sm:h-[18px] sm:w-[18px]" />
              </button>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-error-container bg-white p-3 shadow-soft sm:mb-8 sm:rounded-2xl sm:p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error-container sm:h-10 sm:w-10">
                  <X size={16} className="text-error" />
                </div>
                <p className="text-xs font-semibold text-error sm:text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-14 sm:gap-6 md:grid-cols-2 md:gap-8">
                {[1, 2].map((item) => <SkeletonCard key={item} />)}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-14 sm:gap-6 md:grid-cols-2 md:gap-8">
                {featuredProducts.map((product, index) => (
                  <ProductFeatureCard
                    key={product.id}
                    label={index === 0 ? 'Best Seller' : "Chef's Special"}
                    onOrder={handleOrderClick}
                    product={product}
                    tone={index === 0 ? 'primary' : 'green'}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="mb-8 rounded-2xl bg-white p-6 text-center shadow-soft sm:mb-14 sm:p-8">
                <Soup size={36} className="mx-auto mb-3 text-on-surface-variant/40" />
                <p className="text-sm text-on-surface-variant sm:text-body-md">Thực đơn đang được cập nhật.</p>
              </div>
            )}

            {/* Topping & Drinks cards */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
              {/* Topping */}
              <div className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl bg-white p-4 shadow-soft sm:min-h-[180px] sm:p-6 md:col-span-2">
                <div className="relative z-10">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-container/60 sm:h-8 sm:w-8">
                      <Utensils size={14} className="text-[#8f000d] sm:h-4 sm:w-4" />
                    </div>
                    <h4 className="font-heading text-base font-bold text-on-surface sm:text-lg">Topping Đa Dạng</h4>
                  </div>
                  <p className="mb-4 mt-1.5 text-sm leading-relaxed text-on-surface-variant sm:mb-5 sm:mt-2 sm:text-body-md">
                    {toppingNames.length > 0
                      ? toppingNames.join(' • ')
                      : 'Trứng chần, quẩy giòn, bò viên, nạm, gầu, gân và nhiều lựa chọn ăn kèm.'}
                  </p>
                  <button
                    className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-[#8f000d] transition-all duration-300"
                    onClick={handleOrderClick}
                  >
                    Xem chi tiết <ArrowRight size={14} />
                  </button>
                </div>
                <Utensils className="absolute -right-4 -bottom-4 h-[100px] w-[100px] text-[#8f000d] opacity-[0.04] sm:-right-6 sm:-bottom-6 sm:h-[140px] sm:w-[140px]" />
              </div>

              {/* Drinks */}
              <div className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-4 text-white shadow-soft sm:min-h-[180px] sm:p-6">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 sm:h-8 sm:w-8">
                      <GlassWater size={14} className="sm:h-4 sm:w-4" />
                    </div>
                    <h4 className="font-heading text-base font-bold sm:text-lg">Nước uống</h4>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/70 sm:mt-2 sm:text-sm sm:text-white/75">
                    {drinkProducts.length > 0
                      ? drinkProducts.map((product) => product.name).join(' • ')
                      : 'Trà đá, nước sâm, sữa bắp, nước ngọt các loại.'}
                  </p>
                </div>
                <div className="mt-3 flex justify-end sm:mt-4">
                  <GlassWater size={28} className="text-white/20 sm:h-9 sm:w-9" />
                </div>
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ INFO ═══════════════ */}
        <section className="py-14 sm:py-20 lg:py-24" id="info">
          <div ref={infoRef} className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Contact info */}
              <div className={`space-y-6 transition-all duration-700 sm:space-y-8 ${infoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div>
                  <span className="mb-3 inline-block rounded-full bg-primary-container/50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8f000d] sm:mb-4 sm:px-4 sm:py-1.5 sm:text-xs">
                    Liên hệ
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-on-surface sm:text-3xl lg:text-4xl">
                    Thông Tin <span className="text-[#8f000d]">Nhà Hàng</span>
                  </h2>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: MapPin, label: 'Địa chỉ', value: restaurant.address },
                    { icon: Clock, label: 'Giờ mở cửa', value: restaurant.hours },
                    { icon: Phone, label: 'Hotline', value: restaurant.phone },
                    { icon: Truck, label: 'Phục vụ', value: restaurant.serviceArea }
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        className={`flex items-start gap-3 rounded-xl bg-white p-3 shadow-soft transition-all duration-500 sm:gap-4 sm:p-4 ${
                          infoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
                        }`}
                        style={{ transitionDelay: `${(i + 1) * 100}ms` }}
                        key={item.label}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8f000d] to-[#c41e2a] sm:h-11 sm:w-11">
                          <Icon className="text-white" size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/70 sm:text-xs">{item.label}</p>
                          <p className="mt-0.5 text-sm font-medium text-on-surface sm:text-body-md">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1 sm:gap-4 sm:pt-2">
                  <a
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8f000d] to-[#c41e2a] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 active:scale-[0.97] sm:px-7 sm:py-3 sm:text-sm"
                    href={restaurant.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin size={16} />
                    Xem bản đồ
                  </a>
                  <div className="flex gap-2">
                    <a
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#8f000d] shadow-soft transition-all duration-300 active:scale-95 sm:h-11 sm:w-11"
                      href="#info"
                      aria-label="Facebook"
                    >
                      f
                    </a>
                    <a
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#8f000d] shadow-soft transition-all duration-300 active:scale-95 sm:h-11 sm:w-11"
                      href={zaloContactHref}
                      aria-label="Zalo"
                    >
                      Z
                    </a>
                  </div>
                </div>
              </div>

              {/* Image with glass quote */}
              <div className={`relative overflow-hidden rounded-2xl shadow-soft-lg transition-all duration-700 sm:rounded-3xl ${
                infoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '300ms' }}>
                <div className="aspect-[4/3] sm:aspect-square lg:aspect-[4/5]">
                  <img alt="Không gian quán" className="h-full w-full object-cover" src={infoPhoto} loading="lazy" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/20 bg-white/85 p-3 backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-6 sm:rounded-2xl sm:p-4">
                  <p className="text-center text-sm font-medium italic leading-relaxed text-on-surface sm:text-body-md">
                    "Không gian ấm cúng, mang lại cảm giác thân thuộc như bữa cơm gia đình."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ MAP ═══════════════ */}
        <section id="map" ref={mapRef}>
          {/* Mobile: stacked layout (card above map) */}
          <div className="lg:hidden">
            <div className={`bg-surface-container-low px-4 py-10 text-center sm:px-6 sm:py-14 transition-all duration-700 ${
              mapVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#8f000d] to-[#c41e2a] shadow-glow-primary sm:h-16 sm:w-16 sm:rounded-2xl">
                <MapPin className="text-white" size={24} />
              </div>
              <h4 className="mb-1.5 font-heading text-xl font-bold text-on-surface sm:text-2xl">Tìm Chúng Tôi</h4>
              <p className="mx-auto mb-4 w-full max-w-[260px] text-sm leading-relaxed text-on-surface-variant sm:mb-5 sm:max-w-sm sm:text-body-md">
                Nhấn để xem đường đi trên Google Maps
              </p>
              <a
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8f000d] to-[#c41e2a] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg active:scale-[0.97] sm:px-8 sm:py-3 sm:text-sm"
                href={restaurant.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={15} />
                Mở Bản Đồ
              </a>
            </div>
            <div className="relative h-[280px] overflow-hidden sm:h-[320px]">
              <iframe
                title={`Bản đồ ${restaurant.name}`}
                src={restaurant.mapEmbedUrl}
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Desktop: overlay layout */}
          <div className="relative hidden h-[450px] overflow-hidden lg:block">
            <iframe
              title={`Bản đồ ${restaurant.name}`}
              src={restaurant.mapEmbedUrl}
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="absolute inset-0 bg-on-surface/10" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className={`max-w-sm rounded-3xl border border-white/20 bg-white/95 p-8 text-center shadow-soft-lg backdrop-blur-xl transition-all duration-700 ${
                mapVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8f000d] to-[#c41e2a] shadow-glow-primary">
                  <MapPin className="text-white" size={28} />
                </div>
                <h4 className="mb-2 font-heading text-2xl font-bold text-on-surface">Tìm Chúng Tôi</h4>
                <p className="mb-6 text-body-md leading-relaxed text-on-surface-variant">
                  Nhấn để xem đường đi chi tiết trên Google Maps
                </p>
                <a
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8f000d] to-[#c41e2a] px-8 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-glow-primary"
                  href={restaurant.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={16} />
                  Mở Bản Đồ
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-[#1a1615] text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-16">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-12">
            {/* Brand */}
            <div className="col-span-2 space-y-4 sm:col-span-2 md:col-span-1 md:space-y-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8f000d] to-[#c41e2a] sm:h-10 sm:w-10">
                  <Utensils size={18} className="text-white" />
                </div>
                <h3 className="font-heading text-lg font-bold sm:text-xl">{restaurant.name}</h3>
              </div>
              <p className="text-xs leading-relaxed text-white/50 sm:text-sm">
                © 2026 {restaurant.name}.<br />
                Mang tinh hoa ẩm thực Việt đến mọi nhà.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40 sm:mb-5 sm:text-xs">Liên hệ</h4>
              <ul className="space-y-2.5 text-xs leading-relaxed text-white/60 sm:space-y-3 sm:text-sm">
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <MapPin className="mt-0.5 shrink-0 text-[#c41e2a]" size={13} />
                  {restaurant.address}
                </li>
                <li className="flex items-center gap-1.5 sm:gap-2">
                  <Phone className="shrink-0 text-[#c41e2a]" size={13} />
                  {restaurant.phone}
                </li>
                <li className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="shrink-0 text-[#c41e2a]" size={13} />
                  {restaurant.hours}
                </li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40 sm:mb-5 sm:text-xs">Liên kết</h4>
              <ul className="space-y-2.5 text-xs sm:space-y-3 sm:text-sm">
                {['Zalo', 'Facebook', 'Instagram', 'TikTok'].map((item) => (
                  <li key={item}>
                    <a className="text-white/60 transition-all duration-300 hover:text-white" href="#info">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40 sm:mb-5 sm:text-xs">Hỗ trợ</h4>
              <ul className="space-y-2.5 text-xs sm:space-y-3 sm:text-sm">
                {['Xem bản đồ', 'Chính sách giao', 'Phản hồi KH', 'Tuyển dụng'].map((item) => (
                  <li key={item}>
                    <a className="text-white/60 transition-all duration-300 hover:text-white" href="#info">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:mt-12 sm:flex-row sm:gap-4 sm:pt-8">
            <p className="text-[10px] text-white/30 sm:text-xs">Thiết kế bởi đội ngũ {restaurant.name}</p>
            <div className="flex gap-2">
              <a className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/50 transition-all duration-300 hover:bg-white/10 sm:h-9 sm:w-9" href="#info" aria-label="Facebook">f</a>
              <a className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/50 transition-all duration-300 hover:bg-white/10 sm:h-9 sm:w-9" href={zaloContactHref} aria-label="Zalo">Z</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════ MOBILE BOTTOM ACTION BAR ═══════════════ */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#1a1615]/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          showBottomBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 sm:gap-4 sm:py-3">
          <a
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8f000d] to-[#c41e2a] py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg active:scale-[0.97] sm:py-3 sm:text-sm"
            href={phoneContactHref}
          >
            <Phone size={16} />
            Gọi ngay
          </a>
          <a
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg active:scale-[0.97] sm:py-3 sm:text-sm"
            href={zaloContactHref}
          >
            <MessageCircle size={16} />
            Zalo
          </a>
          <a
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:scale-95 sm:h-11 sm:w-11"
            href={restaurant.mapUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Chỉ đường"
          >
            <Navigation size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHome;
