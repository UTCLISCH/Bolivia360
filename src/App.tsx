/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// --- Types ---
type ViewState = 'landing' | 'login' | 'register' | 'app';
type Role = 'turista' | 'administrador' | null;
type UserStatus = 'activo' | 'inactivo';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'Turista' | 'Administrador';
  status: UserStatus;
  registeredAt: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'seguridad' | 'promocion' | 'recordatorio' | 'bienvenida' | 'sistema';
  severity: 'baja' | 'media' | 'alta';
  createdAt: string;
  isGlobal: boolean;
  targetUsers?: number[];
  scheduledFor?: string;
  isRead?: boolean;
  sentCount?: number;
}

interface Destino {
  id: number;
  title: string;
  image: string;
  desc: string;
  rating: string;
  lat: number;
  lng: number;
  category: string;
}

// --- Helper Component for Google Icons ---
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// --- Leaflet Map Components ---
// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for current location
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle routing
function RoutingMachine({ waypoints }: { waypoints: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    const routingControl = (L as any).Routing.control({
      waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
      routeWhileDragging: false,
      addWaypoints: false,
      createMarker: () => null, // Don't create default markers
      show: false, // Hide the instructions panel
      lineOptions: {
        styles: [{ color: '#0077B6', weight: 6, opacity: 0.8 }]
      }
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, waypoints]);

  return null;
}

// Map Component
function MapView({ selectedDestino, currentLocation }: { 
  selectedDestino?: Destino; 
  currentLocation: [number, number] 
}) {
  const [routeWaypoints, setRouteWaypoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (selectedDestino) {
      setRouteWaypoints([currentLocation, [selectedDestino.lat, selectedDestino.lng]]);
    } else {
      setRouteWaypoints([]);
    }
  }, [selectedDestino, currentLocation]);

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer 
        center={selectedDestino ? [selectedDestino.lat, selectedDestino.lng] : currentLocation} 
        zoom={selectedDestino ? 12 : 13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current location marker */}
        <Marker position={currentLocation} icon={currentLocationIcon}>
          <Popup>Tu ubicación actual</Popup>
        </Marker>

        {/* Destination markers */}
        {MOCK_DESTINOS.map(destino => (
          <Marker key={destino.id} position={[destino.lat, destino.lng]}>
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-lg">{destino.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{destino.desc}</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Icon name="star" className="text-yellow-400 text-sm" />
                  <span className="text-sm">{destino.rating}</span>
                </div>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {destino.category}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Routing */}
        {routeWaypoints.length >= 2 && <RoutingMachine waypoints={routeWaypoints} />}
      </MapContainer>
    </div>
  );
}

// --- Menus Definition ---
const ROLE_MENUS = {
  turista: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'planificar', label: 'Planificar', icon: 'explore' },
    { id: 'destinos', label: 'Destinos', icon: 'location_on' },
    { id: 'clima', label: 'Clima', icon: 'partly_cloudy_day' },
    { id: 'alertas', label: 'Alertas', icon: 'warning' },
  ],
  administrador: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'usuarios', label: 'Usuarios', icon: 'group' },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'notifications' },
    { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
  ]
};

// --- Mock Data ---
const MOCK_DESTINOS: Destino[] = [
  { id: 1, title: 'Basílica de San Francisco', image: 'https://picsum.photos/seed/sanfrancisco/800/600', desc: 'Iglesia colonial más antigua de La Paz, joya del barroco mestizo.', rating: '4.8', lat: -16.4958, lng: -68.1336, category: 'Cultural' },
  { id: 2, title: 'Valle de la Luna', image: 'https://picsum.photos/seed/valleluna/800/600', desc: 'Formaciones rocosas erosionadas que parecen un paisaje lunar.', rating: '4.7', lat: -16.5486, lng: -68.0833, category: 'Natural' },
  { id: 3, title: 'Mercado de las Brujas', image: 'https://picsum.photos/seed/brujas/800/600', desc: 'Mercado tradicional con remedios naturales y artesanías.', rating: '4.5', lat: -16.4969, lng: -68.1350, category: 'Cultural' },
  { id: 4, title: 'Teleférico Mi Teleférico', image: 'https://picsum.photos/seed/teleferico/800/600', desc: 'Sistema de teleférico urbano más alto del mundo.', rating: '4.9', lat: -16.5291, lng: -68.0917, category: 'Moderno' },
  { id: 5, title: 'Chacaltaya', image: 'https://picsum.photos/seed/chacaltaya/800/600', desc: 'Antiguo centro de esquí, ahora lugar de reflexión sobre cambio climático.', rating: '4.6', lat: -16.3525, lng: -68.1314, category: 'Natural' },
  { id: 6, title: 'Museo de Arte Contemporáneo', image: 'https://picsum.photos/seed/museoarte/800/600', desc: 'Colección de arte boliviano moderno en un edificio histórico.', rating: '4.4', lat: -16.4978, lng: -68.1356, category: 'Cultural' },
  { id: 7, title: 'Calle Jaén', image: 'https://picsum.photos/seed/callejaen/800/600', desc: 'Calle colonial con casas históricas y museos.', rating: '4.7', lat: -16.4964, lng: -68.1367, category: 'Histórico' },
  { id: 8, title: 'Lago Titicaca (desde La Paz)', image: 'https://picsum.photos/seed/titicaca/800/600', desc: 'Lago navegable más alto del mundo, accesible desde La Paz.', rating: '4.8', lat: -15.8231, lng: -69.3344, category: 'Natural' },
  { id: 9, title: 'Parque Nacional Cotapata', image: 'https://picsum.photos/seed/cotapata/800/600', desc: 'Bosque nublado con cascadas y senderos ecológicos.', rating: '4.5', lat: -16.2833, lng: -67.8833, category: 'Natural' },
  { id: 10, title: 'El Alto - Ciudad de los Vientos', image: 'https://picsum.photos/seed/elalto/800/600', desc: 'Ciudad hermana de La Paz con mercados tradicionales.', rating: '4.3', lat: -16.5000, lng: -68.1667, category: 'Cultural' },
  { id: 11, title: 'Catedral Metropolitana', image: 'https://picsum.photos/seed/catedral/800/600', desc: 'Imponente catedral neogótica en el corazón de La Paz.', rating: '4.6', lat: -16.4950, lng: -68.1339, category: 'Religioso' },
  { id: 12, title: 'Mirador Killi Killi', image: 'https://picsum.photos/seed/killikilli/800/600', desc: 'Vista panorámica impresionante de La Paz desde las alturas.', rating: '4.9', lat: -16.5167, lng: -68.1167, category: 'Vista' },
];

const MOCK_USERS: User[] = [
  { id: 1, name: 'Juan Perez', email: 'juan@test.com', phone: '+591 70000001', role: 'Turista', status: 'activo', registeredAt: '2024-01-15' },
  { id: 2, name: 'Agencia Andes', email: 'contacto@andes.com', phone: '+591 70000002', role: 'Turista', status: 'activo', registeredAt: '2024-02-20' },
  { id: 3, name: 'Admin Principal', email: 'admin@bolivia360.com', phone: '+591 70000003', role: 'Administrador', status: 'activo', registeredAt: '2024-01-01' },
  { id: 4, name: 'Maria Lopez', email: 'maria@test.com', phone: '+591 70000004', role: 'Turista', status: 'inactivo', registeredAt: '2024-03-10' },
  { id: 5, name: 'Carlos Rodriguez', email: 'carlos@test.com', phone: '+591 70000005', role: 'Turista', status: 'activo', registeredAt: '2024-04-05' },
  { id: 6, name: 'Ana Garcia', email: 'ana@test.com', phone: '+591 70000006', role: 'Turista', status: 'activo', registeredAt: '2024-05-12' },
  { id: 7, name: 'Luis Martinez', email: 'luis@test.com', phone: '+591 70000007', role: 'Turista', status: 'activo', registeredAt: '2024-06-18' },
  { id: 8, name: 'Sofia Fernandez', email: 'sofia@test.com', phone: '+591 70000008', role: 'Administrador', status: 'activo', registeredAt: '2024-07-22' },
  { id: 9, name: 'Diego Morales', email: 'diego@test.com', phone: '+591 70000009', role: 'Turista', status: 'inactivo', registeredAt: '2024-08-30' },
  { id: 10, name: 'Valentina Castro', email: 'valentina@test.com', phone: '+591 70000010', role: 'Turista', status: 'activo', registeredAt: '2024-09-14' },
  { id: 11, name: 'Miguel Sanchez', email: 'miguel@test.com', phone: '+591 70000011', role: 'Turista', status: 'activo', registeredAt: '2024-10-01' },
  { id: 12, name: 'Camila Rojas', email: 'camila@test.com', phone: '+591 70000012', role: 'Turista', status: 'activo', registeredAt: '2024-10-15' },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Bloqueo en carretera Oruro - Potosí', message: 'Se reportan bloqueos indefinidos. Se recomienda tomar rutas alternas o postergar viajes terrestres en esta vía.', type: 'seguridad', severity: 'alta', createdAt: '2024-10-01', isGlobal: true, sentCount: 2 },
  { id: 2, title: 'Lluvias intensas en el trópico', message: 'Precaución por posibles desbordes de ríos en la región de Villa Tunari.', type: 'seguridad', severity: 'media', createdAt: '2024-10-02', isGlobal: true, sentCount: 1 },
  { id: 3, title: 'Promoción especial en Uyuni', message: 'Descuento del 20% en tours al Salar de Uyuni este fin de semana.', type: 'promocion', severity: 'baja', createdAt: '2024-10-03', isGlobal: true, sentCount: 3 },
  { id: 4, title: 'Recordatorio: Mantenimiento del sistema', message: 'El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 4:00 AM.', type: 'sistema', severity: 'media', createdAt: '2024-10-04', isGlobal: true, sentCount: 1 },
];

// --- Main App Component ---
export default function App() {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('bolivia360_users');
    if (saved) {
      const parsedUsers = JSON.parse(saved) as User[];
      return parsedUsers.length > 0 ? parsedUsers : MOCK_USERS;
    }
    return MOCK_USERS;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bolivia360_current_user');
    return saved ? JSON.parse(saved) as User : null;
  });
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('bolivia360_current_user');
    return saved ? 'app' : 'landing';
  });

  useEffect(() => {
    localStorage.setItem('bolivia360_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bolivia360_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bolivia360_current_user');
    }
  }, [currentUser]);

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('app');
  };

  const handleRegister = (newUserData: { name: string; email: string; phone?: string }) => {
    const emailExists = users.some((user) => user.email.toLowerCase() === newUserData.email.toLowerCase());
    if (emailExists) {
      window.alert('Este correo ya está registrado. Por favor usa otro correo o ingresa con una cuenta existente.');
      setCurrentView('login');
      return;
    }

    const newUser: User = {
      id: Math.max(...users.map((user) => user.id), 0) + 1,
      name: newUserData.name,
      email: newUserData.email,
      phone: newUserData.phone,
      role: 'Turista',
      status: 'activo',
      registeredAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setCurrentView('app');
    window.alert('Registro exitoso. Bienvenido a Bolivia360.');
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    setCurrentUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-[#0077B6] selection:text-white">
      {currentView === 'landing' && <LandingView onNavigate={navigateTo} />}
      {currentView === 'login' && <LoginView onNavigate={navigateTo} users={users} onLogin={handleLogin} />}
      {currentView === 'register' && <RegisterView onNavigate={navigateTo} onRegister={handleRegister} />}
      {currentView === 'app' && <MainAppView currentUser={currentUser} users={users} setUsers={setUsers} onUpdateProfile={handleUpdateProfile} onLogout={() => { setCurrentUser(null); setCurrentView('landing'); }} />}
    </div>
  );
}

// --- Landing View ---
function LandingView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
        <div className="absolute inset-0 z-0">
          <img src="https://picsum.photos/seed/bolivia_hero/1920/1080" alt="Bolivia landscape" className="w-full h-full object-cover opacity-10" referrerPolicy="no-referrer" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Descubre Bolivia con <br /><span className="text-[#0077B6] bg-clip-text text-transparent bg-gradient-to-r from-[#0077B6] to-[#2D6A4F]">Bolivia360</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Tu guía completa para explorar los tesoros naturales, culturales e históricos de La Paz y sus alrededores.
            Planifica viajes, recibe alertas de seguridad y conecta con la comunidad turística paceña.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => onNavigate('register')} className="px-8 py-4 bg-[#0077B6] text-white font-semibold rounded-full hover:bg-[#005f92] transition-all shadow-lg hover:-translate-y-1 flex items-center gap-2 text-lg">
              <Icon name="person_add" /> Comenzar mi aventura
            </button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 border-2 border-[#0077B6] text-[#0077B6] font-semibold rounded-full hover:bg-[#0077B6] hover:text-white transition-all shadow-lg hover:-translate-y-1 text-lg">
              <Icon name="expand_more" /> Conocer más
            </button>
          </div>
        </div>
      </section>

      {/* What is Bolivia360 Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">¿Qué es Bolivia360?</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Bolivia360 es la plataforma turística más completa de La Paz, diseñada para ofrecerte una experiencia
            única en la planificación y disfrute de tus viajes. Desde la majestuosa Basílica de San Francisco hasta las formaciones
            rocosas del Valle de la Luna, te acompañamos en cada paso de tu aventura paceña.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-sm">
              <Icon name="explore" className="text-4xl text-[#0077B6] mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Explora Destinos</h3>
              <p className="text-gray-600">Descubre los lugares más emblemáticos de Bolivia con información detallada, fotos y recomendaciones personalizadas.</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-sm">
              <Icon name="security" className="text-4xl text-[#2D6A4F] mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Viaja Seguro</h3>
              <p className="text-gray-600">Recibe alertas en tiempo real sobre condiciones climáticas, bloqueos viales y recomendaciones de seguridad.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-sm">
              <Icon name="group" className="text-4xl text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Conecta con la Comunidad</h3>
              <p className="text-gray-600">Únete a una red de viajeros apasionados y comparte experiencias inolvidables en los foros de la plataforma.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">Características Principales</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <Icon name="map" className="text-3xl text-[#0077B6] mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mapas Interactivos</h3>
              <p className="text-gray-600">Navega por Bolivia con mapas detallados y rutas personalizadas para tu viaje.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <Icon name="weather" className="text-3xl text-[#2D6A4F] mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pronóstico del Clima</h3>
              <p className="text-gray-600">Información meteorológica actualizada para planificar tus actividades al aire libre.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <Icon name="notifications" className="text-3xl text-orange-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Alertas Personalizadas</h3>
              <p className="text-gray-600">Recibe notificaciones sobre promociones, eventos y situaciones de seguridad.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <Icon name="book_online" className="text-3xl text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Reservas Fáciles</h3>
              <p className="text-gray-600">Reserva tours, alojamientos y transporte directamente desde la plataforma.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <Icon name="forum" className="text-3xl text-pink-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comunidad Activa</h3>
              <p className="text-gray-600">Comparte experiencias, consejos y conecta con otros viajeros apasionados.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <Icon name="admin_panel_settings" className="text-3xl text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Panel Administrativo</h3>
              <p className="text-gray-600">Herramientas avanzadas para gestionar usuarios y contenido de la plataforma.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">Destinos Destacados de La Paz</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_DESTINOS.slice(0, 4).map(destino => (
              <div key={destino.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-2 overflow-hidden border border-gray-100">
                <img src={destino.image} alt={destino.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{destino.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{destino.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {destino.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Icon name="star" className="text-yellow-400 text-sm" />
                      <span className="text-sm text-gray-600">{destino.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#0077B6] to-[#2D6A4F] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">¿Listo para tu próxima aventura?</h2>
          <p className="text-xl mb-10 opacity-90">
            Únete a miles de viajeros que ya han descubierto Bolivia con Bolivia360.
            Crea tu cuenta gratuita y comienza a planificar tu viaje perfecto.
          </p>
          <button onClick={() => onNavigate('register')} className="px-10 py-5 bg-white text-[#0077B6] font-bold rounded-full hover:bg-gray-100 transition-all shadow-lg hover:-translate-y-1 text-xl">
            <Icon name="rocket_launch" className="mr-2" /> Empezar ahora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Icon name="travel_explore" className="text-3xl text-[#0077B6]" />
            <span className="text-2xl font-bold">Bolivia360</span>
          </div>
          <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
            La plataforma turística líder de La Paz, conectando viajeros con las maravillas naturales y culturales de nuestra ciudad.
          </p>
          <div className="text-center text-sm text-gray-500">
            © 2024 Bolivia360. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Register View ---
function RegisterView({ onNavigate, onRegister }: { onNavigate: (v: ViewState) => void; onRegister: (data: { name: string; email: string; phone?: string }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setMsg('Nombre y correo son obligatorios.');
      return;
    }
    onRegister({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
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
                <input value={name} onChange={(e) => setName(e.target.value)} type="text" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="Juan Pérez" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <div className="relative">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="tu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <div className="relative">
                <Icon name="phone" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="+591 70000000" />
              </div>
            </div>
            {msg && <p className="text-red-500 text-sm font-medium text-center">{msg}</p>}
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
function LoginView({ onNavigate, users, onLogin }: { onNavigate: (v: ViewState) => void; users: User[]; onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMsg('Ingresa un correo para continuar.');
      return;
    }
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setMsg('Usuario no encontrado. Verifica tu correo o regístrate.');
      return;
    }
    if (user.status !== 'activo') {
      setMsg('Esta cuenta está inactiva. Contacta al administrador.');
      return;
    }
    onLogin(user);
  };

  const quickLogin = (role: User['role']) => {
    const user = users.find((u) => u.role === role && u.status === 'activo');
    if (user) {
      onLogin(user);
      return;
    }
    setMsg(`No hay usuarios activos con rol ${role}.`);
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
          <form className="space-y-5" onSubmit={handleLogin}>
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
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => quickLogin('Turista')} className="py-2.5 px-2 text-xs font-bold bg-blue-50 text-[#0077B6] rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-1">
                <Icon name="hiking" className="text-[20px]" /> Turista
              </button>
              <button onClick={() => quickLogin('Administrador')} className="py-2.5 px-2 text-xs font-bold bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors flex flex-col items-center gap-1">
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
function MainAppView({ currentUser, users, setUsers, onUpdateProfile, onLogout }: { currentUser: User | null; users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>; onUpdateProfile: (user: User) => void; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedItem, setSelectedItem] = useState<Destino | null>(null);

  const currentRole = currentUser?.role === 'Administrador' ? 'administrador' : 'turista';
  const menu = currentUser ? ROLE_MENUS[currentRole] : [];

  const handleSelectDestino = (destino: Destino) => {
    setSelectedItem(destino);
    setActiveTab('detalle_destino');
  };

  const renderContent = () => {
    if (!currentUser) {
      return (
        <div className="p-10 text-center text-gray-500">
          <h2 className="text-2xl font-bold mb-4">Usuario no autenticado</h2>
          <p>Por favor vuelve a iniciar sesión para acceder a la aplicación.</p>
        </div>
      );
    }

    if (activeTab === 'perfil') return <PerfilView user={currentUser} onSave={onUpdateProfile} />;
    if (activeTab === 'detalle_destino' && selectedItem) return <DestinoDetalleView destino={selectedItem} onBack={() => setActiveTab('inicio')} onViewMap={() => { setSelectedItem(selectedItem); setActiveTab('destinos'); }} />;

    if (currentUser.role === 'Turista') {
      switch (activeTab) {
        case 'inicio': return <TuristaInicio onSelect={handleSelectDestino} />;
        case 'planificar': return <TuristaPlanificar />;
        case 'destinos': return <TuristaDestinos onSelect={handleSelectDestino} selectedDestino={selectedItem} />;
        case 'clima': return <TuristaClima />;
        case 'alertas': return <TuristaAlertas />;
      }
    } else if (currentUser.role === 'Administrador') {
      switch (activeTab) {
        case 'inicio': return <AdminInicio />;
        case 'usuarios': return <AdminUsuarios users={users} setUsers={setUsers} />;
        case 'notificaciones': return <AdminNotificaciones />;
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
                {currentUser.role}
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${activeTab === item.id
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
function PerfilView({ user, onSave }: { user: User | null; onSave: (user: User) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email, phone: user.phone ?? '' });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-10 text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-4">Sin usuario activo</h2>
        <p>Inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined
    });
    setIsEditing(false);
    window.alert('Perfil actualizado correctamente.');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Mi Perfil</h2>
          <p className="text-gray-600">Administra tu información personal y tus datos de contacto.</p>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className="inline-flex items-center gap-2 px-5 py-3 bg-[#0077B6] text-white font-semibold rounded-xl hover:bg-[#005f92] transition-colors">
          <Icon name={isEditing ? 'close' : 'edit'} /> {isEditing ? 'Cancelar' : 'Editar perfil'}
        </button>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3 flex flex-col items-center gap-4 text-center">
            <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center text-[#0077B6]">
              <Icon name="person" className="text-5xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Registrado el</p>
              <p className="font-semibold">{user.registeredAt}</p>
            </div>
            <div className="rounded-full bg-green-50 text-green-700 px-4 py-2 text-sm font-semibold">{user.role}</div>
          </div>
          <div className="w-full md:w-2/3">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} type="text" required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
                  <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} type="tel" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
                </div>
                <button type="submit" className="mt-4 px-6 py-3 bg-[#2D6A4F] text-white font-bold rounded-xl hover:bg-[#1f4a37] transition-colors">Guardar Cambios</button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre completo</p>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Correo electrónico</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-semibold text-gray-900">{user.phone ?? 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado de cuenta</p>
                  <p className="font-semibold text-gray-900">{user.status}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DestinoDetalleView({ destino, onBack, onViewMap }: { destino: Destino; onBack: () => void; onViewMap: () => void }) {
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
              <p className="text-sm text-gray-500 font-semibold">Categoría</p>
              <p className="text-xl font-bold text-[#2D6A4F]">{destino.category}</p>
            </div>
            <button onClick={onViewMap} className="px-8 py-4 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] shadow-md flex items-center gap-2">
              <Icon name="map" /> Ver en Mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Turista Views ---
function TuristaInicio({ onSelect }: { onSelect: (d: Destino) => void }) {
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
                <p className="text-sm text-gray-500">{d.category} • {d.rating} <Icon name="star" className="text-[14px] text-yellow-500 inline" /></p>
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

function TuristaDestinos({ onSelect, selectedDestino: propSelectedDestino }: { onSelect: (d: Destino) => void; selectedDestino?: Destino | null }) {
  const [selectedDestino, setSelectedDestino] = useState<Destino | null>(null);
  const [currentLocation] = useState<[number, number]>([-16.53483356011511, -68.08682682995484]); // La Paz coordinates
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sincronizar con el prop cuando cambie
  useEffect(() => {
    if (propSelectedDestino) {
      setSelectedDestino(propSelectedDestino);
    }
  }, [propSelectedDestino]);

  const categories = ['todos', ...Array.from(new Set(MOCK_DESTINOS.map(d => d.category)))];

  const filteredDestinos = MOCK_DESTINOS.filter(destino => {
    const matchesCategory = filterCategory === 'todos' || destino.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      destino.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destino.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destino.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDestinoClick = (destino: Destino) => {
    setSelectedDestino(destino);
    onSelect(destino);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Destinos Turísticos de La Paz</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar destinos..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none w-64"
            />
          </div>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'todos' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">
          {selectedDestino ? `Ruta hacia ${selectedDestino.title}` : 'Mapa Interactivo de La Paz'}
        </h3>
        <MapView selectedDestino={selectedDestino || undefined} currentLocation={currentLocation} />
        {selectedDestino && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-4">
              <img src={selectedDestino.image} alt={selectedDestino.title} className="w-20 h-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <h4 className="font-bold text-lg text-blue-900">{selectedDestino.title}</h4>
                <p className="text-blue-700 mb-2">{selectedDestino.desc}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Icon name="star" className="text-yellow-400" />
                    {selectedDestino.rating}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {selectedDestino.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDestino(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Icon name="close" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredDestinos.map(d => (
          <div 
            key={d.id} 
            onClick={() => handleDestinoClick(d)} 
            className={`bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-xl cursor-pointer transition-all ${
              selectedDestino?.id === d.id ? 'border-[#0077B6] ring-2 ring-[#0077B6]/20' : 'border-gray-100'
            }`}
          >
            <img src={d.image} className="w-full h-48 object-cover" alt={d.title} referrerPolicy="no-referrer" />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{d.title}</h3>
              <p className="text-gray-500 text-sm mb-2 line-clamp-2">{d.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {d.category}
                </span>
                <div className="flex items-center gap-1">
                  <Icon name="star" className="text-yellow-400 text-sm" />
                  <span className="text-sm text-gray-600">{d.rating}</span>
                </div>
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
      <h2 className="text-3xl font-bold mb-8">Clima en La Paz y Alrededores</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-3xl text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">La Paz - Centro</h3>
          <div className="flex items-center justify-between">
            <Icon name="partly_cloudy_day" className="text-6xl" />
            <span className="text-5xl font-bold">12°C</span>
          </div>
          <p className="mt-4 opacity-80">Clima templado, parcialmente nublado</p>
          <p className="text-sm mt-2 opacity-70">Altitud: 3,640 msnm</p>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-3xl text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">El Alto</h3>
          <div className="flex items-center justify-between">
            <Icon name="wb_sunny" className="text-6xl" />
            <span className="text-5xl font-bold">10°C</span>
          </div>
          <p className="mt-4 opacity-80">Más soleado que el centro</p>
          <p className="text-sm mt-2 opacity-70">Altitud: 4,150 msnm</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-teal-600 p-6 rounded-3xl text-white shadow-lg">
          <h3 className="text-xl font-bold mb-4">Valle de la Luna</h3>
          <div className="flex items-center justify-between">
            <Icon name="air" className="text-6xl" />
            <span className="text-5xl font-bold">8°C</span>
          </div>
          <p className="mt-4 opacity-80">Vientos moderados</p>
          <p className="text-sm mt-2 opacity-70">Altitud: 3,300 msnm</p>
        </div>
      </div>
      <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-2">Consejos para el Clima de La Paz</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Las temperaturas varían significativamente por altitud</li>
          <li>• El sol es intenso a pesar del frío - usa protector solar</li>
          <li>• Las lluvias son más frecuentes de diciembre a marzo</li>
          <li>• Los vientos pueden ser fuertes en zonas elevadas</li>
        </ul>
      </div>
    </div>
  );
}

function TuristaAlertas() {
  const [notifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('bolivia360_notifications');
    return saved ? JSON.parse(saved) as Notification[] : MOCK_NOTIFICATIONS;
  });

  const securityAlerts = notifications.filter(n => n.type === 'seguridad');
  const infoNotifications = notifications.filter(n => n.type !== 'seguridad');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alta': return 'red';
      case 'media': return 'orange';
      case 'baja': return 'blue';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'seguridad': return 'warning';
      case 'promocion': return 'local_offer';
      case 'recordatorio': return 'schedule';
      case 'bienvenida': return 'celebration';
      case 'sistema': return 'settings';
      default: return 'notifications';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-6">Alertas de Seguridad</h2>
      {securityAlerts.length > 0 ? (
        <div className="space-y-4 mb-12">
          {securityAlerts.map(notification => (
            <div key={notification.id} className={`bg-${getSeverityColor(notification.severity)}-50 border-l-4 border-${getSeverityColor(notification.severity)}-500 p-5 rounded-r-xl flex gap-4 items-start`}>
              <Icon name={getTypeIcon(notification.type)} className={`text-${getSeverityColor(notification.severity)}-500 text-3xl shrink-0`} />
              <div>
                <h3 className={`font-bold text-${getSeverityColor(notification.severity)}-800 text-lg mb-1`}>{notification.title}</h3>
                <p className={`text-${getSeverityColor(notification.severity)}-600`}>{notification.message}</p>
                <p className="text-sm text-gray-500 mt-2">{notification.createdAt}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 mb-12">
          <Icon name="notifications_off" className="text-6xl mb-4" />
          <p>No hay alertas de seguridad activas en este momento.</p>
        </div>
      )}

      <div>
        <h3 className="text-3xl font-bold mb-6">Notificaciones Informativas</h3>
        {infoNotifications.length > 0 ? (
          <div className="space-y-4">
            {infoNotifications.map(notification => (
              <div key={notification.id} className={`bg-${getSeverityColor(notification.severity)}-50 border-l-4 border-${getSeverityColor(notification.severity)}-500 p-5 rounded-r-xl flex gap-4 items-start`}>
                <Icon name={getTypeIcon(notification.type)} className={`text-${getSeverityColor(notification.severity)}-500 text-3xl shrink-0`} />
                <div>
                  <h3 className={`font-bold text-${getSeverityColor(notification.severity)}-800 text-lg mb-1`}>{notification.title}</h3>
                  <p className={`text-${getSeverityColor(notification.severity)}-600`}>{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-2">{notification.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Icon name="info" className="text-6xl mb-4" />
            <p>No hay notificaciones informativas disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

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

function AdminUsuarios({ users, setUsers }: { users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>> }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRole, setFilterRole] = useState<User['role'] | 'todos'>('todos');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'todos'>('todos');
  const usersPerPage = 5;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'todos' || user.role === filterRole;
    const matchesStatus = filterStatus === 'todos' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handleAddUser = (newUser: Omit<User, 'id' | 'registeredAt'>) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      window.alert('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (users.some(u => u.email === newUser.email)) {
      window.alert('Este correo electrónico ya está registrado.');
      return;
    }
    const user: User = {
      ...newUser,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, user]);
    setShowAddForm(false);
    createWelcomeNotification(user);
  };

  const handleEditUser = (updatedUser: User) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updatedUser.email)) {
      window.alert('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (users.some(u => u.email === updatedUser.email && u.id !== updatedUser.id)) {
      window.alert('Este correo electrónico ya está registrado por otro usuario.');
      return;
    }
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setEditingUser(null);
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const toggleStatus = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'activo' ? 'inactivo' : 'activo' } : u));
  };

  const changeRole = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const roles: User['role'][] = ['Turista', 'Administrador'];
        const currentIndex = roles.indexOf(u.role);
        const nextRole = roles[(currentIndex + 1) % roles.length];
        return { ...u, role: nextRole };
      }
      return u;
    }));
  };

  const exportUsers = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `usuarios_bolivia360_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetToMockData = () => {
    if (window.confirm('¿Estás seguro de que deseas restaurar los datos de prueba? Esto eliminará todos los cambios actuales.')) {
      setUsers(MOCK_USERS);
    }
  };

  const createWelcomeNotification = (user: User) => {
    const saved = localStorage.getItem('bolivia360_notifications');
    const notifications: Notification[] = saved ? JSON.parse(saved) as Notification[] : [];
    const maxId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) : 0;
    const welcomeNotification: Notification = {
      id: maxId + 1,
      title: `¡Bienvenido a Bolivia360, ${user.name}!`,
      message: `Tu cuenta ha sido creada exitosamente. Explora los mejores destinos turísticos de Bolivia.`,
      type: 'bienvenida',
      severity: 'baja',
      createdAt: new Date().toISOString().split('T')[0],
      isGlobal: false,
      targetUsers: [user.id],
      isRead: false
    };
    notifications.push(welcomeNotification);
    localStorage.setItem('bolivia360_notifications', JSON.stringify(notifications));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Gestión de Usuarios</h2>
        <div className="flex gap-3">
          <button onClick={resetToMockData} className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 flex items-center gap-2">
            <Icon name="refresh" /> Reset Datos
          </button>
          <button onClick={exportUsers} className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Icon name="download" /> Exportar
          </button>
          <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] flex items-center gap-2">
            <Icon name="person_add" /> Agregar Usuario
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Buscar</label>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Nombre, email o rol..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Rol</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as User['role'] | 'todos')} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none">
              <option value="todos">Todos</option>
              <option value="Turista">Turista</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Estado</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'todos')} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none">
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios</div>
          </div>
        </div>
      </div>

      {showAddForm && <UserForm user={null} onSave={handleAddUser} onCancel={() => setShowAddForm(false)} />}
      {editingUser && <UserForm user={editingUser} onSave={handleEditUser} onCancel={() => setEditingUser(null)} />}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Nombre</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Teléfono</th>
              <th className="p-4 font-semibold text-gray-600">Rol</th>
              <th className="p-4 font-semibold text-gray-600">Estado</th>
              <th className="p-4 font-semibold text-gray-600">Registro</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-900">{u.name}</td>
                <td className="p-4 text-gray-600">{u.email}</td>
                <td className="p-4 text-gray-600">{u.phone ?? 'N/A'}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.status === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                </td>
                <td className="p-4 text-gray-600">{u.registeredAt}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => setEditingUser(u)} className="text-[#0077B6] hover:bg-blue-50 p-2 rounded-lg transition-colors"><Icon name="edit" /></button>
                  <button onClick={() => changeRole(u.id)} className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors"><Icon name="swap_horiz" /></button>
                  <button onClick={() => toggleStatus(u.id)} className={`hover:bg-gray-50 p-2 rounded-lg transition-colors ${u.status === 'activo' ? 'text-red-500' : 'text-green-500'}`}>
                    <Icon name={u.status === 'activo' ? 'block' : 'check_circle'} />
                  </button>
                  <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Icon name="delete" /></button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron usuarios.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <Icon name="chevron_left" />
            </button>
            {Array.from({ length: totalPages }, (_v, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-2 border rounded-lg ${currentPage === page ? 'bg-[#0077B6] text-white border-[#0077B6]' : 'border-gray-200 hover:bg-gray-50'}`}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <Icon name="chevron_right" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- User Form Component ---
function UserForm({ user, onSave, onCancel }: {
  user: User | null;
  onSave: (user: User | Omit<User, 'id' | 'registeredAt'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    role: (user?.role ?? 'Turista') as User['role'],
    status: (user?.status ?? 'activo') as UserStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onSave({ ...user, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-6">{user ? 'Editar Usuario' : 'Agregar Usuario'}</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="usuario@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="+591 70000000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white">
                <option value="Turista">Turista</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors">
                {user ? 'Guardar Cambios' : 'Agregar Usuario'}
              </button>
              <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Admin Notificaciones View ---
function AdminNotificaciones() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('bolivia360_notifications');
    if (saved) {
      const parsed = JSON.parse(saved) as Notification[];
      return parsed.length > 0 ? parsed : MOCK_NOTIFICATIONS;
    }
    return MOCK_NOTIFICATIONS;
  });
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<Notification['type'] | 'todos'>('todos');
  const [filterSeverity, setFilterSeverity] = useState<Notification['severity'] | 'todos'>('todos');
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    localStorage.setItem('bolivia360_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'todos' || notification.type === filterType;
    const matchesSeverity = filterSeverity === 'todos' || notification.severity === filterSeverity;
    return matchesType && matchesSeverity;
  });

  const handleAddNotification = (newNotification: Omit<Notification, 'id' | 'createdAt'>) => {
    const maxId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) : 0;
    const notification: Notification = {
      ...newNotification,
      id: maxId + 1,
      createdAt: new Date().toISOString().split('T')[0],
      sentCount: 0
    };
    setNotifications([...notifications, notification]);
    setShowAddForm(false);
  };

  const handleEditNotification = (updatedNotification: Notification) => {
    setNotifications(notifications.map(n => n.id === updatedNotification.id ? updatedNotification : n));
    setEditingNotification(null);
  };

  const handleDeleteNotification = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta notificación?')) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const sendNotification = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, sentCount: (n.sentCount ?? 0) + 1 } : n
    ));
    window.alert('Notificación enviada exitosamente (simulado)');
  };

  const duplicateNotification = (notification: Notification) => {
    const maxId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) : 0;
    const duplicated: Notification = {
      ...notification,
      id: maxId + 1,
      title: `${notification.title} (Copia)`,
      createdAt: new Date().toISOString().split('T')[0],
      sentCount: 0
    };
    setNotifications([...notifications, duplicated]);
  };

  const resetToMockNotifications = () => {
    if (window.confirm('¿Estás seguro de que deseas restaurar las notificaciones de prueba?')) {
      localStorage.setItem('bolivia360_notifications', JSON.stringify(MOCK_NOTIFICATIONS));
      setNotifications(MOCK_NOTIFICATIONS);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alta': return 'red';
      case 'media': return 'orange';
      case 'baja': return 'blue';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'seguridad': return 'warning';
      case 'promocion': return 'local_offer';
      case 'recordatorio': return 'schedule';
      case 'bienvenida': return 'celebration';
      case 'sistema': return 'settings';
      default: return 'notifications';
    }
  };

  const stats = {
    total: notifications.length,
    byType: notifications.reduce((acc, n) => { acc[n.type] = (acc[n.type] ?? 0) + 1; return acc; }, {} as Record<string, number>),
    bySeverity: notifications.reduce((acc, n) => { acc[n.severity] = (acc[n.severity] ?? 0) + 1; return acc; }, {} as Record<string, number>),
    totalSent: notifications.reduce((sum, n) => sum + (n.sentCount ?? 0), 0)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Gestión de Notificaciones</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowStats(!showStats)} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 flex items-center gap-2">
            <Icon name="bar_chart" /> {showStats ? 'Ocultar' : 'Mostrar'} Estadísticas
          </button>
          <button onClick={resetToMockNotifications} className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 flex items-center gap-2">
            <Icon name="refresh" /> Reset Notificaciones
          </button>
          <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] flex items-center gap-2">
            <Icon name="add" /> Crear Notificación
          </button>
        </div>
      </div>

      {showStats && (
        <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4">Estadísticas de Notificaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Notificaciones</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalSent}</div>
              <div className="text-sm text-gray-600">Notificaciones Enviadas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.bySeverity.alta ?? 0}</div>
              <div className="text-sm text-gray-600">Alta Prioridad</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.byType.promocion ?? 0}</div>
              <div className="text-sm text-gray-600">Promociones</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Tipo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as Notification['type'] | 'todos')} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none">
              <option value="todos">Todos</option>
              <option value="seguridad">Seguridad</option>
              <option value="promocion">Promoción</option>
              <option value="recordatorio">Recordatorio</option>
              <option value="bienvenida">Bienvenida</option>
              <option value="sistema">Sistema</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Severidad</label>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as Notification['severity'] | 'todos')} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none">
              <option value="todos">Todos</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">Mostrando {filteredNotifications.length} de {notifications.length} notificaciones</div>
          </div>
        </div>
      </div>

      {showAddForm && <NotificationForm notification={null} onSave={handleAddNotification} onCancel={() => setShowAddForm(false)} />}
      {editingNotification && <NotificationForm notification={editingNotification} onSave={handleEditNotification} onCancel={() => setEditingNotification(null)} />}

      <div className="space-y-4">
        {filteredNotifications.map(notification => (
          <div key={notification.id} className={`bg-${getSeverityColor(notification.severity)}-50 border-l-4 border-${getSeverityColor(notification.severity)}-500 p-5 rounded-r-xl`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-4 items-start flex-1">
                <Icon name={getTypeIcon(notification.type)} className={`text-${getSeverityColor(notification.severity)}-500 text-3xl shrink-0 mt-1`} />
                <div className="flex-1">
                  <h3 className={`font-bold text-${getSeverityColor(notification.severity)}-800 text-lg mb-1`}>{notification.title}</h3>
                  <p className={`text-${getSeverityColor(notification.severity)}-600 mb-2`}>{notification.message}</p>
                  <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                    <span>Tipo: {notification.type}</span>
                    <span>Severidad: {notification.severity}</span>
                    <span>Alcance: {notification.isGlobal ? 'Global' : 'Específico'}</span>
                    <span>Creada: {notification.createdAt}</span>
                    {notification.sentCount !== undefined && <span>Enviada: {notification.sentCount} veces</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => sendNotification(notification.id)} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"><Icon name="send" /></button>
                <button onClick={() => duplicateNotification(notification)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Icon name="content_copy" /></button>
                <button onClick={() => setEditingNotification(notification)} className="text-[#0077B6] hover:bg-blue-50 p-2 rounded-lg transition-colors"><Icon name="edit" /></button>
                <button onClick={() => handleDeleteNotification(notification.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Icon name="delete" /></button>
              </div>
            </div>
          </div>
        ))}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Icon name="notifications_off" className="text-6xl mb-4" />
            <p>No hay notificaciones que coincidan con los filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Notification Form Component ---
function NotificationForm({ notification, onSave, onCancel }: {
  notification: Notification | null;
  onSave: (notification: Notification | Omit<Notification, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: notification?.title ?? '',
    message: notification?.message ?? '',
    type: (notification?.type ?? 'seguridad') as Notification['type'],
    severity: (notification?.severity ?? 'media') as Notification['severity'],
    isGlobal: notification?.isGlobal ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notification) {
      onSave({ ...notification, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-6">{notification ? 'Editar Notificación' : 'Crear Notificación'}</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="Título de la notificación" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mensaje</label>
              <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="Contenido de la notificación" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Notification['type'] })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white">
                <option value="seguridad">Seguridad</option>
                <option value="promocion">Promoción</option>
                <option value="recordatorio">Recordatorio</option>
                <option value="bienvenida">Bienvenida</option>
                <option value="sistema">Sistema</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Severidad</label>
              <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value as Notification['severity'] })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isGlobal} onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })} className="rounded" />
                <span className="text-sm font-semibold text-gray-700">Notificación global (visible para todos)</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 py-3 bg-[#0077B6] text-white font-bold rounded-xl hover:bg-[#005f92] transition-colors">
                {notification ? 'Guardar Cambios' : 'Crear Notificación'}
              </button>
              <button type="button" onClick={onCancel} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
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
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-[#0077B6] h-4 rounded-full" style={{ width: '65%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">Valles (Cochabamba, Tarija)</span><span className="text-gray-500">20%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-[#2D6A4F] h-4 rounded-full" style={{ width: '20%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">Llanos (Santa Cruz, Beni)</span><span className="text-gray-500">15%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-orange-500 h-4 rounded-full" style={{ width: '15%' }}></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}