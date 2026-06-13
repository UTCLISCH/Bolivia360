/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// --- Types ---
type ViewState = 'landing' | 'login' | 'register' | 'app';
type Role = 'turista' | 'administrador' | 'operador' | null;
type UserStatus = 'activo' | 'inactivo' | 'bloqueado';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  failedLoginAttempts?: number;
  role: 'Turista' | 'Administrador' | 'Operador';
  status: UserStatus;
  registeredAt: string;
  notificacionesActivas?: boolean;
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
  targetRoles?: Array<'Turista' | 'Operador' | 'Administrador'>;
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

interface Producto {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: string;
  stock: number;
  reserved: number;
}

interface Reserva {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  date: string;
  status: 'confirmada' | 'pendiente' | 'cancelada';
  userId?: number;
  customerName?: string;
}

// --- Helper Component for Google Icons ---
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const MAX_LOGIN_ATTEMPTS = 3;

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
      createMarker: () => null,
      show: false,
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

        {/* Routing control draws a realistic route along streets */}
        {selectedDestino && <RoutingMachine waypoints={[currentLocation, [selectedDestino.lat, selectedDestino.lng]]} />}
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
    { id: 'catalogo', label: 'Catálogo', icon: 'inventory_2' },
    { id: 'reservas', label: 'Mis reservas', icon: 'book_online' },
    { id: 'alertas', label: 'Alertas', icon: 'warning' },
  ],
  administrador: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'usuarios', label: 'Usuarios', icon: 'group' },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'notifications' },
    { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
  ],
  operador: [
    { id: 'inicio', label: 'Inicio', icon: 'dashboard' },
    { id: 'catalogo', label: 'Catálogo', icon: 'inventory_2' },
    { id: 'inventario', label: 'Inventario', icon: 'inventory' },
    { id: 'reservas', label: 'Reservas', icon: 'book_online' },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'notifications' },
  ]
};

// --- Mock Data ---
const MOCK_DESTINOS: Destino[] = [
  { id: 1, title: 'Basílica de San Francisco', image: 'https://picsum.photos/seed/sanfrancisco/800/600', desc: 'Iglesia colonial más antigua de La Paz, joya del barroco mestizo.', rating: '4.8', lat: -16.4958, lng: -68.1336, category: 'Cultural' },
  { id: 2, title: 'Valle de la Luna', image: 'https://picsum.photos/seed/valleluna/800/600', desc: 'Formaciones rocosas erosionadas que parecen un paisaje lunar.', rating: '4.7', lat: -16.5486, lng: -68.0833, category: 'Natural' },
  { id: 3, title: 'Mercado de las Brujas', image: 'https://picsum.photos/seed/brujas/800/600', desc: 'Mercado tradicional con remedios naturales y artesanías.', rating: '4.5', lat: -16.4969, lng: -68.1350, category: 'Cultural' },
  { id: 4, title: 'Teleférico Mi Teleférico', image: 'https://picsum.photos/seed/teleferico/800/600', desc: 'Sistema de teleférico urbano más alto del mundo.', rating: '4.9', lat: -16.5291, lng: -68.0917, category: 'Moderno' },
  { id: 5, title: 'Chacaltaya', image: 'https://picsum.photos/seed/chacaltaya/800/600', desc: 'Antiguo centro de esquí, ahora lugar de reflexión sobre cambio climático.', rating: '4.6', lat: -16.3525, lng: -68.1314, category: 'Natural' },
  { id: 6, title: 'Museo de Arte Contemporáneo', image: 'https://picsum.photos/seed/museoarte/800/600', desc: 'Colección de arte moderno paceño en un edificio histórico.', rating: '4.4', lat: -16.4978, lng: -68.1356, category: 'Cultural' },
  { id: 7, title: 'Calle Jaén', image: 'https://picsum.photos/seed/callejaen/800/600', desc: 'Calle colonial con casas históricas y museos.', rating: '4.7', lat: -16.4964, lng: -68.1367, category: 'Histórico' },
  { id: 8, title: 'Lago Titicaca (desde La Paz)', image: 'https://picsum.photos/seed/titicaca/800/600', desc: 'Lago navegable más alto del mundo, accesible desde La Paz.', rating: '4.8', lat: -15.8231, lng: -69.3344, category: 'Natural' },
  { id: 9, title: 'Parque Nacional Cotapata', image: 'https://picsum.photos/seed/cotapata/800/600', desc: 'Bosque nublado con cascadas y senderos ecológicos.', rating: '4.5', lat: -16.2833, lng: -67.8833, category: 'Natural' },
  { id: 10, title: 'El Alto - Ciudad de los Vientos', image: 'https://picsum.photos/seed/elalto/800/600', desc: 'Ciudad hermana de La Paz con mercados tradicionales.', rating: '4.3', lat: -16.5000, lng: -68.1667, category: 'Cultural' },
  { id: 11, title: 'Catedral Metropolitana', image: 'https://picsum.photos/seed/catedral/800/600', desc: 'Imponente catedral neogótica en el corazón de La Paz.', rating: '4.6', lat: -16.4950, lng: -68.1339, category: 'Religioso' },
  { id: 12, title: 'Mirador Killi Killi', image: 'https://picsum.photos/seed/killikilli/800/600', desc: 'Vista panorámica impresionante de La Paz desde las alturas.', rating: '4.9', lat: -16.5167, lng: -68.1167, category: 'Vista' },
];

const MOCK_PRODUCTOS: Producto[] = [
  { id: 1, name: 'Tour al Valle de la Luna', description: 'Excursión guiada de medio día con traslado incluido.', category: 'Experiencia', price: 45, duration: '4h', stock: 12, reserved: 2 },
  { id: 2, name: 'Souvenir Textil Andino', description: 'Manta artesanal de diseño paceño.', category: 'Souvenir', price: 18, duration: 'N/A', stock: 8, reserved: 0 },
  { id: 3, name: 'Paseo en Teleférico', description: 'Ticket para viajar en el teleférico Mi Teleférico.', category: 'Experiencia', price: 20, duration: '2h', stock: 5, reserved: 1 },
  { id: 4, name: 'Tour Gastronómico', description: 'Ruta con 3 paradas en los mejores restaurantes paceños.', category: 'Experiencia', price: 60, duration: '5h', stock: 3, reserved: 1 },
  { id: 5, name: 'Llaveros de Plata', description: 'Juego de 3 llaveros artesanales hechos a mano.', category: 'Souvenir', price: 12, duration: 'N/A', stock: 20, reserved: 0 },
];

const MOCK_USERS: User[] = [
  { id: 1, name: 'Juan Perez', email: 'juan@test.com', phone: '+591 70000001', password: 'Juan1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-01-15', notificacionesActivas: true },
  { id: 2, name: 'Agencia Andes', email: 'contacto@andes.com', phone: '+591 70000002', password: 'Andes1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-02-20', notificacionesActivas: true },
  { id: 3, name: 'Admin Principal', email: 'admin@chuquiago360.com', phone: '+591 70000003', password: 'Admin1234', failedLoginAttempts: 0, role: 'Administrador', status: 'activo', registeredAt: '2026-01-01', notificacionesActivas: true },
  { id: 13, name: 'Operador Central', email: 'operador@chuquiago360.com', phone: '+591 70000013', password: 'Operador1234', failedLoginAttempts: 0, role: 'Operador', status: 'activo', registeredAt: '2026-11-05', notificacionesActivas: true },
  { id: 4, name: 'Maria Lopez', email: 'maria@test.com', phone: '+591 70000004', password: 'Maria1234', failedLoginAttempts: 0, role: 'Turista', status: 'inactivo', registeredAt: '2026-03-10', notificacionesActivas: false },
  { id: 5, name: 'Carlos Rodriguez', email: 'carlos@test.com', phone: '+591 70000005', password: 'Carlos1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-04-05', notificacionesActivas: true },
  { id: 6, name: 'Ana Garcia', email: 'ana@test.com', phone: '+591 70000006', password: 'Ana1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-05-12', notificacionesActivas: true },
  { id: 7, name: 'Luis Martinez', email: 'luis@test.com', phone: '+591 70000007', password: 'Luis1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-06-18', notificacionesActivas: true },
  { id: 8, name: 'Sofia Fernandez', email: 'sofia@test.com', phone: '+591 70000008', password: 'Sofia1234', failedLoginAttempts: 0, role: 'Administrador', status: 'activo', registeredAt: '2026-07-22', notificacionesActivas: true },
  { id: 9, name: 'Diego Morales', email: 'diego@test.com', phone: '+591 70000009', password: 'Diego1234', failedLoginAttempts: 0, role: 'Turista', status: 'inactivo', registeredAt: '2026-08-30', notificacionesActivas: false },
  { id: 10, name: 'Valentina Castro', email: 'valentina@test.com', phone: '+591 70000010', password: 'Valentina1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-09-14', notificacionesActivas: true },
  { id: 11, name: 'Miguel Sanchez', email: 'miguel@test.com', phone: '+591 70000011', password: 'Miguel1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-10-01', notificacionesActivas: true },
  { id: 12, name: 'Camila Rojas', email: 'camila@test.com', phone: '+591 70000012', password: 'Camila1234', failedLoginAttempts: 0, role: 'Turista', status: 'activo', registeredAt: '2026-10-15', notificacionesActivas: true },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Cierre de la Avenida 6 de Agosto', message: 'La Av. 6 de Agosto estará cerrada a tráfico este fin de semana por mantenimiento. Se recomienda usar rutas alternas como Av. Mariscal Santa Cruz.', type: 'seguridad', severity: 'alta', createdAt: '2026-10-01', isGlobal: true, sentCount: 2 },
  { id: 2, title: 'Lluvia en La Paz - Precaución en zonas altas', message: 'Se esperan lluvias moderadas en La Paz. Precaución en la Ceja y zonas altas de la ciudad. Lleva paraguas si vas a recorrer destinos de altura.', type: 'seguridad', severity: 'media', createdAt: '2026-10-02', isGlobal: true, sentCount: 1 },
  { id: 3, title: 'Promoción especial en tours de La Paz', message: 'Descuento del 20% en tours guiados por el Centro Histórico y la Basílica de San Francisco este fin de semana.', type: 'promocion', severity: 'baja', createdAt: '2026-10-03', isGlobal: true, sentCount: 3 },
  { id: 4, title: 'Recordatorio: Mantenimiento del sistema', message: 'El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 4:00 AM.', type: 'sistema', severity: 'media', createdAt: '2026-10-04', isGlobal: true, sentCount: 1 },
];

// --- Main App Component ---
export default function App() {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('chuquiago360_users');
    if (saved) {
      const parsedUsers = JSON.parse(saved) as User[];
      return parsedUsers.length > 0 ? parsedUsers : MOCK_USERS;
    }
    return MOCK_USERS;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('chuquiago360_current_user');
    return saved ? JSON.parse(saved) as User : null;
  });
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('chuquiago360_current_user');
    return saved ? 'app' : 'landing';
  });

  useEffect(() => {
    localStorage.setItem('chuquiago360_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chuquiago360_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('chuquiago360_current_user');
    }
  }, [currentUser]);

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogin = (email: string, password: string): string | undefined => {
    if (!email.trim() || !password.trim()) {
      return 'Correo y contraseña son obligatorios.';
    }

    const foundIndex = users.findIndex((user) => user.email.toLowerCase() === email.toLowerCase());
    if (foundIndex === -1) {
      return 'Usuario o contraseña inválidos.';
    }

    const user = users[foundIndex];
    if (user.status === 'inactivo') {
      return 'Esta cuenta está inactiva. Contacta al administrador.';
    }
    if (user.status === 'bloqueado') {
      return 'Cuenta bloqueada. Contacta al administrador.';
    }
    if (user.password !== password) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const updatedUser: User = {
        ...user,
        failedLoginAttempts: attempts,
        status: attempts >= MAX_LOGIN_ATTEMPTS ? 'bloqueado' : user.status,
      };
      setUsers(users.map((item, index) => index === foundIndex ? updatedUser : item));

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        return 'Cuenta bloqueada tras 3 intentos fallidos. Contacta al administrador.';
      }
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      return `Usuario o contraseña inválidos. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`;
    }

    const updatedUser: User = { ...user, failedLoginAttempts: 0 };
    setUsers(users.map((item, index) => index === foundIndex ? updatedUser : item));
    setCurrentUser(updatedUser);
    setCurrentView('app');
    return undefined;
  };

  const handleQuickLogin = (user: User): string | undefined => {
    if (user.status === 'inactivo') {
      return 'Esta cuenta está inactiva. Contacta al administrador.';
    }
    if (user.status === 'bloqueado') {
      return 'Cuenta bloqueada. Contacta al administrador.';
    }
    setCurrentUser(user);
    setCurrentView('app');
    return undefined;
  };

  const handleRegister = (newUserData: { name: string; email: string; phone?: string; password: string; notificacionesActivas: boolean }) => {
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
      password: newUserData.password,
      failedLoginAttempts: 0,
      role: 'Turista',
      status: 'activo',
      registeredAt: new Date().toISOString().split('T')[0],
      notificacionesActivas: newUserData.notificacionesActivas
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    
    // Create and send welcome notification if user opted in
    if (newUserData.notificacionesActivas) {
      const savedNotifications = localStorage.getItem('chuquiago360_notifications');
      const notificationsList = savedNotifications ? JSON.parse(savedNotifications) : MOCK_NOTIFICATIONS;
      const welcomeNotification: Notification = {
        id: (notificationsList?.length ?? 0) + 1,
        title: `¡Bienvenido/a a Chuquiago360, ${newUserData.name}!`,
        message: `Hola ${newUserData.name}, te damos la bienvenida a nuestra plataforma de turismo en La Paz. Explora nuestros destinos, catálogo de productos y mantente informado con nuestras notificaciones sobre eventos, promociones y alertas de seguridad en la ciudad.`,
        type: 'bienvenida',
        severity: 'baja',
        createdAt: new Date().toISOString().split('T')[0],
        isGlobal: false,
        targetUsers: [newUser.id],
        isRead: false
      };
      const updatedNotifications = [...notificationsList, welcomeNotification];
      localStorage.setItem('chuquiago360_notifications', JSON.stringify(updatedNotifications));
    }
    
    setCurrentView('app');
    // Show welcome toast/alert with notification details if enabled
    if (newUserData.notificacionesActivas) {
      setTimeout(() => {
        window.alert(`¡Bienvenido/a a Chuquiago360, ${newUserData.name}!\n\nYa tienes una notificación de bienvenida en tu bandeja de alertas.\n\nAccede a la sección Alertas para conocer todas las novedades, eventos y promociones exclusivas de La Paz.`);
      }, 500);
    } else {
      window.alert('Registro exitoso. ¡Bienvenido a Chuquiago360!');
    }
  };

  const handleUpdateProfile = (updatedUser: User): string | undefined => {
    const duplicateEmail = users.some((user) => user.email.toLowerCase() === updatedUser.email.toLowerCase() && user.id !== updatedUser.id);
    if (duplicateEmail) {
      return 'Este correo ya está registrado por otro usuario.';
    }

    setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    setCurrentUser(updatedUser);
    return undefined;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-[#0077B6] selection:text-white">
      {currentView === 'landing' && <LandingView onNavigate={navigateTo} />}
      {currentView === 'login' && <LoginView onNavigate={navigateTo} users={users} onLogin={handleLogin} onQuickLogin={handleQuickLogin} />}
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

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
        <div className="absolute inset-0 z-0">
          <img src="https://picsum.photos/seed/lapaz_hero/1920/1080" alt="La Paz landscape" className="w-full h-full object-cover opacity-10" referrerPolicy="no-referrer" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Descubre La Paz con <br /><span className="text-[#0077B6] bg-clip-text text-transparent bg-gradient-to-r from-[#0077B6] to-[#2D6A4F]">Chuquiago360</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Tu guía completa para explorar los tesoros naturales, culturales e históricos de La Paz y sus alrededores.
            Planifica rutas, recibe alertas de seguridad y conecta con la comunidad turística paceña.
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

      {/* What is Chuquiago360 Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">¿Qué es Chuquiago360?</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Chuquiago360 es la plataforma turística más completa de La Paz, diseñada para ofrecerte una experiencia
            única en la planificación y disfrute de tus viajes. Desde la majestuosa Basílica de San Francisco hasta las formaciones
            rocosas del Valle de la Luna, te acompañamos en cada paso de tu aventura paceña.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-sm">
              <Icon name="explore" className="text-4xl text-[#0077B6] mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Explora Destinos</h3>
              <p className="text-gray-600">Descubre los lugares más emblemáticos de La Paz con información detallada, fotos y recomendaciones personalizadas.</p>
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
              <p className="text-gray-600">Navega por La Paz con mapas detallados y rutas personalizadas para tu viaje.</p>
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
            Únete a miles de viajeros que ya han descubierto La Paz con Chuquiago360.
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
            <span className="text-2xl font-bold">Chuquiago360</span>
          </div>
          <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
            La plataforma turística líder de La Paz, conectando viajeros con las maravillas naturales y culturales de nuestra ciudad.
          </p>
          <div className="text-center text-sm text-gray-500">
            © 2026 Chuquiago360. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Register View ---
function RegisterView({ onNavigate, onRegister }: { onNavigate: (v: ViewState) => void; onRegister: (data: { name: string; email: string; phone?: string; password: string; notificacionesActivas: boolean }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  const [msg, setMsg] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      setMsg('Nombre, correo y contraseña son obligatorios.');
      return;
    }
    
    if (password.length < 6) {
      setMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    if (password !== passwordConfirm) {
      setMsg('Las contraseñas no coinciden.');
      return;
    }
    
    onRegister({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password, notificacionesActivas });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gray-100">
      <div className="absolute top-0 left-0 w-full h-96 bg-[#2D6A4F] -skew-y-6 origin-top-left -z-10"></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-10">
          <div className="flex justify-center mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="flex items-center gap-2 text-[#2D6A4F] font-bold text-4xl tracking-tight">
              <Icon name="travel_explore" className="text-5xl" />
              <span>Chuquiago360</span>
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar contraseña</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-none bg-gray-50 focus:bg-white" placeholder="Repite tu contraseña" />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Icon name="info" className="text-blue-600 text-[20px] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-900">Preferencias de notificación</p>
                  <p className="text-xs text-blue-700 mt-1">Recibe alertas sobre promociones, eventos y situaciones de seguridad en La Paz</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="notificaciones"
                type="checkbox"
                checked={notificacionesActivas}
                onChange={(e) => setNotificacionesActivas(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] cursor-pointer"
              />
              <label htmlFor="notificaciones" className="text-sm text-gray-700 cursor-pointer">Sí, quiero recibir notificaciones</label>
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
function LoginView({ onNavigate, users, onLogin, onQuickLogin }: { onNavigate: (v: ViewState) => void; users: User[]; onLogin: (email: string, password: string) => string | undefined; onQuickLogin: (user: User) => string | undefined }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const error = onLogin(email.trim(), password);
    if (error) {
      setMsg(error);
    }
  };

  const quickLogin = (role: User['role']) => {
    const user = users.find((u) => u.role === role && u.status === 'activo');
    if (!user) {
      setMsg(`No hay usuarios activos con rol ${role}.`);
      return;
    }
    const error = onQuickLogin(user);
    if (error) {
      setMsg(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gray-100">
      <div className="absolute top-0 left-0 w-full h-96 bg-[#0077B6] -skew-y-6 origin-top-left -z-10"></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-10">
          <div className="flex justify-center mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="flex items-center gap-2 text-[#0077B6] font-bold text-4xl tracking-tight">
              <Icon name="travel_explore" className="text-5xl" />
              <span>Chuquiago360</span>
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
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white" placeholder="••••••••" />
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
              <button onClick={() => quickLogin('Turista')} className="py-2.5 px-2 text-xs font-bold bg-blue-50 text-[#0077B6] rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-1">
                <Icon name="hiking" className="text-[20px]" /> Turista
              </button>
              <button onClick={() => quickLogin('Operador')} className="py-2.5 px-2 text-xs font-bold bg-yellow-50 text-[#b07a00] rounded-xl hover:bg-yellow-100 transition-colors flex flex-col items-center gap-1">
                <Icon name="warehouse" className="text-[20px]" /> Operador
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
function MainAppView({ currentUser, users, setUsers, onUpdateProfile, onLogout }: { currentUser: User | null; users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>; onUpdateProfile: (user: User) => string | undefined; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedItem, setSelectedItem] = useState<Destino | null>(null);
  const [productos, setProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('chuquiago360_productos');
    return saved ? JSON.parse(saved) as Producto[] : MOCK_PRODUCTOS;
  });
  const [reservas, setReservas] = useState<Reserva[]>(() => {
    const saved = localStorage.getItem('chuquiago360_reservas');
    return saved ? JSON.parse(saved) as Reserva[] : [];
  });

  useEffect(() => {
    localStorage.setItem('chuquiago360_productos', JSON.stringify(productos));
  }, [productos]);

  useEffect(() => {
    localStorage.setItem('chuquiago360_reservas', JSON.stringify(reservas));
  }, [reservas]);

  const currentRole = currentUser?.role === 'Administrador'
    ? 'administrador'
    : currentUser?.role === 'Operador'
      ? 'operador'
      : 'turista';
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
        case 'catalogo': return <TuristaCatalogo productos={productos} setProductos={setProductos} reservas={reservas} setReservas={setReservas} currentUser={currentUser} />;
        case 'reservas': return <TuristaReservas reservas={reservas} currentUser={currentUser} setProductos={setProductos} setReservas={setReservas} productos={productos} />;
        case 'clima': return <TuristaClima />;
        case 'alertas': return <TuristaAlertas />;
      }
    } else if (currentUser.role === 'Administrador') {
      switch (activeTab) {
        case 'inicio': return <AdminInicio productos={productos} reservas={reservas} />;
        case 'usuarios': return <AdminUsuarios users={users} setUsers={setUsers} />;
        case 'notificaciones': return <AdminNotificaciones />;
        case 'reportes': return <AdminReportes productos={productos} reservas={reservas} />;
      }
    } else if (currentUser.role === 'Operador') {
      switch (activeTab) {
        case 'inicio': return <OperadorInicio productos={productos} reservas={reservas} />;
        case 'catalogo': return <OperadorCatalogo productos={productos} setProductos={setProductos} />;
        case 'inventario': return <OperadorInventario productos={productos} setProductos={setProductos} />;
        case 'reservas': return <OperadorReservas productos={productos} reservas={reservas} setReservas={setReservas} setProductos={setProductos} />;
        case 'notificaciones': return <OperadorNotificaciones users={users} />;
      }
    }
    return <div className="p-8 text-center text-gray-500">Vista no encontrada</div>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-[9999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 border-b border-gray-100">
            <div className="flex items-center gap-2 text-[#0077B6] font-bold text-2xl">
              <Icon name="travel_explore" className="text-3xl" />
              <span className="hidden sm:block">Chuquiago360</span>
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
function PerfilView({ user, onSave }: { user: User | null; onSave: (user: User) => string | undefined }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', passwordConfirm: '', notificacionesActivas: true });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email, phone: user.phone ?? '', password: '', passwordConfirm: '', notificacionesActivas: user.notificacionesActivas ?? true });
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
    setMessage('');
    
    if (formData.password && formData.password !== formData.passwordConfirm) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const updatedUser = {
      ...user,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      notificacionesActivas: formData.notificacionesActivas,
      ...(formData.password && { password: formData.password })
    };
    
    const error = onSave(updatedUser);
    if (error) {
      setMessage(error);
      return;
    }

    setIsEditing(false);
    setFormData({ name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone ?? '', password: '', passwordConfirm: '', notificacionesActivas: updatedUser.notificacionesActivas ?? true });
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
                <div className="border-t border-gray-200 pt-5 mt-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Preferencias de notificaciones</h3>
                  <div className="flex items-center gap-2">
                    <input
                      id="notificaciones_perfil"
                      type="checkbox"
                      checked={formData.notificacionesActivas}
                      onChange={(e) => setFormData({ ...formData, notificacionesActivas: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#0077B6] focus:ring-[#0077B6]"
                    />
                    <label htmlFor="notificaciones_perfil" className="text-sm text-gray-700">Recibir notificaciones sobre ofertas, eventos y alertas de seguridad</label>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-5 mt-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Cambiar contraseña (opcional)</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva contraseña</label>
                    <input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} type="password" placeholder="Dejar en blanco si no quieres cambiar" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 mt-3">Confirmar contraseña</label>
                    <input value={formData.passwordConfirm} onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })} type="password" placeholder="Repite la nueva contraseña" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-[#0077B6] outline-none" />
                  </div>
                </div>
                {message && <p className="text-sm text-red-600 font-medium">{message}</p>}
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
                <div>
                  <p className="text-sm text-gray-500">Notificaciones</p>
                  <p className="font-semibold text-gray-900">{user.notificacionesActivas ? '✓ Activadas' : '✗ Desactivadas'}</p>
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
      <div className="relative h-[40vh] min-h-[300px] w-full bg-gray-900 overflow-hidden">
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
  const [destinoWeather, setDestinoWeather] = useState<OpenMeteoForecast | null>(null);
  const [destinoWeatherStatus, setDestinoWeatherStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [destinoWeatherError, setDestinoWeatherError] = useState<string>('');
  const [destinoWeatherLabel, setDestinoWeatherLabel] = useState<string>('');

  const getWeatherEmoji = (code: number) => {
    const icons: Record<number, string> = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌧️', 55: '🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '❄️', 73: '❄️',
      75: '❄️', 77: '❄️', 80: '🌦️', 81: '🌧️', 82: '🌧️',
      85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return icons[code] ?? '🌡️';
  };

  const getWeatherDescription = (code: number) => {
    const descriptions: Record<number, string> = {
      0: 'Despejado', 1: 'Poco nublado', 2: 'Parcialmente nublado', 3: 'Nublado',
      45: 'Niebla', 48: 'Bruma', 51: 'Llovizna ligera', 53: 'Lluvia ligera', 55: 'Lluvia moderada',
      61: 'Lluvia', 63: 'Lluvia fuerte', 65: 'Lluvia intensa', 71: 'Nieve ligera',
      73: 'Nieve moderada', 75: 'Nieve intensa', 77: 'Aguanieve', 80: 'Lluvias aisladas',
      81: 'Lluvias frecuentes', 82: 'Lluvias fuertes', 85: 'Chubascos de nieve',
      86: 'Tormenta de nieve', 95: 'Tormenta eléctrica', 96: 'Tormenta con granizo', 99: 'Tormenta severa'
    };
    return descriptions[code] ?? 'Condiciones variables';
  };

  // Sincronizar con el prop cuando cambie
  useEffect(() => {
    if (propSelectedDestino) {
      setSelectedDestino(propSelectedDestino);
    }
  }, [propSelectedDestino]);

  useEffect(() => {
    if (!selectedDestino) {
      setDestinoWeather(null);
      setDestinoWeatherStatus('idle');
      setDestinoWeatherError('');
      setDestinoWeatherLabel('');
      return;
    }

    let isCancelled = false;
    const fetchDestinoWeather = async () => {
      setDestinoWeatherStatus('loading');
      setDestinoWeatherError('');

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${selectedDestino.lat}&longitude=${selectedDestino.lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto&forecast_days=3`;
        const response = await fetch(weatherUrl);
        if (!response.ok) {
          throw new Error(`API clima respondió con ${response.status}`);
        }
        const data = (await response.json()) as OpenMeteoForecast;
        if (!data.current_weather || !data.daily) {
          throw new Error('Respuesta incompleta del servicio meteorológico');
        }
        if (isCancelled) return;
        setDestinoWeather(data);

        try {
          const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${selectedDestino.lat}&lon=${selectedDestino.lng}`;
          const reverseResponse = await fetch(reverseUrl);
          if (reverseResponse.ok) {
            const reverseData = await reverseResponse.json();
            const label = reverseData.address?.city || reverseData.address?.town || reverseData.address?.village || reverseData.display_name?.split(',')[0];
            if (label && !isCancelled) {
              setDestinoWeatherLabel(label);
            }
          }
        } catch {
          if (!isCancelled) {
            setDestinoWeatherLabel(selectedDestino.title);
          }
        }

        if (!isCancelled) {
          setDestinoWeatherStatus('ready');
        }
      } catch (error: any) {
        if (!isCancelled) {
          setDestinoWeatherStatus('error');
          setDestinoWeatherError(error?.message ?? 'No se pudo cargar el clima.');
          setDestinoWeather(null);
        }
      }
    };

    fetchDestinoWeather();
    return () => { isCancelled = true; };
  }, [selectedDestino]);

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
          <div className="mt-4 grid gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
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

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-[0.24em]">Clima del destino</p>
                  <h4 className="text-xl font-bold text-gray-900">{destinoWeatherLabel || selectedDestino.title}</h4>
                </div>
                <div className="text-4xl">{destinoWeather ? getWeatherEmoji(destinoWeather.current_weather.weathercode) : '🌦️'}</div>
              </div>

              {destinoWeatherStatus === 'loading' && (
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-gray-600">Cargando clima del destino...</div>
              )}

              {destinoWeatherStatus === 'error' && (
                <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{destinoWeatherError}</div>
              )}

              {destinoWeatherStatus === 'ready' && destinoWeather && (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-gray-500">Condición</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{getWeatherDescription(destinoWeather.current_weather.weathercode)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-gray-500">Temperatura</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{Math.round(destinoWeather.current_weather.temperature)}°C</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-gray-500">Viento</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{Math.round(destinoWeather.current_weather.windspeed)} km/h</p>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-gray-600">
                    <p>Pronóstico de {destinoWeather.daily.time.length} días</p>
                    <div className="mt-3 space-y-2">
                      {destinoWeather.daily.time.map((day, index) => {
                        const date = new Date(day);
                        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
                        return (
                          <div key={day} className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-gray-800">{dayName}</div>
                            <div className="text-gray-500 text-sm">{Math.round(destinoWeather.daily.temperature_2m_max[index])}° / {Math.round(destinoWeather.daily.temperature_2m_min[index])}°</div>
                            <div>{getWeatherEmoji(destinoWeather.daily.weathercode[index])}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900 mb-3">Recomendaciones climáticas para este destino</p>
                    <ul className="space-y-2">
                      <li>• Usa capas porque el clima puede cambiar rápido en la región.</li>
                      <li>• Lleva impermeable y calzado adecuado si hay probabilidad de lluvia.</li>
                      <li>• Protege tu piel con bloqueador solar en altura.</li>
                      <li>• Planea actividades al aire libre en las horas más secas del día.</li>
                    </ul>
                  </div>
                </div>
              )}
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

function TuristaCatalogo({ productos, setProductos, reservas, setReservas, currentUser }: { productos: Producto[]; setProductos: React.Dispatch<React.SetStateAction<Producto[]>>; reservas: Reserva[]; setReservas: React.Dispatch<React.SetStateAction<Reserva[]>>; currentUser: User }) {
  const [selectedProductId, setSelectedProductId] = useState(productos[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const selectedProduct = productos.find((producto) => producto.id === selectedProductId);

  const createReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity < 1) {
      setMessage('La cantidad debe ser al menos 1.');
      return;
    }
    if (selectedProduct.stock < quantity) {
      setMessage('No hay stock suficiente para este producto.');
      return;
    }

    setProductos(productos.map((producto) =>
      producto.id === selectedProduct.id
        ? { ...producto, stock: producto.stock - quantity, reserved: producto.reserved + quantity }
        : producto
    ));

    const newReservation: Reserva = {
      id: reservas.length > 0 ? Math.max(...reservas.map((r) => r.id)) + 1 : 1,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      date: new Date().toISOString().split('T')[0],
      status: 'confirmada',
      userId: currentUser.id,
      customerName: currentUser.name,
    };

    setReservas([newReservation, ...reservas]);
    setQuantity(1);
    setMessage('Reserva realizada con éxito.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo para Turistas</h1>
          <p className="text-gray-600">Explora experiencias y souvenirs disponibles, y reserva directamente desde aquí.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] mb-10">
        <div className="space-y-6">
          {productos.map((producto) => (
            <div key={producto.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900">{producto.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${producto.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {producto.stock > 0 ? 'Disponible' : 'Agotado'}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{producto.description}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="bg-slate-100 px-3 py-2 rounded-full">{producto.category}</span>
                  <span className="bg-slate-100 px-3 py-2 rounded-full">Precio: ${producto.price.toFixed(2)}</span>
                  <span className="bg-slate-100 px-3 py-2 rounded-full">Duración: {producto.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-4">Reservar producto</h2>
          <form onSubmit={createReservation} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Producto</label>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50">
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>{producto.name} ({producto.stock} en stock)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Cantidad</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50" />
            </div>
            <button type="submit" className="w-full px-6 py-3 bg-[#0077B6] text-white rounded-xl hover:bg-[#005f92]">Reservar ahora</button>
            {message && <p className="text-sm text-green-700 font-medium">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function TuristaReservas({ reservas, currentUser, setProductos, setReservas, productos }: { reservas: Reserva[]; currentUser: User; setProductos: React.Dispatch<React.SetStateAction<Producto[]>>; setReservas: React.Dispatch<React.SetStateAction<Reserva[]>>; productos: Producto[] }) {
  const myReservations = reservas.filter((reserva) => reserva.userId === currentUser.id);

  const cancelReservation = (reservaId: number) => {
    const reserva = reservas.find((r) => r.id === reservaId);
    if (!reserva || reserva.status === 'cancelada') return;
    if (!window.confirm('¿Deseas cancelar esta reserva?')) return;

    setReservas(reservas.map((r) => r.id === reservaId ? { ...r, status: 'cancelada' } : r));
    if (reserva.productId) {
      setProductos(productos.map((producto) =>
        producto.id === reserva.productId
          ? { ...producto, stock: producto.stock + reserva.quantity, reserved: Math.max(0, producto.reserved - reserva.quantity) }
          : producto
      ));
  }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis reservas</h1>
          <p className="text-gray-600">Consulta tus compras, fechas y estados de reserva.</p>
        </div>
      </div>
      {myReservations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          <Icon name="info" className="text-4xl mb-4 text-[#0077B6]" />
          <p>No tienes reservas activas aún. Ve al catálogo y reserva tu primera experiencia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myReservations.map((reserva) => (
            <div key={reserva.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{reserva.productName}</h2>
                  <p className="text-sm text-gray-500">Reservado el {reserva.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">Cantidad: {reserva.quantity}</p>
                  <p className="text-sm text-gray-500">Estado: <span className={`font-semibold ${reserva.status === 'confirmada' ? 'text-green-700' : 'text-red-600'}`}>{reserva.status}</span></p>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {reserva.customerName && <p className="text-sm text-gray-600">Cliente: {reserva.customerName}</p>}
                {reserva.status === 'confirmada' && (
                  <button onClick={() => cancelReservation(reserva.id)} className="self-start px-5 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">Cancelar reserva</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type OpenMeteoForecast = {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_mean: number[];
    weathercode: number[];
  };
};

function TuristaClima() {
  const defaultCenter = { lat: -16.4940, lng: -68.1474 };
  const [position, setPosition] = useState(defaultCenter);
  const [weatherInfo, setWeatherInfo] = useState<OpenMeteoForecast | null>(null);
  const [locationLabel, setLocationLabel] = useState('La Paz, Bolivia');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [markerUpdateKey, setMarkerUpdateKey] = useState(0);

  const weatherEmoji = (code: number) => {
    const icons: Record<number, string> = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌧️', 55: '🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '❄️', 73: '❄️',
      75: '❄️', 77: '❄️', 80: '🌦️', 81: '🌧️', 82: '🌧️',
      85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return icons[code] ?? '🌡️';
  };

  const weatherDescription = (code: number) => {
    const descriptions: Record<number, string> = {
      0: 'Despejado', 1: 'Poco nublado', 2: 'Parcialmente nublado', 3: 'Nublado',
      45: 'Niebla', 48: 'Bruma', 51: 'Llovizna ligera', 53: 'Lluvia ligera', 55: 'Lluvia moderada',
      61: 'Lluvia', 63: 'Lluvia fuerte', 65: 'Lluvia intensa', 71: 'Nieve ligera',
      73: 'Nieve moderada', 75: 'Nieve intensa', 77: 'Aguanieve', 80: 'Lluvias aisladas',
      81: 'Lluvias frecuentes', 82: 'Lluvias fuertes', 85: 'Chubascos de nieve',
      86: 'Tormenta de nieve', 95: 'Tormenta eléctrica', 96: 'Tormenta con granizo', 99: 'Tormenta severa'
    };
    return descriptions[code] ?? 'Condiciones variables';
  };

  const fetchWeather = async (lat: number, lng: number) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto&forecast_days=5`;
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        throw new Error(`API clima respondió con ${response.status}`);
      }
      const data = (await response.json()) as OpenMeteoForecast;
      if (!data.current_weather || !data.daily) {
        throw new Error('Respuesta incompleta del servicio meteorológico');
      }
      setWeatherInfo(data);

      try {
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const reverseResponse = await fetch(reverseUrl);
        if (reverseResponse.ok) {
          const reverseData = await reverseResponse.json();
          const label = reverseData.address?.city || reverseData.address?.town || reverseData.address?.village || reverseData.display_name?.split(',')[0];
          if (label) setLocationLabel(label);
        }
      } catch {
        // Ignorar errores de geocodificación
      }

      setStatus('ready');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.message ?? 'No se pudo cargar el clima.');
      setWeatherInfo(null);
    }
  };

  useEffect(() => {
    fetchWeather(position.lat, position.lng);
  }, [position]);

  const handleMapClick = (event: any) => {
    const { lat, lng } = event.latlng;
    setPosition({ lat, lng });
    setMarkerUpdateKey((key) => key + 1);
  };

  const ForecastMarker = () => {
    useMapEvents({ click: handleMapClick });
    return null;
  };

  const current = weatherInfo?.current_weather;
  const daily = weatherInfo?.daily;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Clima Interactivo con Mapa</h2>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Haz clic en cualquier lugar del mapa para consultar el clima y el pronóstico de los próximos días. Los datos se obtienen desde Open-Meteo y la ubicación se resuelve con OpenStreetMap.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white">
          <MapContainer center={[position.lat, position.lng]} zoom={11} className="h-[440px] w-full" scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker key={markerUpdateKey} position={[position.lat, position.lng]}>
              <Popup>{locationLabel}</Popup>
            </Marker>
            <ForecastMarker />
          </MapContainer>
          <div className="p-5 border-t border-gray-100 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Coordenadas seleccionadas</p>
                <p className="font-semibold text-gray-900">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
              </div>
              <p className="text-sm text-gray-600">Haz clic en el mapa para actualizar el clima</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-8 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Ubicación</p>
                <h3 className="mt-2 text-2xl font-bold">{locationLabel}</h3>
              </div>
              <div className="text-5xl">{current ? weatherEmoji(current.weathercode) : '🌦️'}</div>
            </div>

            {status === 'loading' && (
              <div className="mt-8 rounded-3xl bg-white/10 p-5 text-slate-100">
                <p>Cargando clima...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-8 rounded-3xl bg-red-500/10 border border-red-400 p-5 text-red-900">
                <p className="font-semibold">No se pudo cargar el clima</p>
                <p className="mt-2 text-sm">{errorMessage}</p>
              </div>
            )}

            {status === 'ready' && current && (
              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">Condición</p>
                  <p className="mt-2 text-2xl font-semibold">{weatherDescription(current.weathercode)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm text-slate-300">Temperatura</p>
                    <p className="mt-2 text-3xl font-semibold">{Math.round(current.temperature)}°C</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm text-slate-300">Viento</p>
                    <p className="mt-2 text-3xl font-semibold">{Math.round(current.windspeed)} km/h</p>
                    <p className="text-sm text-slate-300">Dirección {Math.round(current.winddirection)}°</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-[0.24em]">Pronóstico</p>
                <h3 className="text-2xl font-bold text-gray-900">Próximos días</h3>
              </div>
            </div>

            {status === 'ready' && daily ? (
              <div className="space-y-3">
                {daily.time.map((day, index) => {
                  const date = new Date(day);
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                    <div key={day} className="flex items-center justify-between rounded-3xl border border-slate-200 p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{dayName}</p>
                        <p className="text-sm text-gray-500">{weatherDescription(daily.weathercode[index])}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{Math.round(daily.temperature_2m_max[index])}° / <span className="text-slate-500">{Math.round(daily.temperature_2m_min[index])}°</span></p>
                        <p className="text-sm text-slate-500">{daily.precipitation_probability_mean[index]}% lluvia</p>
                      </div>
                      <div className="text-2xl">{weatherEmoji(daily.weathercode[index])}</div>
                    </div>
                  );
                })}
              </div>
            ) : status === 'loading' ? (
              <p className="text-sm text-gray-500">Cargando pronóstico...</p>
            ) : (
              <p className="text-sm text-gray-500">Selecciona un punto en el mapa para ver el pronóstico.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-blue-50 border border-blue-100 p-6 text-blue-900">
        <h3 className="text-xl font-bold mb-3">Consejos rápidos</h3>
        <ul className="space-y-2 text-sm leading-6">
          <li>• Usa capas ligeras y ropa por capas porque el clima puede cambiar rápido en La Paz.</li>
          <li>• Consulta el mapa y el pronóstico antes de salir a zonas altas o rutas de aventura.</li>
          <li>• El sol es intenso en altura aunque la temperatura sea fresca, protege tu piel.</li>
          <li>• Si hay probabilidad de lluvia, lleva un impermeable ligero y calzado adecuado.</li>
        </ul>
      </div>
    </div>
  );
}

function TuristaAlertas() {
  const [notifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('chuquiago360_notifications');
    return saved ? JSON.parse(saved) as Notification[] : MOCK_NOTIFICATIONS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<Notification['severity'] | 'todos'>('todos');

  const publicSecurityAlerts = notifications.filter(n => n.type === 'seguridad' && n.isGlobal);
  const filteredAlerts = publicSecurityAlerts.filter((notification) => {
    const matchesSeverity = filterSeverity === 'todos' || notification.severity === filterSeverity;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alta': return 'red';
      case 'media': return 'orange';
      case 'baja': return 'blue';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'seguridad' ? 'warning' : 'notifications';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Alertas de Seguridad</h2>
          <p className="text-gray-600">Visualiza las alertas de seguridad públicas disponibles para turistas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar alertas..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50"
            />
          </div>
          <div>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as Notification['severity'] | 'todos')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50">
              <option value="todos">Todas las severidades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map(notification => (
            <div key={notification.id} className={`bg-${getSeverityColor(notification.severity)}-50 border-l-4 border-${getSeverityColor(notification.severity)}-500 p-5 rounded-r-xl flex gap-4 items-start`}>
              <Icon name={getTypeIcon(notification.type)} className={`text-${getSeverityColor(notification.severity)}-500 text-3xl shrink-0`} />
              <div>
                <h3 className={`font-bold text-${getSeverityColor(notification.severity)}-800 text-lg mb-1`}>{notification.title}</h3>
                <p className={`text-${getSeverityColor(notification.severity)}-600 mb-2`}>{notification.message}</p>
                <p className="text-sm text-gray-500">Publicada el {notification.createdAt}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Icon name="notifications_off" className="text-6xl mb-4" />
          <p>No hay alertas de seguridad públicas disponibles.</p>
        </div>
      )}
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

function OperadorInicio({ productos, reservas }: { productos: Producto[]; reservas: Reserva[] }) {
  const lowStockCount = productos.filter((producto) => producto.stock < 5).length;
  const totalProducts = productos.length;
  const totalReserved = reservas.reduce((acc, reserva) => acc + reserva.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel del Operador</h1>
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 uppercase mb-3">Productos en catálogo</p>
          <p className="text-4xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 uppercase mb-3">Reservas registradas</p>
          <p className="text-4xl font-bold text-gray-900">{totalReserved}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 uppercase mb-3">Productos con stock bajo</p>
          <p className="text-4xl font-bold text-red-600">{lowStockCount}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Resumen operativo</h2>
        <p className="text-gray-600 leading-relaxed">
          Supervisa el catálogo, actualiza inventario y atiende reservas para mantener la oferta turística actualizada y disponible.
        </p>
      </div>
    </div>
  );
}

function OperadorCatalogo({ productos, setProductos }: { productos: Producto[]; setProductos: React.Dispatch<React.SetStateAction<Producto[]>> }) {
  const [isEditing, setIsEditing] = useState<Producto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'Experiencia', price: 0, duration: '', stock: 0 });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: isEditing.name,
        description: isEditing.description,
        category: isEditing.category,
        price: isEditing.price,
        duration: isEditing.duration,
        stock: isEditing.stock,
      });
    } else {
      setFormData({ name: '', description: '', category: 'Experiencia', price: 0, duration: '', stock: 0 });
    }
  }, [isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      window.alert('Nombre y descripción son obligatorios.');
      return;
    }
    if (isEditing) {
      setProductos(productos.map((producto) => producto.id === isEditing.id ? {
        ...producto,
        ...formData,
      } : producto));
      setIsEditing(null);
    } else {
      const nextId = Math.max(0, ...productos.map((producto) => producto.id)) + 1;
      setProductos([...productos, { id: nextId, reserved: 0, ...formData }]);
    }
    setShowForm(false);
  };

  const handleEdit = (producto: Producto) => {
    setIsEditing(producto);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar este producto de catálogo?')) {
      setProductos(productos.filter((producto) => producto.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-600">Administra tours y souvenirs registrados en el sistema.</p>
        </div>
        <button onClick={() => { setShowForm(true); setIsEditing(null); }} className="inline-flex items-center gap-2 px-5 py-3 bg-[#0077B6] text-white rounded-xl hover:bg-[#005f92] transition-colors">
          <Icon name="add" /> Agregar producto
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Editar producto' : 'Nuevo producto'}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-2">Nombre</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded-xl bg-gray-50" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Categoría</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full p-3 border rounded-xl bg-gray-50">
                <option>Experiencia</option>
                <option>Souvenir</option>
                <option>Servicio</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Descripción</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full p-3 border rounded-xl bg-gray-50" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Precio (USD)</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full p-3 border rounded-xl bg-gray-50" min={0} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Duración</label>
              <input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full p-3 border rounded-xl bg-gray-50" placeholder="Ej. 4h, N/A" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Stock</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full p-3 border rounded-xl bg-gray-50" min={0} />
            </div>
            <div className="md:col-span-2 flex gap-3 mt-2">
              <button type="submit" className="px-6 py-3 bg-[#2D6A4F] text-white rounded-xl">Guardar</button>
              <button type="button" onClick={() => { setShowForm(false); setIsEditing(null); }} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-3xl shadow-sm border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Producto</th>
              <th className="p-4 font-semibold text-gray-600">Categoría</th>
              <th className="p-4 font-semibold text-gray-600">Precio</th>
              <th className="p-4 font-semibold text-gray-600">Duración</th>
              <th className="p-4 font-semibold text-gray-600">Stock</th>
              <th className="p-4 font-semibold text-gray-600">Reservado</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-900">{producto.name}</td>
                <td className="p-4 text-gray-600">{producto.category}</td>
                <td className="p-4 text-gray-600">${producto.price.toFixed(2)}</td>
                <td className="p-4 text-gray-600">{producto.duration}</td>
                <td className={`p-4 font-semibold ${producto.stock < 5 ? 'text-red-600' : 'text-green-700'}`}>{producto.stock}</td>
                <td className="p-4 text-gray-600">{producto.reserved}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(producto)} className="px-3 py-2 bg-blue-50 text-[#0077B6] rounded-xl hover:bg-blue-100">Editar</button>
                  <button onClick={() => handleDelete(producto.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">Eliminar</button>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay productos en el catálogo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OperadorInventario({ productos, setProductos }: { productos: Producto[]; setProductos: React.Dispatch<React.SetStateAction<Producto[]>> }) {
  const adjustStock = (id: number, delta: number) => {
    setProductos(productos.map((producto) => producto.id === id ? { ...producto, stock: Math.max(0, producto.stock + delta) } : producto));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Ajusta el stock de cada producto y monitorea disponibilidad inmediata.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Producto</th>
              <th className="p-4 font-semibold text-gray-600">Stock</th>
              <th className="p-4 font-semibold text-gray-600">Disponibilidad</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Ajustes</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-900">{producto.name}</td>
                <td className={`p-4 font-bold ${producto.stock < 5 ? 'text-red-600' : 'text-green-700'}`}>{producto.stock}</td>
                <td className="p-4 text-gray-600">{producto.stock > 0 ? 'Disponible' : 'Agotado'}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => adjustStock(producto.id, 1)} className="px-3 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100">+1</button>
                  <button onClick={() => adjustStock(producto.id, -1)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">-1</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OperadorReservas({ productos, reservas, setReservas, setProductos }: { productos: Producto[]; reservas: Reserva[]; setReservas: React.Dispatch<React.SetStateAction<Reserva[]>>; setProductos: React.Dispatch<React.SetStateAction<Producto[]>> }) {
  const [productId, setProductId] = useState(productos[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const selectedProduct = productos.find((producto) => producto.id === productId);

  const createReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity < 1) {
      window.alert('La cantidad debe ser al menos 1.');
      return;
    }
    if (selectedProduct.stock < quantity) {
      window.alert('No hay stock suficiente para esta reserva.');
      return;
    }
    setProductos(productos.map((producto) => producto.id === selectedProduct.id ? { ...producto, stock: producto.stock - quantity, reserved: producto.reserved + quantity } : producto));
    const newReservation: Reserva = {
      id: reservas.length > 0 ? Math.max(...reservas.map((r) => r.id)) + 1 : 1,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      date: new Date().toISOString().split('T')[0],
      status: 'confirmada',
      customerName: 'Operador',
    };
    setReservas([newReservation, ...reservas]);
    setQuantity(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600">Registra nuevas reservas y monitorea su impacto en el stock.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-4">Registrar reserva</h2>
          <form onSubmit={createReservation} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Producto</label>
              <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50">
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>{producto.name} ({producto.stock} en stock)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Cantidad</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} className="w-full p-3 border rounded-xl bg-gray-50" />
            </div>
            <button type="submit" className="w-full px-6 py-3 bg-[#0077B6] text-white rounded-xl hover:bg-[#005f92]">Registrar reserva</button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="text-2xl font-bold mb-4">Últimas reservas</h2>
          {reservas.length === 0 ? (
            <p className="text-gray-500">No se han registrado reservas aún.</p>
          ) : (
            <div className="space-y-4">
              {reservas.slice(0, 5).map((reserva) => (
                <div key={reserva.id} className="rounded-3xl border border-gray-200 p-4 bg-gray-50">
                  <p className="font-semibold text-gray-900">{reserva.productName}</p>
                  <p className="text-gray-600">Cantidad: {reserva.quantity}</p>
                  <p className="text-sm text-gray-500">Fecha: {reserva.date}</p>
                  <p className="text-sm text-green-700 font-semibold">{reserva.status}</p>
                </div>
              ))}
            </div>
          )}
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
      failedLoginAttempts: 0,
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
    setUsers(users.map(u => {
      if (u.id !== id) return u;
      const nextStatus = u.status === 'activo' ? 'inactivo' : 'activo';
      return { ...u, status: nextStatus };
    }));
  };

  const changeRole = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const roles: User['role'][] = ['Turista', 'Administrador', 'Operador'];
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
    const exportFileDefaultName = `usuarios_chuquiago360_${new Date().toISOString().split('T')[0]}.json`;
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
    const saved = localStorage.getItem('chuquiago360_notifications');
    const notifications: Notification[] = saved ? JSON.parse(saved) as Notification[] : [];
    const maxId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) : 0;
    const welcomeNotification: Notification = {
      id: maxId + 1,
      title: `¡Bienvenido a Chuquiago360, ${user.name}!`,
      message: `Tu cuenta ha sido creada exitosamente. Explora los mejores destinos turísticos de La Paz.`,
      type: 'bienvenida',
      severity: 'baja',
      createdAt: new Date().toISOString().split('T')[0],
      isGlobal: false,
      targetUsers: [user.id],
      isRead: false
    };
    notifications.push(welcomeNotification);
    localStorage.setItem('chuquiago360_notifications', JSON.stringify(notifications));
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
              <option value="Operador">Operador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Estado</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'todos')} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0077B6] outline-none">
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="bloqueado">Bloqueado</option>
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
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'Administrador' ? 'bg-purple-100 text-purple-700' : u.role === 'Operador' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.status === 'activo' ? 'bg-green-100 text-green-700' : u.status === 'bloqueado' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
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
                <option value="Operador">Operador</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50 focus:bg-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="bloqueado">Bloqueado</option>
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
    const saved = localStorage.getItem('chuquiago360_notifications');
    if (saved) {
      const parsed = JSON.parse(saved) as Notification[];
      return parsed.length > 0 ? parsed : MOCK_NOTIFICATIONS;
    }
    return MOCK_NOTIFICATIONS;
  });
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<Notification['type'] | 'todos'>('seguridad');
  const [filterSeverity, setFilterSeverity] = useState<Notification['severity'] | 'todos'>('todos');
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    localStorage.setItem('chuquiago360_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'todos' || notification.type === filterType;
    const matchesSeverity = filterSeverity === 'todos' || notification.severity === filterSeverity;
    return matchesType && matchesSeverity;
  });

  const handleAddNotification = (newNotification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      window.alert('El título y la descripción son obligatorios.');
      return;
    }
    if (!newNotification.isGlobal && (!newNotification.targetRoles || newNotification.targetRoles.length === 0)) {
      window.alert('Selecciona al menos un rol destinatario si no es una notificación global.');
      return;
    }
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
    if (!updatedNotification.title.trim() || !updatedNotification.message.trim()) {
      window.alert('El título y la descripción son obligatorios.');
      return;
    }
    if (!updatedNotification.isGlobal && (!updatedNotification.targetRoles || updatedNotification.targetRoles.length === 0)) {
      window.alert('Selecciona al menos un rol destinatario si no es una notificación global.');
      return;
    }
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
      localStorage.setItem('chuquiago360_notifications', JSON.stringify(MOCK_NOTIFICATIONS));
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
    targetRoles: notification?.targetRoles ?? ['Turista', 'Operador', 'Administrador'],
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('El título y la descripción son obligatorios.');
      return;
    }
    if (!formData.isGlobal && formData.targetRoles.length === 0) {
      setError('Selecciona al menos un rol destinatario si la notificación no es global.');
      return;
    }
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
            {!formData.isGlobal && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destinatarios</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {['Turista', 'Operador', 'Administrador'].map((role) => (
                    <label key={role} className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.targetRoles.includes(role as 'Turista' | 'Operador' | 'Administrador')}
                        onChange={(e) => {
                          const roleValue = role as 'Turista' | 'Operador' | 'Administrador';
                          if (e.target.checked) {
                            setFormData({ ...formData, targetRoles: [...formData.targetRoles, roleValue] });
                          } else {
                            setFormData({ ...formData, targetRoles: formData.targetRoles.filter(r => r !== roleValue) });
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
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

function OperadorNotificaciones({ users }: { users: User[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('chuquiago360_notifications');
    const parsed = saved ? JSON.parse(saved) as Notification[] : MOCK_NOTIFICATIONS;
    return parsed.filter(n => n.type !== 'seguridad');
  });
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<Notification['type'] | 'todos'>('todos');
  const [filterSeverity, setFilterSeverity] = useState<Notification['severity'] | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const allSaved = localStorage.getItem('chuquiago360_notifications');
    const parsed = allSaved ? JSON.parse(allSaved) as Notification[] : MOCK_NOTIFICATIONS;
    const informative = parsed.filter(n => n.type !== 'seguridad');
    setNotifications(informative);
  }, []);

  useEffect(() => {
    const allSaved = localStorage.getItem('chuquiago360_notifications');
    const parsed = allSaved ? JSON.parse(allSaved) as Notification[] : MOCK_NOTIFICATIONS;
    const updated = parsed.filter(n => n.type !== 'seguridad');
    localStorage.setItem('chuquiago360_notifications', JSON.stringify([...parsed.filter(n => n.type === 'seguridad'), ...updated]));
  }, [notifications]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'todos' || notification.type === filterType;
    const matchesSeverity = filterSeverity === 'todos' || notification.severity === filterSeverity;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSeverity && matchesSearch;
  });

  const handleAddNotification = (newNotification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      window.alert('El título y la descripción son obligatorios.');
      return;
    }
    if (!newNotification.isGlobal && (!newNotification.targetRoles || newNotification.targetRoles.length === 0)) {
      window.alert('Selecciona al menos un rol destinatario si no es una notificación global.');
      return;
    }

    const allSaved = localStorage.getItem('chuquiago360_notifications');
    const parsed = allSaved ? JSON.parse(allSaved) as Notification[] : MOCK_NOTIFICATIONS;
    const maxId = parsed.length > 0 ? Math.max(...parsed.map(n => n.id)) : 0;
    const notification: Notification = {
      ...newNotification,
      id: maxId + 1,
      createdAt: new Date().toISOString().split('T')[0],
      sentCount: 0
    };
    const updated = [...notifications, notification];
    setNotifications(updated);
    setShowAddForm(false);
    localStorage.setItem('chuquiago360_notifications', JSON.stringify([...parsed, notification]));
  };

  const handleEditNotification = (updatedNotification: Notification) => {
    if (!updatedNotification.title.trim() || !updatedNotification.message.trim()) {
      window.alert('El título y la descripción son obligatorios.');
      return;
    }
    if (!updatedNotification.isGlobal && (!updatedNotification.targetRoles || updatedNotification.targetRoles.length === 0)) {
      window.alert('Selecciona al menos un rol destinatario si no es una notificación global.');
      return;
    }

    const updatedNotifications = notifications.map(n => n.id === updatedNotification.id ? updatedNotification : n);
    setNotifications(updatedNotifications);
    setEditingNotification(null);

    const allSaved = localStorage.getItem('chuquiago360_notifications');
    const parsed = allSaved ? JSON.parse(allSaved) as Notification[] : MOCK_NOTIFICATIONS;
    localStorage.setItem('chuquiago360_notifications', JSON.stringify(parsed.map(n => n.id === updatedNotification.id ? updatedNotification : n)));
  };

  const handleDeleteNotification = (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta notificación?')) return;
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    const allSaved = localStorage.getItem('chuquiago360_notifications');
    const parsed = allSaved ? JSON.parse(allSaved) as Notification[] : MOCK_NOTIFICATIONS;
    localStorage.setItem('chuquiago360_notifications', JSON.stringify(parsed.filter(n => n.id !== id)));
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
      case 'promocion': return 'local_offer';
      case 'recordatorio': return 'schedule';
      case 'bienvenida': return 'celebration';
      case 'sistema': return 'settings';
      default: return 'notifications';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Notificaciones Informativas</h2>
          <p className="text-gray-600">Gestiona notificaciones dirigidas a usuarios según roles.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-[#0077B6] text-white rounded-xl font-semibold hover:bg-[#005f92] transition-colors flex items-center gap-2">
          <Icon name="add" /> Crear notificación
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar notificaciones..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as Notification['type'] | 'todos')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50">
            <option value="todos">Todos los tipos</option>
            <option value="promocion">Promoción</option>
            <option value="recordatorio">Recordatorio</option>
            <option value="bienvenida">Bienvenida</option>
            <option value="sistema">Sistema</option>
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as Notification['severity'] | 'todos')} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077B6] outline-none bg-gray-50">
            <option value="todos">Todas las severidades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {showAddForm && <NotificationForm notification={null} onSave={handleAddNotification} onCancel={() => setShowAddForm(false)} />}
      {editingNotification && <NotificationForm notification={editingNotification} onSave={handleEditNotification} onCancel={() => setEditingNotification(null)} />}

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-3xl shadow-sm border border-gray-100">
          <Icon name="notifications_off" className="text-6xl mb-4" />
          <p>No hay notificaciones informativas disponibles.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <div key={notification.id} className={`bg-${getSeverityColor(notification.severity)}-50 border-l-4 border-${getSeverityColor(notification.severity)}-500 p-5 rounded-r-xl`}> 
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <Icon name={getTypeIcon(notification.type)} className={`text-${getSeverityColor(notification.severity)}-500 text-3xl shrink-0 mt-1`} />
                  <div>
                    <h3 className={`font-bold text-${getSeverityColor(notification.severity)}-800 text-lg mb-1`}>{notification.title}</h3>
                    <p className={`text-${getSeverityColor(notification.severity)}-600`}>{notification.message}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>Tipo: {notification.type}</span>
                      <span>Severidad: {notification.severity}</span>
                      <span>{notification.isGlobal ? 'Global' : `Roles: ${notification.targetRoles?.join(', ') ?? 'N/A'}`}</span>
                      <span>Creada: {notification.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingNotification(notification)} className="text-[#0077B6] hover:bg-blue-50 p-2 rounded-lg transition-colors"><Icon name="edit" /></button>
                  <button onClick={() => handleDeleteNotification(notification.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Icon name="delete" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminReportes() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-in fade-in">
      <h2 className="text-3xl font-bold mb-8">Reportes y Métricas</h2>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6">Visitas por Zona de La Paz (Simulado)</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">Centro Histórico</span><span className="text-gray-500">45%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-[#0077B6] h-4 rounded-full" style={{ width: '45%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">Zona Sur y Miradores</span><span className="text-gray-500">30%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-[#2D6A4F] h-4 rounded-full" style={{ width: '30%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-2"><span className="font-semibold">El Alto y Altiplano</span><span className="text-gray-500">25%</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-orange-500 h-4 rounded-full" style={{ width: '25%' }}></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}