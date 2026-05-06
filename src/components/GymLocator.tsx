import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Loader2, Navigation, Info, Dumbbell, Phone } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Gym Icon
const gymIcon = L.divIcon({
  className: 'custom-gym-icon',
  html: `<div class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m11.8 5.8 5.2-1.2"/><path d="m5.8 11.8-1.2 5.2"/><path d="M10 2.5 12.5 5l-2.5 2.5"/><path d="M16.5 9 19 11.5l-2.5 2.5"/><path d="M7.5 16.5 5 19l-2.5-2.5"/><path d="M9 16.5 11.5 19l-2.5 2.5"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function GymLocator() {
  const [addressQuery, setAddressQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number]>([-23.5505, -46.6333]); // Default SP
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  // Function to search for an address (Geocoding via Nominatim)
  const searchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addressQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FitAI-App/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Nominatim returned non-json response');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLoc: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setUserLocation(newLoc);
        setHasLocation(true);
        searchGyms(newLoc[0], newLoc[1]);
      } else {
        alert('Endereço não encontrado. Tente buscar por Cidade ou Bairro.');
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to search gyms using Overpass API (OpenStreetMap)
  const searchGyms = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // Overpass QL query: find amenities related to fitness within 5000m
      const query = `
        [out:json];
        (
          node["leisure"="fitness_centre"](around:5000, ${lat}, ${lng});
          way["leisure"="fitness_centre"](around:5000, ${lat}, ${lng});
          node["amenity"="gym"](around:5000, ${lat}, ${lng});
        );
        out center;
      `;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Overpass API returned non-json response');
      }

      const data = await response.json();
      setGyms(data.elements || []);
    } catch (err) {
      console.error("OpenStreetMap Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Seu navegador não suporta geolocalização. Use a busca manual.');
      return;
    }

    setLoading(true);
    
    // Safety timeout for the UI
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Geolocation UI timeout");
        setLoading(false);
      }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newLoc);
        setHasLocation(true);
        searchGyms(newLoc[0], newLoc[1]);
        setLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("Geolocation error:", error);
        
        // Don't show redundant alerts, just fallback to current location (default SP or last search)
        if (error.code === 1) {
          console.warn("Permission denied for GPS. Falling back to manual search.");
        }
        
        searchGyms(userLocation[0], userLocation[1]);
        setLoading(false);
      },
      { 
        enableHighAccuracy: false, // More reliable in many browsers/devices
        timeout: 8000, 
        maximumAge: 60000 
      }
    );
  };

  // Initial load
  useEffect(() => {
    requestLocation();
  }, []);

  // Filter gyms by name if user types something
  const filteredGyms = filterQuery 
    ? gyms.filter(g => (g.tags?.name || 'Academia').toLowerCase().includes(filterQuery.toLowerCase()))
    : gyms;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Address Search */}
        <form 
          onSubmit={searchAddress}
          className="lg:col-span-2 relative flex items-center"
        >
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
          <input 
            type="text"
            placeholder="Digite cidade, bairro ou endereço..."
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
            className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-28 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black dark:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </button>
        </form>

        {/* GPS Button */}
        <button 
          onClick={requestLocation}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-4 rounded-2xl font-black italic tracking-tighter text-sm flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />} 
          USAR MEU GPS ATUAL
        </button>
      </div>

      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text"
          placeholder="Filtrar academias no mapa por nome..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-1 focus:ring-purple-500 transition-all"
        />
      </div>

      <div className="relative h-[65vh] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl bg-gray-100 dark:bg-zinc-900 z-0">
        <MapContainer 
          center={userLocation} 
          zoom={14} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className={window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-map-tiles' : ''}
          />
          
          <MapUpdater center={userLocation} />

          {hasLocation && (
            <Marker position={userLocation}>
              <Popup>Você está aqui</Popup>
            </Marker>
          )}

          {filteredGyms.map((gym, idx) => {
            const pos: [number, number] = gym.center ? [gym.center.lat, gym.center.lon] : [gym.lat, gym.lon];
            const tags = gym.tags || {};
            const name = tags.name || 'Academia';
            const phone = tags.phone || tags['contact:phone'] || tags.mobile || 'Não informado';
            
            // Detect partners based on names, descriptions or specific tags
            const partnerText = [
              tags.network,
              tags.brand,
              tags.description,
              tags.note,
              name
            ].join(' ').toLowerCase();

            const detectedPartners = [];
            if (partnerText.includes('gympass') || partnerText.includes('wellhub')) detectedPartners.push('Wellhub (Gympass)');
            if (partnerText.includes('totalpass')) detectedPartners.push('TotalPass');
            if (partnerText.includes('gynpass') || partnerText.includes('convenio')) detectedPartners.push('GynPASS / Convênios');

            return (
              <Marker key={idx} position={pos} icon={gymIcon}>
                <Popup>
                  <div className="p-3 min-w-[200px] dark:text-black">
                    <h3 className="font-extrabold text-base mb-1 text-purple-700 leading-tight">{name}</h3>
                    
                    <div className="space-y-2 mt-3">
                      <div className="flex items-start gap-2">
                         <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                         <p className="text-[11px] text-gray-600 font-medium">
                            {tags['addr:street'] ? `${tags['addr:street']}, ${tags['addr:housenumber'] || ''}` : 'Endereço disponível no mapa'}
                         </p>
                      </div>

                      <div className="flex items-center gap-2">
                         <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                         <p className="text-[11px] text-gray-600 font-bold">{phone}</p>
                      </div>

                      {detectedPartners.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {detectedPartners.map(p => (
                            <span key={p} className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {!detectedPartners.length && (
                        <p className="text-[9px] text-gray-400 italic">Consulte sobre convênios diretamente no local.</p>
                      )}
                    </div>

                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}`)}
                      className="w-full mt-4 bg-purple-600 text-white text-[10px] font-black py-2.5 rounded-xl uppercase tracking-widest text-center shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                    >
                      Traçar Rota no Google Maps
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-black px-4 py-2 rounded-full shadow-xl border border-white/10 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Buscando Academias...</span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1.5 rounded-lg border border-black/5 flex items-center gap-2">
           <Info className="w-3.5 h-3.5 text-green-500" />
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Mapa Gratuito (OSM)</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">
          Resultados via Overpass API em um raio de 5km
        </p>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 bg-purple-600 rounded-full border border-white" />
             <span className="text-[10px] text-gray-500 font-bold uppercase">Academia</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 bg-blue-500 rounded-full border border-white" />
             <span className="text-[10px] text-gray-500 font-bold uppercase">Sua Posição</span>
           </div>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          background: #f3f4f6 !important;
        }
        .dark-map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>
    </div>
  );
}
