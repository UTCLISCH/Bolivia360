import React, { useEffect, useState } from 'react';

// --- Types ---
type ViewState = 'landing' | 'login' | 'register' | 'app';
type Role = 'turista' | 'operador' | 'administrador' | null;
type Category = 'Aventura' | 'Cultural' | 'Naturaleza' | 'Gastronómica';

interface Lugar {
  id: number;
  title: string;
  image: string;
  desc: string;
  price: string;
  priceNum: number;
  rating: string;
  stock: number;
  category: Category;
  duration: string;
}

interface Review {
  id: number;
  lugarId: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const MAX_UPLOAD_IMAGE_SIZE = 2 * 1024 * 1024;

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
  reader.readAsDataURL(file);
});

// --- Helper Components ---
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sz = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-base';
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <React.Fragment key={i}>
          <Icon name={i < Math.round(rating) ? 'star' : 'star_border'} className={`${sz} ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
        </React.Fragment>
      ))}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: Category }) => {
  const styles: Record<Category, { bg: string; icon: string }> = {
    Aventura:     { bg: 'bg-orange-100 text-orange-700', icon: 'directions_run' },
    Cultural:     { bg: 'bg-purple-100 text-purple-700', icon: 'museum' },
    Naturaleza:   { bg: 'bg-green-100 text-green-700',   icon: 'forest' },
    Gastronómica: { bg: 'bg-yellow-100 text-yellow-700', icon: 'restaurant' },
  };
  const s = styles[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg}`}>
      <Icon name={s.icon} className="text-[13px]" />{category}
    </span>
  );
};

const StockBadge = ({ stock }: { stock: number }) => {
  const isLow = stock < 5;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'} ${isLow ? 'animate-pulse' : ''}`}>
      <Icon name={isLow ? 'warning' : 'inventory_2'} className="text-[13px]" />
      {stock}
    </span>
  );
};

// --- Menus ---
const ROLE_MENUS = {
  turista: [
    { id: 'inicio',     label: 'Inicio',       icon: 'home' },
    { id: 'planificar', label: 'Planificar',    icon: 'explore' },
    { id: 'destinos',   label: 'Destinos',      icon: 'location_on' },
    { id: 'clima',      label: 'Clima',         icon: 'partly_cloudy_day' },
    { id: 'alertas',    label: 'Alertas',       icon: 'warning' },
  ],
  operador: [
    { id: 'inicio',     label: 'Inicio',        icon: 'home' },
    { id: 'inventario', label: 'Inventario',    icon: 'inventory_2' },
    { id: 'publicar',   label: 'Agregar Lugar', icon: 'add_circle' },
  ],
  administrador: [
    { id: 'inicio',   label: 'Inicio',   icon: 'home' },
    { id: 'usuarios', label: 'Usuarios', icon: 'group' },
    { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
  ],
};

const ALL_CATEGORIES: Category[] = ['Aventura', 'Cultural', 'Naturaleza', 'Gastronómica'];

// --- Initial Data ---
const INITIAL_LUGARES: Lugar[] = [
  { id: 1, title: 'Salar de Uyuni',      image: 'https://picsum.photos/seed/uyuni/800/600',     desc: 'El mayor desierto de sal continuo y alto del mundo. Una experiencia visual única en el departamento de Potosí.',          price: '$150', priceNum: 150, rating: '4.9', stock: 12, category: 'Naturaleza',  duration: '2 días' },
  { id: 2, title: 'Lago Titicaca',       image: 'https://picsum.photos/seed/titicaca/800/600',  desc: 'El lago navegable más alto del mundo, rodeado de misticismo andino y cultura milenaria.',                                  price: '$80',  priceNum: 80,  rating: '4.7', stock: 8,  category: 'Cultural',    duration: '1 día' },
  { id: 3, title: 'Parque Madidi',       image: 'https://picsum.photos/seed/madidi/800/600',    desc: 'Reserva con inmensa biodiversidad en la Amazonía boliviana. Fauna y flora únicas en el planeta.',                          price: '$200', priceNum: 200, rating: '4.8', stock: 3,  category: 'Aventura',    duration: '3 días' },
  { id: 4, title: 'Misiones Jesuíticas', image: 'https://picsum.photos/seed/misiones/800/600',  desc: 'Patrimonio cultural UNESCO en la Chiquitanía. Un viaje fascinante al pasado colonial boliviano.',                         price: '$120', priceNum: 120, rating: '4.6', stock: 2,  category: 'Cultural',    duration: '1 día' },
  { id: 5, title: 'Camino de la Muerte', image: 'https://picsum.photos/seed/deathroad/800/600', desc: 'La ruta más emocionante de Bolivia en bicicleta. Descenso de 3.600 m con vistas espectaculares.',                          price: '$75',  priceNum: 75,  rating: '4.8', stock: 15, category: 'Aventura',    duration: '1 día' },
  { id: 6, title: 'Valle de la Luna',    image: 'https://picsum.photos/seed/valleluna/800/600', desc: 'Formaciones geológicas lunares a las afueras de La Paz. Erosiones milenarias de arcilla y yeso.',                          price: '$30',  priceNum: 30,  rating: '4.5', stock: 25, category: 'Naturaleza',  duration: '3 horas' },
];

const INITIAL_REVIEWS: Review[] = [
  { id: 1, lugarId: 1, user: 'María G.',  rating: 5, comment: '¡Increíble experiencia! El atardecer en el salar fue absolutamente mágico. Imposible describirlo con palabras.', date: '2024-03-15' },
  { id: 2, lugarId: 1, user: 'Carlos R.', rating: 4, comment: 'Muy bien organizado. Los guías son excelentes y el paisaje es como de otro mundo.',                              date: '2024-03-10' },
  { id: 3, lugarId: 2, user: 'Sofía M.',  rating: 5, comment: 'Las islas flotantes de los Uros son fascinantes. Una cultura viva e impresionante.',                            date: '2024-02-20' },
  { id: 4, lugarId: 3, user: 'Pedro L.',  rating: 5, comment: 'La biodiversidad es abrumadora. Vi especies que jamás había imaginado. ¡Obligatorio!',                         date: '2024-01-12' },
  { id: 5, lugarId: 5, user: 'Ana P.',    rating: 5, comment: 'Adrenalina pura de principio a fin. El paisaje durante el descenso es absolutamente espectacular.',            date: '2024-03-20' },
  { id: 6, lugarId: 5, user: 'Luis F.',   rating: 4, comment: 'Excelente organización y equipamiento de primera calidad. Un recuerdo que llevaré siempre.',                   date: '2024-03-18' },
];

// --- Main App ---
export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [role, setRole] = useState<Role>(null);
  const [lugares, setLugares] = useState<Lugar[]>(INITIAL_LUGARES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbLugares, dbReviews] = await Promise.all([
          apiRequest<Lugar[]>('/lugares'),
          apiRequest<Review[]>('/reviews'),
        ]);
        setLugares(dbLugares);
        setReviews(dbReviews);
      } catch (error) {
        console.error('No se pudieron cargar datos desde MongoDB:', error);
      }
    };
    void loadData();
  }, []);

  const navigateTo = (view: ViewState) => { setCurrentView(view); window.scrollTo(0, 0); };
  const handleLogin = (selectedRole: Role) => { setRole(selectedRole); navigateTo('app'); };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-[#0077B6] selection:text-white">
      {currentView === 'landing'  && <LandingView onNavigate={navigateTo} />}
      {currentView === 'login'    && <LoginView onNavigate={navigateTo} onLogin={handleLogin} />}
      {currentView === 'register' && <RegisterView onNavigate={navigateTo} onLogin={handleLogin} />}
      {currentView === 'app' && (
        <MainAppView
          role={role}
          lugares={lugares}
          setLugares={setLugares}
          reviews={reviews}
          setReviews={setReviews}
          onLogout={() => { setRole(null); navigateTo('landing'); }}
        />
      )}
    </div>
  );
}

// --- Landing View ---
function LandingView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex items-center justify-between p-6 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 text-[#0077B6] font-bold text-2xl tracking-tight">
          <Icon name="travel_explore" className="text-3xl" />
          <span>Chuquiago360</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('login')} className="px-5 py-2.5 text-[#0077B6] font-medium hover:bg-blue-50 rounded-full transition-colors">
            Iniciar sesión
          </button>
          <button onClick={() => onNavigate('register')} className="px-5 py-2.5 bg-[#2D6A4F] text-white font-medium rounded-full hover:bg-[#1f4a37] transition-colors shadow-md">
            Registrarse
          </button>
        </div>
      </header>
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://picsum.photos/seed/bolivia_hero/1920/1080" alt="Hero" className="w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/90 to-white"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Descubre el corazón de <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0077B6] to-[#2D6A4F]">Sudamérica</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Planifica, explora y vive experiencias inolvidables con nuestra plataforma impulsada por IA.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => onNavigate('register')} className="px-8 py-4 bg-[#0077B6] text-white font-semibold rounded-full hover:bg-[#005f92] transition-all shadow-lg hover:-translate-y-1 flex items-center gap-2 text-lg">
              <Icon name="person_add" /> Crear cuenta
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Register View ---
function RegisterView({ onNavigate, onLogin }: { onNavigate: (v: ViewState) => void; onLogin: (r: Role) => void }) {
  const handleRegister = (e: React.FormEvent) => { e.preventDefault(); onLogin('turista'); };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gray-100">
      <div className="absolute top-0 left-0 w-full h-96 bg-[#2D6A4F] -skew-y-6 origin-top-left -z-10"></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-10">
          <div className="flex justify-center mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="flex items-center gap-2 text-[#2D6A4F] font-bold text-4xl tracking-tight">
              <Icon name="travel_explore" className="text-5xl" /><span>Chuquiago360</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Crear una cuenta</h2>
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
              <div className="relative">
                <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="Juan Pérez" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <div className="relative">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="tu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className="w-full py-3.5 bg-[#2D6A4F] text-white font-bold rounded-xl hover:bg-[#1f4a37] transition-colors shadow-md">Registrarse</button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta? <button onClick={() => onNavigate('login')} className="text-[#0077B6] font-bold hover:underline">Inicia sesión</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Login View ---
function LoginView({ onNavigate, onLogin }: { onNavigate: (v: ViewState) => void; onLogin: (r: Role) => void }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const handleSimulateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setMsg('Ingresa un correo para continuar.'); return; }
    onLogin('turista');
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gray-100">
      <div className="absolute top-0 left-0 w-full h-96 bg-[#0077B6] -skew-y-6 origin-top-left -z-10"></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-10">
          <div className="flex justify-center mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="flex items-center gap-2 text-[#0077B6] font-bold text-4xl tracking-tight">
              <Icon name="travel_explore" className="text-5xl" /><span>Chuquiago360</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Iniciar Sesión</h2>
          <form className="space-y-5" onSubmit={handleSimulateLogin}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <div className="relative">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="tu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="••••••••" />
              </div>
            </div>
            {msg && <p className="text-red-500 text-sm text-center font-medium">{msg}</p>}
            <button type="submit" className="w-full py-3.5 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors shadow-md">Ingresar</button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-center text-gray-500 mb-4 font-medium">O ingresa rápidamente como:</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => onLogin('turista')} className="py-2.5 px-2 text-xs font-bold bg-blue-50 text-[#0077B6] rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-1">
                <Icon name="hiking" className="text-[20px]" /> Turista
              </button>
              <button onClick={() => onLogin('operador')} className="py-2.5 px-2 text-xs font-bold bg-green-50 text-[#2D6A4F] rounded-xl hover:bg-green-100 transition-colors flex flex-col items-center gap-1">
                <Icon name="storefront" className="text-[20px]" /> Operador
              </button>
              <button onClick={() => onLogin('administrador')} className="py-2.5 px-2 text-xs font-bold bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors flex flex-col items-center gap-1">
                <Icon name="admin_panel_settings" className="text-[20px]" /> Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App View ---
function MainAppView({ role, lugares, setLugares, reviews, setReviews, onLogout }: {
  role: Role;
  lugares: Lugar[];
  setLugares: React.Dispatch<React.SetStateAction<Lugar[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedItem, setSelectedItem] = useState<Lugar | null>(null);
  const [editingLugar, setEditingLugar] = useState<Lugar | null>(null);

  const menu = role ? ROLE_MENUS[role] : [];

  const handleSelectDestino = (destino: Lugar) => {
    setSelectedItem(destino);
    setActiveTab('detalle_destino');
  };

  const handleReserve = async (lugarId: number, quantity: number, date: string) => {
    try {
      const result = await apiRequest<{ lugar: Lugar }>('/reservas', {
        method: 'POST',
        body: JSON.stringify({ lugarId, quantity, date }),
      });
      setLugares(prev => prev.map(l => l.id === lugarId ? result.lugar : l));
      setSelectedItem(prev => prev && prev.id === lugarId ? result.lugar : prev);
      return true;
    } catch (error) {
      console.error('No se pudo registrar la reserva:', error);
      return false;
    }
  };

  const handleAddLugar = async (lugar: Omit<Lugar, 'id'>) => {
    try {
      const created = await apiRequest<Lugar>('/lugares', {
        method: 'POST',
        body: JSON.stringify(lugar),
      });
      setLugares(prev => [...prev, created]);
    } catch (error) {
      console.error('No se pudo crear el lugar:', error);
    }
  };

  const handleUpdateLugar = async (updated: Lugar) => {
    try {
      const saved = await apiRequest<Lugar>(`/lugares/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setLugares(prev => prev.map(l => l.id === saved.id ? saved : l));
      if (selectedItem?.id === saved.id) setSelectedItem(saved);
    } catch (error) {
      console.error('No se pudo actualizar el lugar:', error);
    }
    setEditingLugar(null);
  };

  const handleDeleteLugar = async (id: number) => {
    try {
      await apiRequest<void>(`/lugares/${id}`, { method: 'DELETE' });
      setLugares(prev => prev.filter(l => l.id !== id));
      setReviews(prev => prev.filter(r => r.lugarId !== id));
    } catch (error) {
      console.error('No se pudo eliminar el lugar:', error);
    }
  };

  const handleUpdateStock = async (id: number, stock: number) => {
    try {
      const saved = await apiRequest<Lugar>(`/lugares/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      });
      setLugares(prev => prev.map(l => l.id === saved.id ? saved : l));
      if (selectedItem?.id === saved.id) setSelectedItem(saved);
    } catch (error) {
      console.error('No se pudo actualizar el stock:', error);
    }
  };

  const handleAddReview = async (review: Omit<Review, 'id'>) => {
    try {
      const saved = await apiRequest<Review>('/reviews', {
        method: 'POST',
        body: JSON.stringify(review),
      });
      setReviews(prev => [saved, ...prev]);
    } catch (error) {
      console.error('No se pudo registrar la reseña:', error);
    }
  };

  const renderContent = () => {
    if (activeTab === 'perfil') return <PerfilView />;
    if (activeTab === 'detalle_destino' && selectedItem) {
      const lugarActual = lugares.find(l => l.id === selectedItem.id) ?? selectedItem;
      return (
        <DestinoDetalleView
          destino={lugarActual}
          reviews={reviews.filter(r => r.lugarId === lugarActual.id)}
          role={role}
          onBack={() => setActiveTab('inicio')}
          onReserve={handleReserve}
          onAddReview={(review) => { void handleAddReview(review); }}
        />
      );
    }
    if (role === 'turista') {
      switch (activeTab) {
        case 'inicio':     return <TuristaInicio   lugares={lugares} onSelect={handleSelectDestino} />;
        case 'planificar': return <TuristaPlanificar />;
        case 'destinos':   return <TuristaDestinos  lugares={lugares} onSelect={handleSelectDestino} />;
        case 'clima':      return <TuristaClima />;
        case 'alertas':    return <TuristaAlertas />;
      }
    } else if (role === 'operador') {
      switch (activeTab) {
        case 'inicio':     return <OperadorInicio />;
        case 'inventario': return (
          <OperadorInventario
            lugares={lugares}
            onEdit={setEditingLugar}
            onDelete={(id) => { void handleDeleteLugar(id); }}
            onUpdateStock={(id, stock) => { void handleUpdateStock(id, stock); }}
          />
        );
        case 'publicar':   return <OperadorPublicar onSuccess={() => setActiveTab('inventario')} onAdd={(lugar) => { void handleAddLugar(lugar); }} />;
      }
    } else if (role === 'administrador') {
      switch (activeTab) {
        case 'inicio':   return <AdminInicio />;
        case 'usuarios': return <AdminUsuarios />;
        case 'reportes': return <AdminReportes />;
      }
    }
    return <div className="p-8 text-center text-gray-500">Vista no encontrada</div>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 border-b border-gray-100">
            <div className="flex items-center gap-2 text-[#0077B6] font-bold text-2xl">
              <Icon name="travel_explore" className="text-3xl" />
              <span className="hidden sm:block">Chuquiago360</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm font-bold text-[#2D6A4F] uppercase bg-green-50 px-3 py-1 rounded-full">{role}</span>
              <button onClick={() => setActiveTab('perfil')} className="flex items-center gap-2 text-gray-600 hover:text-[#0077B6] font-medium transition-colors">
                <Icon name="account_circle" /><span className="hidden sm:block">Mi perfil</span>
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium transition-colors">
                <Icon name="logout" /><span className="hidden sm:block">Salir</span>
              </button>
            </div>
          </div>
          <div className="flex overflow-x-auto py-3 gap-2 hide-scrollbar">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeTab === item.id ? 'bg-[#0077B6] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon name={item.icon} className="text-[20px]" />{item.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full pb-12">{renderContent()}</main>
      {editingLugar && (
        <EditLugarModal lugar={editingLugar} onSave={handleUpdateLugar} onClose={() => setEditingLugar(null)} />
      )}
    </div>
  );
}

// --- Shared Views ---
function PerfilView() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-6">Mi Perfil</h2>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-[#0077B6]">
            <Icon name="person" className="text-5xl" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Usuario de Prueba</h3>
            <p className="text-gray-500">usuario@chuquiago360.com</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
            <input type="text" defaultValue="Usuario de Prueba" className="w-full p-3 border rounded-xl bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Teléfono</label>
            <input type="text" defaultValue="+591 70000000" className="w-full p-3 border rounded-xl bg-gray-50" />
          </div>
          <button className="mt-4 px-6 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors flex items-center gap-2">
            <Icon name="save" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Detalle Experiencia ---
function DestinoDetalleView({ destino, reviews, role, onBack, onReserve, onAddReview }: {
  destino: Lugar;
  reviews: Review[];
  role: Role;
  onBack: () => void;
  onReserve: (lugarId: number, quantity: number, date: string) => Promise<boolean>;
  onAddReview: (r: Omit<Review, 'id'>) => void;
}) {
  const [showReserva, setShowReserva] = useState(false);
  const [reservaSuccess, setReservaSuccess] = useState(false);
  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  const handleReservaConfirm = async (quantity: number, date: string) => {
    const saved = await onReserve(destino.id, quantity, date);
    if (!saved) return;
    setShowReserva(false);
    setReservaSuccess(true);
    setTimeout(() => setReservaSuccess(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors group">
        <Icon name="arrow_back" className="group-hover:-translate-x-1 transition-transform" /> Volver al listado
      </button>

      {reservaSuccess && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-2xl animate-in slide-in-from-top-2">
          <Icon name="check_circle" className="text-green-600 text-2xl shrink-0" />
          <div>
            <p className="font-bold">¡Reserva confirmada!</p>
            <p className="text-sm">Tu experiencia ha sido reservada exitosamente. Recibirás un correo de confirmación.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="relative">
          <img src={destino.image} alt={destino.title} className="w-full h-80 md:h-96 object-cover" referrerPolicy="no-referrer" />
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            <CategoryBadge category={destino.category} />
            {destino.stock < 5 && destino.stock > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                <Icon name="warning" className="text-[13px]" /> ¡Últimos {destino.stock} cupos!
              </span>
            )}
            {destino.stock === 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-800 text-white">
                <Icon name="block" className="text-[13px]" /> Agotado
              </span>
            )}
          </div>
        </div>
        <div className="p-8 md:p-12">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{destino.title}</h1>
            <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl font-bold">
              <Icon name="star" className="text-yellow-500 text-xl" />
              <span className="text-xl">{destino.rating}</span>
              <span className="text-sm font-normal text-gray-500 ml-1">({reviews.length} reseñas)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-100">
              <Icon name="schedule" className="text-[#0077B6] text-[18px]" /> {destino.duration}
            </span>
            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-100">
              <Icon name="inventory_2" className={destino.stock < 5 ? 'text-red-500 text-[18px]' : 'text-green-600 text-[18px]'} />
              <span className={destino.stock < 5 ? 'text-red-600 font-bold' : 'text-gray-600'}>{destino.stock} cupos disponibles</span>
            </span>
          </div>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed">{destino.desc}</p>

          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Precio por persona</p>
              <p className="text-3xl font-bold text-[#2D6A4F]">{destino.price}</p>
            </div>
            <button
              onClick={() => setShowReserva(true)}
              disabled={destino.stock === 0}
              className="px-8 py-4 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] hover:-translate-y-0.5 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Icon name="book_online" /> {destino.stock === 0 ? 'Sin cupos disponibles' : 'Reservar Ahora'}
            </button>
          </div>
        </div>
      </div>

      <ReviewsSection
        lugarId={destino.id}
        reviews={reviews}
        avgRating={avgRating}
        role={role}
        onAddReview={onAddReview}
      />

      {showReserva && (
        <ReservaModal destino={destino} onConfirm={handleReservaConfirm} onClose={() => setShowReserva(false)} />
      )}
    </div>
  );
}

// --- Reserva Modal ---
function ReservaModal({ destino, onConfirm, onClose }: {
  destino: Lugar;
  onConfirm: (quantity: number, date: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const maxQty = Math.min(destino.stock, 10);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Icon name="book_online" className="text-[#0077B6]" /> Reservar experiencia
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-2xl">
            <img src={destino.image} className="w-16 h-16 rounded-xl object-cover shrink-0" alt={destino.title} referrerPolicy="no-referrer" />
            <div>
              <p className="font-bold text-gray-900">{destino.title}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><Icon name="schedule" className="text-[14px]" /> {destino.duration}</p>
              <p className="text-[#2D6A4F] font-bold">{destino.price} por persona</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Icon name="calendar_today" className="text-[#0077B6] text-[16px]" /> Fecha de la experiencia
            </label>
            <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <Icon name="group" className="text-[#0077B6] text-[16px]" /> Número de personas
            </label>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-xl transition-colors flex items-center justify-center">−</button>
              <span className="text-3xl font-bold w-14 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-xl transition-colors flex items-center justify-center">+</button>
              <span className="text-sm text-gray-400">máx. {maxQty}</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100">
            <span className="text-gray-600 font-medium flex items-center gap-2"><Icon name="receipt_long" className="text-gray-400" /> Total estimado</span>
            <span className="text-2xl font-extrabold text-[#2D6A4F]">${destino.priceNum * quantity}</span>
          </div>
          <button onClick={() => { if (date) onConfirm(quantity, date); }} disabled={!date}
            className="w-full py-4 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md">
            <Icon name="check_circle" /> Confirmar Reserva
          </button>
          {!date && <p className="text-center text-xs text-red-500 -mt-2">Selecciona una fecha para continuar</p>}
        </div>
      </div>
    </div>
  );
}

// --- Reviews Section ---
function ReviewsSection({ lugarId, reviews, avgRating, role, onAddReview }: {
  lugarId: number;
  reviews: Review[];
  avgRating: number;
  role: Role;
  onAddReview: (r: Omit<Review, 'id'>) => void;
}) {
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0 || !newComment.trim()) return;
    onAddReview({ lugarId, user: 'Tú', rating: newRating, comment: newComment.trim(), date: new Date().toISOString().split('T')[0] });
    setNewRating(0);
    setNewComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="mt-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Icon name="reviews" className="text-yellow-500" /> Reseñas
        </h2>

        {reviews.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
            <div className="text-center shrink-0">
              <p className="text-5xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</p>
              <StarRating rating={avgRating} size="md" />
              <p className="text-sm text-gray-500 mt-1">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => Math.round(r.rating) === star).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-500 text-right">{star}</span>
                    <Icon name="star" className="text-yellow-400 text-[14px]" />
                    <div className="flex-1 bg-yellow-100 rounded-full h-2.5">
                      <div className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-5 text-gray-500 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {reviews.length === 0 && (
            <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-3">
              <Icon name="rate_review" className="text-5xl" />
              <p className="text-lg">Sé el primero en dejar una reseña</p>
            </div>
          )}
          {reviews.map(r => (
            <div key={r.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                {r.user[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <span className="font-bold text-gray-900">{r.user}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Icon name="calendar_today" className="text-[12px]" />{r.date}</span>
                </div>
                <StarRating rating={r.rating} size="sm" />
                <p className="text-gray-600 text-sm mt-2">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>

        {role === 'turista' && !submitted && (
          <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Icon name="rate_review" className="text-[#0077B6]" /> Escribe tu reseña
            </h3>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tu calificación</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setNewRating(s)}
                    onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-transform hover:scale-125 focus:outline-none">
                    <Icon name={s <= (hoverRating || newRating) ? 'star' : 'star_border'} className={s <= (hoverRating || newRating) ? 'text-yellow-400' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
            </div>
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none resize-none mb-3"
              placeholder="Comparte tu experiencia con otros viajeros..." />
            <button type="submit" disabled={newRating === 0 || !newComment.trim()}
              className="px-6 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              <Icon name="send" /> Publicar reseña
            </button>
          </form>
        )}
        {submitted && (
          <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-100 p-4 rounded-2xl mt-4 animate-in fade-in">
            <Icon name="check_circle" className="text-2xl shrink-0" />
            <p className="font-semibold">¡Gracias por tu reseña! Ya está visible para otros viajeros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Confirm Dialog ---
function ConfirmDialog({ title, message, onConfirm, onCancel }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in slide-in-from-bottom-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Icon name="delete_forever" className="text-red-600 text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
        <p className="text-gray-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
            <Icon name="delete" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Edit Lugar Modal ---
function EditLugarModal({ lugar, onSave, onClose }: {
  lugar: Lugar;
  onSave: (l: Lugar) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Lugar>({ ...lugar });
  const set = (key: keyof Lugar, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, price: `$${form.priceNum}`, priceNum: Number(form.priceNum) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-4 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Icon name="edit" className="text-[#0077B6]" /> Editar lugar
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Descripción</label>
            <textarea value={form.desc} onChange={e => set('desc', e.target.value)} rows={3} required className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Precio (USD)</label>
              <input type="number" value={form.priceNum} onChange={e => set('priceNum', Number(e.target.value))} required min={1} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Cupos disponibles</label>
              <input type="number" value={form.stock} onChange={e => set('stock', Number(e.target.value))} required min={0} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Categoría</label>
              <select value={form.category} onChange={e => set('category', e.target.value as Category)} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none">
                {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Duración</label>
              <input value={form.duration} onChange={e => set('duration', e.target.value)} required className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" placeholder="Ej. 2 días" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">URL de imagen</label>
            <input type="url" value={form.image} onChange={e => set('image', e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors flex items-center justify-center gap-2">
              <Icon name="save" /> Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Turista Views ---
function TuristaInicio({ lugares, onSelect }: { lugares: Lugar[]; onSelect: (d: Lugar) => void }) {
  return (
    <div className="animate-in fade-in">
      <div className="relative h-[40vh] min-h-[300px] w-full bg-gray-900">
        <img src="https://picsum.photos/seed/andes/1920/1080" alt="Andes" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">¿A dónde quieres ir hoy?</h1>
          <div className="flex w-full max-w-2xl bg-white rounded-full p-2 shadow-2xl">
            <Icon name="search" className="text-gray-400 ml-4 mt-3" />
            <input type="text" placeholder="Ej. Salar de Uyuni, Coroico..." className="flex-1 bg-transparent outline-none px-4 text-gray-800 text-lg" />
            <button className="bg-[#2D6A4F] text-white px-8 py-3 rounded-full font-bold hover:bg-[#1f4a37] transition-colors">Buscar</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Icon name="local_fire_department" className="text-orange-500" /> Tendencias</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {lugares.slice(0, 4).map(d => (
            <div key={d.id} onClick={() => onSelect(d)} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <div className="h-48 overflow-hidden relative">
                <img src={d.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={d.title} referrerPolicy="no-referrer" />
                <div className="absolute top-2 left-2"><CategoryBadge category={d.category} /></div>
                {d.stock < 5 && d.stock > 0 && <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse">¡Últimos!</div>}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{d.title}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{d.duration}</span>
                  <span className="font-bold text-[#2D6A4F]">{d.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TuristaPlanificar() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);
  const handleGenerate = (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); setResult(true); }, 1500); };
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-2">Planificador con IA</h2>
      <p className="text-gray-600 mb-8">Cuéntanos qué buscas y generaremos el itinerario perfecto.</p>
      {!result ? (
        <form onSubmit={handleGenerate} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block font-semibold mb-2">Destino Principal</label>
              <input type="text" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. La Paz" /></div>
            <div><label className="block font-semibold mb-2">Días disponibles</label>
              <input type="number" required min="1" className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. 5" /></div>
            <div><label className="block font-semibold mb-2">Presupuesto (USD)</label>
              <input type="number" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. 500" /></div>
            <div><label className="block font-semibold mb-2">Tipo de viaje</label>
              <select className="w-full p-3 border rounded-xl bg-gray-50">
                <option>Aventura</option><option>Relajación</option><option>Cultural</option>
              </select></div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] flex justify-center items-center gap-2 transition-colors">
            {loading ? <Icon name="sync" className="animate-spin" /> : <Icon name="auto_awesome" />}
            {loading ? 'Generando ruta óptima...' : 'Generar Itinerario'}
          </button>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-[#2D6A4F] flex items-center gap-2"><Icon name="check_circle" /> Itinerario Generado</h3>
            <button onClick={() => setResult(false)} className="text-sm text-gray-500 hover:underline">Volver a intentar</button>
          </div>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
            {[1, 2, 3].map(day => (
              <div key={day} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0077B6] text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">{day}</div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-lg mb-1">Día {day}: Exploración</h4>
                  <p className="text-gray-600 text-sm">Visita a lugares históricos por la mañana y tour gastronómico por la tarde. Costo aprox: $50.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TuristaDestinos({ lugares, onSelect }: { lugares: Lugar[]; onSelect: (d: Lugar) => void }) {
  const [filterCat, setFilterCat] = useState<Category | 'Todas'>('Todas');
  const filtered = filterCat === 'Todas' ? lugares : lugares.filter(l => l.category === filterCat);
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-bold">Todos los Destinos</h2>
        <div className="flex flex-wrap gap-2">
          {(['Todas', ...ALL_CATEGORIES] as const).map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterCat === cat ? 'bg-[#0077B6] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
          <Icon name="search_off" className="text-5xl" />
          <p className="text-lg">No hay destinos en esta categoría.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(d => (
          <div key={d.id} onClick={() => onSelect(d)} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
            <div className="relative h-48 overflow-hidden">
              <img src={d.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={d.title} referrerPolicy="no-referrer" />
              <div className="absolute top-2 left-2"><CategoryBadge category={d.category} /></div>
              {d.stock < 5 && d.stock > 0 && <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse">¡Últimos!</div>}
              {d.stock === 0 && <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center"><span className="text-white font-bold text-sm bg-gray-800 px-3 py-1 rounded-full">Agotado</span></div>}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">{d.title}</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{d.desc}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 text-sm text-gray-500"><Icon name="schedule" className="text-[14px]" />{d.duration}</span>
                <span className="font-bold text-[#2D6A4F]">{d.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TuristaClima() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Clima Actual</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-3xl text-white shadow-lg hover:-translate-y-1 transition-transform cursor-default">
          <h3 className="text-xl font-bold mb-4">La Paz</h3>
          <div className="flex items-center justify-between"><Icon name="cloud" className="text-6xl" /><span className="text-5xl font-bold">12°C</span></div>
          <p className="mt-4 opacity-80">Parcialmente nublado</p>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-3xl text-white shadow-lg hover:-translate-y-1 transition-transform cursor-default">
          <h3 className="text-xl font-bold mb-4">Santa Cruz</h3>
          <div className="flex items-center justify-between"><Icon name="sunny" className="text-6xl" /><span className="text-5xl font-bold">32°C</span></div>
          <p className="mt-4 opacity-80">Soleado y húmedo</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg hover:-translate-y-1 transition-transform cursor-default">
          <h3 className="text-xl font-bold mb-4">Uyuni</h3>
          <div className="flex items-center justify-between"><Icon name="ac_unit" className="text-6xl" /><span className="text-5xl font-bold">5°C</span></div>
          <p className="mt-4 opacity-80">Frío extremo por la noche</p>
        </div>
      </div>
    </div>
  );
}

function TuristaAlertas() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Alertas de Seguridad</h2>
      <div className="space-y-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl flex gap-4 items-start">
          <Icon name="warning" className="text-red-500 text-3xl shrink-0" />
          <div><h3 className="font-bold text-red-800 text-lg">Bloqueo en carretera Oruro - Potosí</h3>
            <p className="text-red-600 mt-1">Se reportan bloqueos indefinidos. Se recomienda tomar rutas alternas o postergar viajes terrestres en esta vía.</p></div>
        </div>
        <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-r-xl flex gap-4 items-start">
          <Icon name="storm" className="text-orange-500 text-3xl shrink-0" />
          <div><h3 className="font-bold text-orange-800 text-lg">Lluvias intensas en el trópico</h3>
            <p className="text-orange-600 mt-1">Precaución por posibles desbordes de ríos en la región de Villa Tunari.</p></div>
        </div>
      </div>
    </div>
  );
}

// --- Operador Views ---
function OperadorInicio() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="bg-[#0077B6] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Hola, Operador</h1>
          <p className="text-blue-100 text-lg mb-6">Tus destinos han recibido un 24% más de visitas esta semana. ¡Sigue así!</p>
        </div>
        <Icon name="monitoring" className="absolute -right-10 -bottom-10 text-[250px] text-white/10 z-0" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-3 mb-3"><Icon name="book_online" className="text-[#0077B6] text-2xl" /><p className="text-gray-500 font-medium">Total Reservas</p></div>
          <p className="text-4xl font-bold text-gray-900">142</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-3 mb-3"><Icon name="payments" className="text-[#2D6A4F] text-2xl" /><p className="text-gray-500 font-medium">Ingresos Estimados</p></div>
          <p className="text-4xl font-bold text-[#2D6A4F]">$4,250</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-3 mb-3"><Icon name="star" className="text-yellow-500 text-2xl" /><p className="text-gray-500 font-medium">Calificación Promedio</p></div>
          <p className="text-4xl font-bold text-yellow-500 flex items-center gap-2">4.8 <Icon name="star" /></p>
        </div>
      </div>
    </div>
  );
}

// --- Operador Inventario ---
function OperadorInventario({ lugares, onEdit, onDelete, onUpdateStock }: {
  lugares: Lugar[];
  onEdit: (l: Lugar) => void;
  onDelete: (id: number) => void;
  onUpdateStock: (id: number, stock: number) => void;
}) {
  const [filterCat, setFilterCat] = useState<Category | 'Todas'>('Todas');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [editStockId, setEditStockId] = useState<number | null>(null);
  const [tempStock, setTempStock] = useState(0);

  const filtered = filterCat === 'Todas' ? lugares : lugares.filter(l => l.category === filterCat);
  const lowStockCount = lugares.filter(l => l.stock < 5).length;

  const startEditStock = (l: Lugar) => { setEditStockId(l.id); setTempStock(l.stock); };
  const saveStock = (id: number) => { onUpdateStock(id, tempStock); setEditStockId(null); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Icon name="inventory_2" className="text-[#0077B6]" /> Inventario de Lugares
          </h2>
          {lowStockCount > 0 && (
            <p className="text-sm text-red-600 font-semibold flex items-center gap-1 mt-1 animate-pulse">
              <Icon name="warning" className="text-[16px]" /> {lowStockCount} lugar{lowStockCount > 1 ? 'es' : ''} con stock bajo (&lt;5)
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Todas', ...ALL_CATEGORIES] as const).map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterCat === cat ? 'bg-[#0077B6] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600">Lugar</th>
                <th className="p-4 font-semibold text-gray-600">Categoría</th>
                <th className="p-4 font-semibold text-gray-600">Duración</th>
                <th className="p-4 font-semibold text-gray-600">Precio</th>
                <th className="p-4 font-semibold text-gray-600">Stock</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${l.stock < 5 ? 'bg-red-50/40' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={l.image} className="w-14 h-14 rounded-xl object-cover shrink-0" alt={l.title} referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-gray-900">{l.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{l.desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><CategoryBadge category={l.category} /></td>
                  <td className="p-4 text-gray-600">
                    <span className="flex items-center gap-1 text-sm"><Icon name="schedule" className="text-[16px] text-gray-400" />{l.duration}</span>
                  </td>
                  <td className="p-4 font-bold text-[#2D6A4F]">{l.price}</td>
                  <td className="p-4">
                    {editStockId === l.id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={tempStock} onChange={e => setTempStock(Number(e.target.value))} min={0}
                          className="w-20 p-1.5 border-2 border-[#0077B6] rounded-lg text-center font-bold outline-none text-sm" autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveStock(l.id); if (e.key === 'Escape') setEditStockId(null); }} />
                        <button onClick={() => saveStock(l.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors" title="Guardar">
                          <Icon name="check" className="text-[18px]" />
                        </button>
                        <button onClick={() => setEditStockId(null)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors" title="Cancelar">
                          <Icon name="close" className="text-[18px]" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEditStock(l)} className="flex items-center gap-1.5 group" title="Clic para editar stock">
                        <StockBadge stock={l.stock} />
                        <Icon name="edit" className="text-[14px] text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => onEdit(l)} className="text-[#0077B6] hover:bg-blue-50 p-2 rounded-lg transition-colors mr-1" title="Editar lugar">
                      <Icon name="edit" />
                    </button>
                    <button onClick={() => setConfirmId(l.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Eliminar lugar">
                      <Icon name="delete" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">
                  <Icon name="search_off" className="text-4xl mb-2" />
                  <p>No hay lugares en esta categoría.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmId !== null && (
        <ConfirmDialog
          title="¿Eliminar este lugar?"
          message="Esta acción eliminará el lugar del inventario permanentemente y no se puede deshacer."
          onConfirm={() => { onDelete(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

// --- Operador Publicar ---
function OperadorPublicar({ onSuccess, onAdd }: {
  onSuccess: () => void;
  onAdd: (l: Omit<Lugar, 'id'>) => void;
}) {
  const [form, setForm] = useState({
    title: '', desc: '', priceNum: '', stock: '', category: 'Naturaleza' as Category,
    duration: '', image: '', rating: '0.0',
  });
  const [imageError, setImageError] = useState('');
  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > MAX_UPLOAD_IMAGE_SIZE) {
      setImageError('La imagen debe pesar máximo 2MB.');
      return;
    }
    try {
      const imageData = await fileToDataUrl(file);
      set('image', imageData);
      setImageError('');
    } catch {
      setImageError('No se pudo procesar la imagen.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image.startsWith('data:image/')) {
      setImageError('Debes subir una imagen antes de publicar.');
      return;
    }
    onAdd({
      title: form.title, desc: form.desc, price: `$${form.priceNum}`,
      priceNum: Number(form.priceNum), stock: Number(form.stock),
      category: form.category, duration: form.duration, image: form.image, rating: form.rating,
    });
    onSuccess();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Icon name="add_circle" className="text-[#2D6A4F]" /> Agregar Nuevo Lugar
      </h2>
      <p className="text-gray-500 mb-8">Completa todos los campos para publicar la experiencia en el inventario.</p>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block font-semibold mb-2">Nombre del lugar <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={e => set('title', e.target.value)} required
            className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#2D6A4F] outline-none" placeholder="Ej. Tour en Bicicleta por la Muerte" />
        </div>
        <div>
          <label className="block font-semibold mb-2">Descripción <span className="text-red-500">*</span></label>
          <textarea value={form.desc} onChange={e => set('desc', e.target.value)} required rows={4}
            className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#2D6A4F] outline-none resize-none" placeholder="Describe la experiencia con detalle..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">Categoría <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#2D6A4F] outline-none">
              {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">Duración <span className="text-red-500">*</span></label>
            <input value={form.duration} onChange={e => set('duration', e.target.value)} required
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#2D6A4F] outline-none" placeholder="Ej. 2 días, 3 horas" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Precio (USD) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input type="number" value={form.priceNum} onChange={e => set('priceNum', e.target.value)} required min={1}
                className="w-full pl-8 p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#2D6A4F] outline-none" placeholder="50" />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-2">Cupos disponibles <span className="text-red-500">*</span></label>
            <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} required min={0}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#2D6A4F] outline-none" placeholder="Ej. 15" />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-2">Imagen del lugar <span className="text-red-500">*</span></label>
          <input type="file" accept="image/*" required onChange={(e) => { void handleImageChange(e); }}
            className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#2D6A4F] outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#2D6A4F] file:px-4 file:py-2 file:text-white hover:file:bg-[#1f4a37]" />
          <p className="text-xs text-gray-500 mt-2">Se guarda en la base de datos. Tamaño máximo: 2MB.</p>
          {imageError && <p className="text-sm text-red-600 mt-2">{imageError}</p>}
          {form.image && (
            <img src={form.image} alt="Vista previa" className="mt-4 w-full max-h-64 rounded-xl object-cover border border-gray-200" />
          )}
        </div>
        <button type="submit" className="w-full py-4 bg-[#2D6A4F] text-white font-bold rounded-xl hover:bg-[#1f4a37] flex justify-center items-center gap-2 transition-colors shadow-md">
          <Icon name="publish" /> Publicar en Inventario
        </button>
      </form>
    </div>
  );
}

// --- Administrador Views ---
function AdminInicio() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Usuarios',     val: '12,450', icon: 'group',       bg: 'bg-blue-50',   col: 'text-blue-600' },
          { label: 'Destinos',     val: '842',    icon: 'location_on', bg: 'bg-green-50',  col: 'text-green-600' },
          { label: 'Consultas IA', val: '45.2k',  icon: 'memory',      bg: 'bg-purple-50', col: 'text-purple-600' },
          { label: 'Alertas',      val: '3',      icon: 'warning',     bg: 'bg-red-50',    col: 'text-red-600' },
        ].map(item => (
          <div key={item.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.bg} ${item.col}`}>
              <Icon name={item.icon} className="text-3xl" />
            </div>
            <div><p className="text-sm text-gray-500 font-medium">{item.label}</p><p className="text-2xl font-bold">{item.val}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminUsuarios() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Juan Perez',      email: 'juan@test.com',        role: 'Turista' },
    { id: 2, name: 'Agencia Andes',   email: 'contacto@andes.com',   role: 'Operador' },
    { id: 3, name: 'Admin Principal', email: 'admin@chuquiago360.com', role: 'Administrador' },
  ]);
  const toggleRole = (id: number) => {
    setUsers(users.map(u => {
      if (u.id !== id) return u;
      return { ...u, role: u.role === 'Turista' ? 'Operador' : u.role === 'Operador' ? 'Administrador' : 'Turista' };
    }));
  };
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Gestión de Usuarios</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Nombre</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Rol Actual</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-900">{u.name}</td>
                <td className="p-4 text-gray-600">{u.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' : u.role === 'Operador' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => toggleRole(u.id)} className="text-sm font-medium text-[#0077B6] hover:underline">Cambiar Rol</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminReportes() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Reportes y Métricas</h2>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Icon name="bar_chart" className="text-[#0077B6]" /> Visitas por Región</h3>
        <div className="space-y-6">
          {[
            { label: 'Altiplano (Uyuni, La Paz)',   pct: 65, color: 'bg-[#0077B6]' },
            { label: 'Valles (Cochabamba, Tarija)', pct: 20, color: 'bg-[#2D6A4F]' },
            { label: 'Llanos (Santa Cruz, Beni)',   pct: 15, color: 'bg-orange-500' },
          ].map(r => (
            <div key={r.label}>
              <div className="flex justify-between mb-2"><span className="font-semibold">{r.label}</span><span className="text-gray-500">{r.pct}%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div className={`${r.color} h-4 rounded-full transition-all duration-1000`} style={{ width: `${r.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
