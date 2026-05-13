import React, { useState } from 'react';

// --- Types ---
type ViewState = 'landing' | 'login' | 'register' | 'app';
type Role = 'turista' | 'operador' | 'administrador' | null;

// --- Helper Component for Google Icons ---
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// --- Menus Definition (Discreet, Functional Tabs) ---
const ROLE_MENUS = {
  turista: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'planificar', label: 'Planificar', icon: 'explore' },
    { id: 'destinos', label: 'Destinos', icon: 'location_on' },
    { id: 'clima', label: 'Clima', icon: 'partly_cloudy_day' },
    { id: 'alertas', label: 'Alertas', icon: 'warning' },
  ],
  operador: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'destinos', label: 'Mis Destinos', icon: 'tour' },
    { id: 'publicar', label: 'Publicar', icon: 'add_circle' },
  ],
  administrador: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'usuarios', label: 'Usuarios', icon: 'group' },
    { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
  ]
};

// --- Mock Data ---
const MOCK_DESTINOS = [
  { id: 1, title: 'Salar de Uyuni', image: 'https://picsum.photos/seed/uyuni/800/600', desc: 'El mayor desierto de sal continuo y alto del mundo.', price: '$150', rating: '4.9' },
  { id: 2, title: 'Lago Titicaca', image: 'https://picsum.photos/seed/titicaca/800/600', desc: 'El lago navegable más alto del mundo, rodeado de misticismo.', price: '$80', rating: '4.7' },
  { id: 3, title: 'Parque Madidi', image: 'https://picsum.photos/seed/madidi/800/600', desc: 'Reserva con inmensa biodiversidad en la Amazonía.', price: '$200', rating: '4.8' },
  { id: 4, title: 'Misiones Jesuíticas', image: 'https://picsum.photos/seed/misiones/800/600', desc: 'Patrimonio cultural e histórico en la Chiquitanía.', price: '$120', rating: '4.6' },
];

// --- Main App Component ---
export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [role, setRole] = useState<Role>(null);

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogin = (selectedRole: Role) => {
    setRole(selectedRole);
    navigateTo('app');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-[#0077B6] selection:text-white">
      {currentView === 'landing' && <LandingView onNavigate={navigateTo} />}
      {currentView === 'login' && <LoginView onNavigate={navigateTo} onLogin={handleLogin} />}
      {currentView === 'register' && <RegisterView onNavigate={navigateTo} onLogin={handleLogin} />}
      {currentView === 'app' && <MainAppView role={role} onLogout={() => { setRole(null); navigateTo('landing'); }} />}
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
          <span>Bolivia360</span>
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
            Descubre el corazón de <br/><span className="text-[#0077B6] bg-clip-text text-transparent bg-gradient-to-r from-[#0077B6] to-[#2D6A4F]">Sudamérica</span>
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
function RegisterView({ onNavigate, onLogin }: { onNavigate: (v: ViewState) => void, onLogin: (r: Role) => void }) {
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin('turista');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gray-100">
      <div className="absolute top-0 left-0 w-full h-96 bg-[#2D6A4F] -skew-y-6 origin-top-left -z-10"></div>
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-10">
          <div className="flex justify-center mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="flex items-center gap-2 text-[#2D6A4F] font-bold text-4xl tracking-tight">
              <Icon name="travel_explore" className="text-5xl" />
              <span>Bolivia360</span>
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
            <button type="submit" className="w-full py-3.5 bg-[#2D6A4F] text-white font-bold rounded-xl hover:bg-[#1f4a37] transition-colors shadow-md">
              Registrarse
            </button>
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
function LoginView({ onNavigate, onLogin }: { onNavigate: (v: ViewState) => void, onLogin: (r: Role) => void }) {
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
              <Icon name="travel_explore" className="text-5xl" />
              <span>Bolivia360</span>
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
            <button type="submit" className="w-full py-3.5 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors shadow-md">
              Ingresar
            </button>
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
function MainAppView({ role, onLogout }: { role: Role, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const menu = role ? ROLE_MENUS[role] : [];

  const handleSelectDestino = (destino: any) => {
    setSelectedItem(destino);
    setActiveTab('detalle_destino');
  };

  const renderContent = () => {
    if (activeTab === 'perfil') return <PerfilView />;
    if (activeTab === 'detalle_destino') return <DestinoDetalleView destino={selectedItem} onBack={() => setActiveTab('inicio')} />;

    if (role === 'turista') {
      switch (activeTab) {
        case 'inicio': return <TuristaInicio onSelect={handleSelectDestino} />;
        case 'planificar': return <TuristaPlanificar />;
        case 'destinos': return <TuristaDestinos onSelect={handleSelectDestino} />;
        case 'clima': return <TuristaClima />;
        case 'alertas': return <TuristaAlertas />;
      }
    } else if (role === 'operador') {
      switch (activeTab) {
        case 'inicio': return <OperadorInicio />;
        case 'destinos': return <OperadorDestinos />;
        case 'publicar': return <OperadorPublicar onSuccess={() => setActiveTab('destinos')} />;
      }
    } else if (role === 'administrador') {
      switch (activeTab) {
        case 'inicio': return <AdminInicio />;
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
              <span className="hidden sm:block">Bolivia360</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm font-bold text-[#2D6A4F] uppercase bg-green-50 px-3 py-1 rounded-full">
                {role}
              </span>
              <button onClick={() => setActiveTab('perfil')} className="flex items-center gap-2 text-gray-600 hover:text-[#0077B6] font-medium transition-colors">
                <Icon name="account_circle" />
                <span className="hidden sm:block">Mi perfil</span>
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button onClick={onLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium transition-colors">
                <Icon name="logout" />
                <span className="hidden sm:block">Salir</span>
              </button>
            </div>
          </div>
          <div className="flex overflow-x-auto py-3 gap-2 hide-scrollbar">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#0077B6] text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon name={item.icon} className="text-[20px]" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full pb-12">
        {renderContent()}
      </main>
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
            <p className="text-gray-500">usuario@bolivia360.com</p>
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
          <button className="mt-4 px-6 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92]">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

function DestinoDetalleView({ destino, onBack }: { destino: any, onBack: () => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in slide-in-from-bottom-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
        <Icon name="arrow_back" /> Volver
      </button>
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <img src={destino.image} alt={destino.title} className="w-full h-96 object-cover" referrerPolicy="no-referrer" />
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{destino.title}</h1>
            <div className="flex items-center gap-1 bg-blue-50 text-[#0077B6] px-3 py-1 rounded-lg font-bold">
              <Icon name="star" className="text-[20px]" /> {destino.rating}
            </div>
          </div>
          <p className="text-xl text-gray-600 mb-8">{destino.desc}</p>
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Precio estimado</p>
              <p className="text-3xl font-bold text-[#2D6A4F]">{destino.price}</p>
            </div>
            <button className="px-8 py-4 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] shadow-md flex items-center gap-2">
              <Icon name="book_online" /> Reservar Ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Turista Views ---
function TuristaInicio({ onSelect }: { onSelect: (d: any) => void }) {
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
          {MOCK_DESTINOS.map(d => (
            <div key={d.id} onClick={() => onSelect(d)} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group">
              <div className="h-48 overflow-hidden"><img src={d.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={d.title} referrerPolicy="no-referrer" /></div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{d.title}</h3>
                <p className="text-sm text-gray-500">{d.price} • {d.rating} <Icon name="star" className="text-[14px] text-yellow-500 inline" /></p>
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

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setResult(true); }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-2">Planificador con IA</h2>
      <p className="text-gray-600 mb-8">Cuéntanos qué buscas y generaremos el itinerario perfecto.</p>
      
      {!result ? (
        <form onSubmit={handleGenerate} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-2">Destino Principal</label>
              <input type="text" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. La Paz" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Días disponibles</label>
              <input type="number" required min="1" className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. 5" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Presupuesto (USD)</label>
              <input type="number" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. 500" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Tipo de viaje</label>
              <select className="w-full p-3 border rounded-xl bg-gray-50">
                <option>Aventura</option><option>Relajación</option><option>Cultural</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] flex justify-center items-center gap-2">
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
              <div key={day} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0077B6] text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">
                  {day}
                </div>
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

function TuristaDestinos({ onSelect }: { onSelect: (d: any) => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Todos los Destinos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {MOCK_DESTINOS.map(d => (
          <div key={d.id} onClick={() => onSelect(d)} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl cursor-pointer">
            <img src={d.image} className="w-full h-48 object-cover" alt={d.title} referrerPolicy="no-referrer" />
            <div className="p-4">
              <h3 className="font-bold text-lg">{d.title}</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{d.desc}</p>
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
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-3xl text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">La Paz</h3>
          <div className="flex items-center justify-between">
            <Icon name="cloud" className="text-6xl" />
            <span className="text-5xl font-bold">12°C</span>
          </div>
          <p className="mt-4 opacity-80">Parcialmente nublado</p>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-3xl text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">Santa Cruz</h3>
          <div className="flex items-center justify-between">
            <Icon name="sunny" className="text-6xl" />
            <span className="text-5xl font-bold">32°C</span>
          </div>
          <p className="mt-4 opacity-80">Soleado y húmedo</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">Uyuni</h3>
          <div className="flex items-center justify-between">
            <Icon name="ac_unit" className="text-6xl" />
            <span className="text-5xl font-bold">5°C</span>
          </div>
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
          <div>
            <h3 className="font-bold text-red-800 text-lg">Bloqueo en carretera Oruro - Potosí</h3>
            <p className="text-red-600 mt-1">Se reportan bloqueos indefinidos. Se recomienda tomar rutas alternas o postergar viajes terrestres en esta vía.</p>
          </div>
        </div>
        <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-r-xl flex gap-4 items-start">
          <Icon name="storm" className="text-orange-500 text-3xl shrink-0" />
          <div>
            <h3 className="font-bold text-orange-800 text-lg">Lluvias intensas en el trópico</h3>
            <p className="text-orange-600 mt-1">Precaución por posibles desbordes de ríos en la región de Villa Tunari.</p>
          </div>
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 font-medium">Total Reservas</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">142</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 font-medium">Ingresos Estimados</p>
          <p className="text-4xl font-bold text-[#2D6A4F] mt-2">$4,250</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 font-medium">Calificación Promedio</p>
          <p className="text-4xl font-bold text-yellow-500 mt-2 flex items-center gap-2">4.8 <Icon name="star" /></p>
        </div>
      </div>
    </div>
  );
}

function OperadorDestinos() {
  const [destinos, setDestinos] = useState(MOCK_DESTINOS.slice(0, 2));

  const handleDelete = (id: number) => {
    if(confirm('¿Seguro que deseas eliminar este destino?')) {
      setDestinos(destinos.filter(d => d.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Mis Destinos Publicados</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Destino</th>
              <th className="p-4 font-semibold text-gray-600">Precio</th>
              <th className="p-4 font-semibold text-gray-600">Rating</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {destinos.map(d => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 flex items-center gap-4">
                  <img src={d.image} className="w-16 h-16 rounded-lg object-cover" alt={d.title} referrerPolicy="no-referrer" />
                  <span className="font-bold text-gray-900">{d.title}</span>
                </td>
                <td className="p-4 text-gray-600">{d.price}</td>
                <td className="p-4 text-gray-600"><Icon name="star" className="text-yellow-500 text-[18px] align-middle" /> {d.rating}</td>
                <td className="p-4 text-right">
                  <button className="text-[#0077B6] hover:bg-blue-50 p-2 rounded-lg transition-colors mr-2"><Icon name="edit" /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Icon name="delete" /></button>
                </td>
              </tr>
            ))}
            {destinos.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No tienes destinos publicados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OperadorPublicar({ onSuccess }: { onSuccess: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Destino publicado exitosamente (Simulación)');
    onSuccess();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Publicar Nuevo Destino</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block font-semibold mb-2">Nombre del Destino</label>
          <input type="text" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. Tour en Bicicleta por la Muerte" />
        </div>
        <div>
          <label className="block font-semibold mb-2">Descripción</label>
          <textarea required rows={4} className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Describe la experiencia..."></textarea>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2">Precio (USD)</label>
            <input type="number" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. 50" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Cupos disponibles</label>
            <input type="number" required className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. 15" />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-2">Subir Imagen (URL para prototipo)</label>
          <input type="url" defaultValue="https://picsum.photos/seed/new/800/600" className="w-full p-3 border rounded-xl bg-gray-50" />
        </div>
        <button type="submit" className="w-full py-4 bg-[#2D6A4F] text-white font-bold rounded-xl hover:bg-[#1f4a37] flex justify-center items-center gap-2">
          <Icon name="publish" /> Publicar Destino
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600"><Icon name="group" className="text-3xl" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Usuarios</p><p className="text-2xl font-bold">12,450</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-green-50 text-green-600"><Icon name="location_on" className="text-3xl" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Destinos</p><p className="text-2xl font-bold">842</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600"><Icon name="memory" className="text-3xl" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Consultas IA</p><p className="text-2xl font-bold">45.2k</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-50 text-red-600"><Icon name="warning" className="text-3xl" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Alertas</p><p className="text-2xl font-bold">3</p></div>
        </div>
      </div>
    </div>
  );
}

function AdminUsuarios() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Juan Perez', email: 'juan@test.com', role: 'Turista' },
    { id: 2, name: 'Agencia Andes', email: 'contacto@andes.com', role: 'Operador' },
    { id: 3, name: 'Admin Principal', email: 'admin@bolivia360.com', role: 'Administrador' },
  ]);

  const toggleRole = (id: number) => {
    setUsers(users.map(u => {
      if(u.id === id) {
        const newRole = u.role === 'Turista' ? 'Operador' : (u.role === 'Operador' ? 'Administrador' : 'Turista');
        return { ...u, role: newRole };
      }
      return u;
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
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-900">{u.name}</td>
                <td className="p-4 text-gray-600">{u.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' : 
                    u.role === 'Operador' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{u.role}</span>
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
        <h3 className="text-xl font-bold mb-6">Visitas por Región (Simulado)</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">Altiplano (Uyuni, La Paz)</span><span className="text-gray-500">65%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-[#0077B6] h-4 rounded-full" style={{width: '65%'}}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">Valles (Cochabamba, Tarija)</span><span className="text-gray-500">20%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-[#2D6A4F] h-4 rounded-full" style={{width: '20%'}}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">Llanos (Santa Cruz, Beni)</span><span className="text-gray-500">15%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-orange-500 h-4 rounded-full" style={{width: '15%'}}></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
