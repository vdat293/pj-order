import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ChefHat,
  ImageOff,
  Search,
  Soup,
  Sparkles,
  Utensils,
  X
} from 'lucide-react';
import heroImage from '../assets/hero.png';
import { publicApiUrl } from '../config/api';

const restaurant = {
  name: import.meta.env.VITE_RESTAURANT_NAME || 'Phở Hương Phú',
  logo: import.meta.env.VITE_RESTAURANT_LOGO_URL || '/logo.png'
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);
};

const PublicMenu = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

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
        console.error('Không thể tải thực đơn công khai:', err);
        if (mounted) {
          setError('Chưa tải được thực đơn. Vui lòng thử lại sau.');
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

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  const filteredMenu = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return menu;

    return menu
      .map((category) => ({
        ...category,
        products: (category.products || []).filter((product) => {
          return [product.name, product.description, category.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(keyword));
        })
      }))
      .filter((category) => category.products.length > 0);
  }, [menu, searchQuery]);

  const productCount = useMemo(() => {
    return menu.reduce((sum, category) => sum + (category.products?.length || 0), 0);
  }, [menu]);

  const availableCount = useMemo(() => {
    return menu.reduce((sum, category) => {
      return sum + (category.products || []).filter((product) => product.is_available).length;
    }, 0);
  }, [menu]);

  return (
    <div className="min-h-screen bg-[#f8f6f1] text-on-surface">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-[#8f000d] shadow-sm transition active:scale-95"
            to="/"
            aria-label="Về trang chủ"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <img
              alt={`${restaurant.name} logo`}
              className="h-9 w-9 shrink-0 rounded-xl object-cover"
              src={restaurant.logo}
            />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-extrabold text-[#8f000d] sm:text-base">
                {restaurant.name}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/55">
                Menu tham khảo
              </p>
            </div>
          </div>

          <a
            className="hidden rounded-full bg-[#1a1615] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white sm:inline-flex"
            href="#menu-list"
          >
            Xem món
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#1a1615]">
          <div className="absolute inset-0">
            <img
              alt=""
              className="h-full w-full object-cover opacity-35"
              src={heroImage}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1615]/60 via-[#1a1615]/75 to-[#1a1615]" />
          </div>

          <div className="relative mx-auto grid max-w-[1180px] gap-8 px-4 py-12 text-white sm:px-6 sm:py-16 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white/80">
                <ChefHat size={14} />
                Chỉ xem thực đơn
              </div>
              <h1 className="max-w-2xl font-heading text-3xl font-extrabold leading-tight sm:text-5xl">
                Thực đơn {restaurant.name}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/72 sm:text-base">
                Trang này tách riêng với hệ thống order tại bàn. Khách có thể xem món, giá và topping hiện có, nhưng không tạo đơn hàng.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-heading font-extrabold">{productCount}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/55">Tổng món</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-heading font-extrabold">{availableCount}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/55">Đang bán</p>
              </div>
            </div>
          </div>
        </section>

        <section id="menu-list" className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
          <div className="sticky top-16 z-30 -mx-4 border-b border-black/5 bg-[#f8f6f1]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
            <div className="relative mx-auto max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/45" size={18} />
              <input
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition focus:border-[#8f000d]/30 focus:ring-4 focus:ring-[#8f000d]/8"
                placeholder="Tìm món trong menu"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-100 bg-white p-4 text-sm font-semibold text-red-600 shadow-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          ) : filteredMenu.length > 0 ? (
            <div className="mt-8 space-y-10">
              {filteredMenu.map((category) => (
                <section key={category.id}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8f000d] text-white">
                        <Soup size={20} />
                      </div>
                      <div>
                        <h2 className="font-heading text-lg font-extrabold text-on-surface">
                          {category.name}
                        </h2>
                        <p className="text-xs font-semibold text-on-surface-variant/55">
                          {category.products.length} món
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {category.products.map((product) => (
                      <button
                        key={product.id}
                        className={`group flex min-h-32 w-full gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition active:scale-[0.99] ${
                          product.is_available
                            ? 'border-gray-100 hover:border-[#8f000d]/20 hover:shadow-md'
                            : 'border-gray-100 opacity-65 grayscale-[35%]'
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container-low">
                          {product.image_url ? (
                            <img
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              loading="lazy"
                              src={product.image_url}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-on-surface-variant/35">
                              <ImageOff size={24} />
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="line-clamp-1 font-heading text-sm font-extrabold text-on-surface sm:text-base">
                                {product.name}
                              </h3>
                              {!product.is_available && (
                                <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-500">
                                  Hết
                                </span>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-on-surface-variant/65">
                              {product.description || 'Thông tin món đang được cập nhật.'}
                            </p>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="font-heading text-sm font-extrabold text-[#8f000d]">
                              {formatPrice(product.price)}
                            </span>
                            {(product.toppings || []).length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                <Sparkles size={11} />
                                Topping
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-14 max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-on-surface-variant/35 shadow-sm">
                <Search size={28} />
              </div>
              <p className="font-heading font-bold text-on-surface/70">Không tìm thấy món</p>
              <p className="mt-1 text-sm text-on-surface-variant/55">Thử từ khóa khác hoặc xóa ô tìm kiếm.</p>
            </div>
          )}
        </section>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
            aria-label="Đóng chi tiết món"
          />
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-3xl">
            <button
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-on-surface shadow-sm"
              onClick={() => setSelectedProduct(null)}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="max-h-[92vh] overflow-y-auto">
              <div className="h-56 bg-surface-container-low">
                {selectedProduct.image_url ? (
                  <img
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                    src={selectedProduct.image_url}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-on-surface-variant/35">
                    <ImageOff size={34} />
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-extrabold leading-tight text-on-surface">
                      {selectedProduct.name}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant/70">
                      {selectedProduct.description || 'Thông tin món đang được cập nhật.'}
                    </p>
                  </div>
                  <p className="shrink-0 rounded-xl bg-primary-container/60 px-3 py-2 font-heading text-base font-extrabold text-[#8f000d]">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>

                {!selectedProduct.is_available && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">
                    Món này hiện đang tạm hết.
                  </div>
                )}

                {(selectedProduct.toppings || []).length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-extrabold uppercase tracking-wider text-on-surface">
                      <Utensils size={16} className="text-[#8f000d]" />
                      Topping và món ăn kèm
                    </h3>
                    <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
                      {selectedProduct.toppings.map((topping) => (
                        <div key={topping.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{topping.name}</p>
                            {topping.is_available === false && (
                              <p className="mt-0.5 text-[11px] font-semibold text-red-500">Tạm hết</p>
                            )}
                          </div>
                          <span className="font-heading text-sm font-extrabold text-[#8f000d]">
                            +{formatPrice(topping.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 rounded-2xl bg-[#f8f6f1] p-4 text-xs leading-relaxed text-on-surface-variant/70">
                  Menu này chỉ dùng để xem. Khi ăn tại quán, khách quét QR ở bàn để gọi món qua hệ thống order riêng.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;
