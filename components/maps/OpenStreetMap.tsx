'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Locate, ThermometerSun, Settings2, RotateCcw, BarChart3, Layers, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Recharts
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
} from 'recharts';

const createCustomIcon = (isDark: boolean) => {
    const color = isDark ? '#10b981' : '#059669';
    return new L.DivIcon({
        className: 'custom-marker',
        html: `
      <svg width="42" height="48" viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 4C12.163 4 5 11.163 5 20C5 28.837 12.5 38 21 44C29.5 38 37 28.837 37 20C37 11.163 29.837 4 21 4Z" 
              fill="${color}" stroke="white" stroke-width="4"/>
        <circle cx="21" cy="20" r="8" fill="white"/>
      </svg>
    `,
        iconSize: [42, 48],
        iconAnchor: [21, 48],
        popupAnchor: [0, -48],
    });
};

// Улучшенные тайлы с высоким разрешением
const MAP_TILES = {
    light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    light_hd: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    satellite_hd: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
};

const DEFAULT_HEAT_CONFIG = { radius: 45, blur: 35, max: 90 };
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

// Кастомный компонент ползунка
function CustomSlider({ value, onChange, min, max, step, isDark }: any) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="relative w-full">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, ${isDark ? '#374151' : '#e5e7eb'} ${percentage}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`
                }}
            />
            <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                }
            `}</style>
        </div>
    );
}

export default function OpenStreetMap({ isDarkProp }: { isDarkProp?: boolean }) {
    // Определяем тему из пропса или из класса на document
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Проверяем темную тему по классу на html элементе
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };

        checkTheme();

        // Следим за изменениями темы
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const [points, setPoints] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);
    const [newPoint, setNewPoint] = useState({ name: '', co2: 25 });
    const [currentTile, setCurrentTile] = useState<'light' | 'light_hd' | 'dark' | 'satellite' | 'satellite_hd'>('light_hd');
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [heatConfig, setHeatConfig] = useState(DEFAULT_HEAT_CONFIG);
    const [showHeatSettings, setShowHeatSettings] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [mapQuality, setMapQuality] = useState<'high' | 'ultra'>('high');

    const mapRef = useRef<any>(null);
    const heatLayerRef = useRef<any>(null);

    // Загрузка настроек
    useEffect(() => {
        const saved = localStorage.getItem('heatmapConfig');
        if (saved) setHeatConfig(JSON.parse(saved));

        const savedQuality = localStorage.getItem('mapQuality');
        if (savedQuality === 'ultra') setMapQuality('ultra');
    }, []);

    useEffect(() => {
        if (isDark) {
            setCurrentTile('dark');
        } else {
            setCurrentTile(mapQuality === 'ultra' ? 'light_hd' : 'light');
        }
    }, [isDark, mapQuality]);

    useEffect(() => {
        loadUserPoints();
    }, []);

    const toggleMapQuality = () => {
        const newQuality = mapQuality === 'high' ? 'ultra' : 'high';
        setMapQuality(newQuality);
        localStorage.setItem('mapQuality', newQuality);
    };

    const loadUserPoints = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('user_map_points')
            .select('*')
            .eq('user_id', user.id);

        setPoints(data || []);
    };

    const saveConfig = (config: typeof heatConfig) => {
        setHeatConfig(config);
        localStorage.setItem('heatmapConfig', JSON.stringify(config));
        setTimeout(() => updateHeatmap(), 50);
    };

    const resetHeatConfig = () => {
        setHeatConfig(DEFAULT_HEAT_CONFIG);
        localStorage.setItem('heatmapConfig', JSON.stringify(DEFAULT_HEAT_CONFIG));
        setTimeout(() => updateHeatmap(), 50);
    };

    const updateHeatmap = useCallback(() => {
        if (!mapRef.current) return;

        if (heatLayerRef.current) {
            mapRef.current.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        if (showHeatmap && points.length > 0) {
            const heatData = points.map(p => [p.lat, p.lng, p.co2_estimate || 40]);
            heatLayerRef.current = (L as any).heatLayer(heatData, {
                radius: heatConfig.radius,
                blur: heatConfig.blur,
                max: heatConfig.max,
                gradient: {
                    0.0: '#2ecc71',
                    0.3: '#f1c40f',
                    0.5: '#f39c12',
                    0.7: '#e67e22',
                    0.9: '#ef4444',
                    1.0: '#b91c1c'
                },
                minOpacity: 0.35,
            }).addTo(mapRef.current);
        }
    }, [points, showHeatmap, heatConfig]);

    useEffect(() => {
        if (mapRef.current) {
            updateHeatmap();
        }
    }, [updateHeatmap]);

    const barData = useMemo(() => {
        return points
            .slice(0, 7)
            .map((p, i) => ({
                name: p.name.length > 10 ? p.name.substring(0, 8) + '...' : p.name,
                co2: Math.round(p.co2_estimate || 25),
                fill: COLORS[i % COLORS.length]
            }));
    }, [points]);

    const pieData = useMemo(() => {
        return points
            .slice(0, 5)
            .map((p, i) => ({
                name: p.name.length > 12 ? p.name.substring(0, 10) + '...' : p.name,
                value: Math.round(p.co2_estimate || 25),
                fill: COLORS[i % COLORS.length]
            }));
    }, [points]);

    const locateUser = () => {
        if (!mapRef.current) return;
        mapRef.current.locate({ setView: true, maxZoom: 15 });
    };

    function LocationMarker() {
        useMapEvents({
            click(e) {
                setTempCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
                setNewPoint({ name: '', co2: 25 });
                setShowAddModal(true);
            },
        });
        return null;
    }

    const savePoint = async () => {
        if (!newPoint.name.trim()) {
            alert('Введите название места');
            return;
        }

        if (!tempCoords) {
            alert('Выберите место на карте');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Пользователь не авторизован');
            return;
        }

        const { error } = await supabase.from('user_map_points').insert({
            user_id: user.id,
            lat: tempCoords.lat,
            lng: tempCoords.lng,
            name: newPoint.name.trim(),
            co2_estimate: newPoint.co2,
        });

        if (error) {
            console.error('Error saving point:', error);
            alert('Ошибка при сохранении точки');
        } else {
            await loadUserPoints();
            setShowAddModal(false);
            setNewPoint({ name: '', co2: 25 });
            setTempCoords(null);
        }
    };

    const deletePoint = async (id: string) => {
        await supabase.from('user_map_points').delete().eq('id', id);
        loadUserPoints();
    };

    const clearAll = async () => {
        if (!confirm("Удалить все точки?")) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_map_points').delete().eq('user_id', user.id);
            setPoints([]);
        }
    };

    const panelBgClass = isDark
        ? 'bg-black/80 backdrop-blur-lg border-white/20'
        : 'bg-white/90 backdrop-blur-lg border-gray-200 shadow-lg';

    const buttonClass = isDark
        ? 'text-white hover:bg-zinc-800'
        : 'text-gray-900 hover:bg-gray-100';

    return (
        <div className="w-full relative pt-4">
            <div className="relative h-[520px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg">
                <MapContainer
                    center={[55.0, 60.0]}
                    zoom={4}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                    whenReady={() => {
                        setTimeout(() => updateHeatmap(), 100);
                    }}
                >
                    <TileLayer
                        url={MAP_TILES[currentTile]}
                        attribution='&copy; OpenStreetMap contributors'
                        maxZoom={19}
                        tileSize={256}
                        zoomOffset={0}
                    />
                    <LocationMarker />

                    {points.map((point) => (
                        <Marker
                            key={point.id}
                            position={[point.lat, point.lng]}
                            icon={createCustomIcon(currentTile === 'dark')}
                        >
                            <Popup>
                                <div className="min-w-[200px]">
                                    <h3 className="font-semibold">{point.name}</h3>
                                    <p className="text-emerald-600">{point.co2_estimate} кг CO₂e</p>
                                    <Button variant="destructive" size="sm" className="mt-3 w-full" onClick={() => deletePoint(point.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Удалить
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Правая панель управления */}
                <div className={`absolute top-4 right-4 z-[9999] flex flex-col gap-3 p-2 rounded-2xl ${panelBgClass} shadow-lg`}>
                    <div className="flex flex-col gap-1">
                        <Button
                            variant={currentTile === 'light_hd' || currentTile === 'light' ? "default" : "ghost"}
                            size="sm"
                            className={(currentTile === 'light_hd' || currentTile === 'light') ? "bg-emerald-600 text-white" : buttonClass}
                            onClick={() => setCurrentTile(mapQuality === 'ultra' ? 'light_hd' : 'light')}
                            type="button"
                        >
                            <Layers className="mr-2 h-4 w-4" /> Светлая
                        </Button>
                        <Button
                            variant={currentTile === 'dark' ? "default" : "ghost"}
                            size="sm"
                            className={currentTile === 'dark' ? "bg-emerald-600 text-white" : buttonClass}
                            onClick={() => setCurrentTile('dark')}
                            type="button"
                        >
                            <Layers className="mr-2 h-4 w-4" /> Тёмная
                        </Button>
                        <Button
                            variant={currentTile === 'satellite_hd' || currentTile === 'satellite' ? "default" : "ghost"}
                            size="sm"
                            className={(currentTile === 'satellite_hd' || currentTile === 'satellite') ? "bg-emerald-600 text-white" : buttonClass}
                            onClick={() => setCurrentTile(mapQuality === 'ultra' ? 'satellite_hd' : 'satellite')}
                            type="button"
                        >
                            <Layers className="mr-2 h-4 w-4" /> Спутник
                        </Button>
                    </div>

                    <Button
                        variant={showHeatmap ? "default" : "outline"}
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={showHeatmap
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : buttonClass
                        }
                        type="button"
                    >
                        <ThermometerSun className="mr-2 h-4 w-4" />
                        {showHeatmap ? "Скрыть тепло" : "Показать тепло"}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setShowHeatSettings(!showHeatSettings)}
                        className={buttonClass}
                        type="button"
                    >
                        <Settings2 className="mr-2 h-4 w-4" /> Настройки
                    </Button>
                </div>

                {/* Нижняя левая панель - аналитика и HD в одну строку */}
                <div className="absolute bottom-4 left-4 z-[9999] flex gap-2">
                    {/* Кнопка HD */}
                    <div className={`${panelBgClass} rounded-full p-1 shadow-lg`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMapQuality}
                            className={buttonClass}
                            type="button"
                        >
                            <Layers className="mr-2 h-4 w-4" />
                            {mapQuality === 'high' ? 'HD' : 'Ultra HD'}
                        </Button>
                    </div>

                    {/* Кнопка аналитики - всегда видна, даже когда окно открыто */}
                    {points.length > 0 && (
                        <Button
                            onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                            className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg p-3 h-auto w-auto ${isAnalyticsOpen ? 'ring-2 ring-emerald-300' : ''}`}
                            type="button"
                        >
                            <BarChart3 className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Модальное окно аналитики - открывается над кнопкой */}
                {isAnalyticsOpen && points.length > 0 && (
                    <div className="absolute bottom-28 left-4 z-[10000]">
                        <div className={`rounded-2xl shadow-2xl border w-80 max-h-[400px] overflow-y-auto ${
                            isDark ? 'bg-black/95 border-white/20' : 'bg-white/95 border-gray-200'
                        }`}>
                            <div className={`flex items-center justify-between p-3 border-b sticky top-0 ${
                                isDark ? 'border-white/10 bg-black/95' : 'border-gray-200 bg-white/95'
                            }`}>
                                <h3 className={`font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                                    Аналитика CO₂
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAnalyticsOpen(false)}
                                    className="p-1 h-6 w-6"
                                >
                                    <X className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                                </Button>
                            </div>

                            <div className="p-3 space-y-4">
                                <div>
                                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Выбросы CO₂ по местам (кг)
                                    </p>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barData}>
                                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} stroke={isDark ? '#fff' : '#000'} />
                                                <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={50} stroke={isDark ? '#fff' : '#000'} />
                                                <YAxis fontSize={10} stroke={isDark ? '#fff' : '#000'} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: isDark ? '#1f2937' : '#fff',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '11px'
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="co2"
                                                    fill="#10b981"
                                                    radius={6}
                                                    animationDuration={1000}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div>
                                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Распределение выбросов
                                    </p>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={60}
                                                    dataKey="value"
                                                    animationDuration={1200}
                                                    animationEasing="ease-out"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: isDark ? '#1f2937' : '#fff',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '11px'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className={`text-xs space-y-2 pt-2 border-t ${
                                    isDark ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-600'
                                }`}>
                                    <div className="flex justify-between">
                                        <span>Всего точек:</span>
                                        <span className="font-semibold">{points.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Средний CO₂:</span>
                                        <span className="font-semibold text-emerald-600">
                                            {Math.round(points.reduce((sum, p) => sum + (p.co2_estimate || 25), 0) / points.length)} кг
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Максимум:</span>
                                        <span className="font-semibold text-red-500">
                                            {Math.max(...points.map(p => p.co2_estimate || 25))} кг
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Минимум:</span>
                                        <span className="font-semibold text-emerald-500">
                                            {Math.min(...points.map(p => p.co2_estimate || 25))} кг
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Нижняя центральная панель кнопок */}
                <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] flex gap-2 p-2 rounded-full ${panelBgClass} shadow-lg`}>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4"
                        type="button"
                    >
                        <Plus className="mr-1 h-4 w-4" /> Добавить
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={locateUser}
                        className={`rounded-full px-4 ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                        type="button"
                    >
                        <Locate className="mr-1 h-4 w-4" /> Моя локация
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearAll}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4"
                        type="button"
                    >
                        <Trash2 className="mr-1 h-4 w-4" /> Очистить
                    </Button>
                </div>

                {/* Модальное окно настроек тепловой карты */}
                {showHeatSettings && (
                    <div className={`absolute bottom-24 right-4 z-[10000] w-80 rounded-2xl shadow-2xl border p-4 ${
                        isDark ? 'bg-zinc-900 border-white/20' : 'bg-white border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Настройки тепловой карты
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowHeatSettings(false)}
                                className={isDark ? 'text-white hover:bg-zinc-800' : 'text-gray-900 hover:bg-gray-100'}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label className={isDark ? 'text-white text-sm' : 'text-gray-900 text-sm'}>
                                        Радиус
                                    </Label>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {heatConfig.radius} px
                                    </span>
                                </div>
                                <CustomSlider
                                    value={heatConfig.radius}
                                    onChange={(val: number) => saveConfig({...heatConfig, radius: val})}
                                    min={20}
                                    max={80}
                                    step={5}
                                    isDark={isDark}
                                />
                                <div className="flex justify-between mt-2 px-1">
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>20</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>35</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>50</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>65</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>80</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label className={isDark ? 'text-white text-sm' : 'text-gray-900 text-sm'}>
                                        Размытие
                                    </Label>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {heatConfig.blur} px
                                    </span>
                                </div>
                                <CustomSlider
                                    value={heatConfig.blur}
                                    onChange={(val: number) => saveConfig({...heatConfig, blur: val})}
                                    min={15}
                                    max={60}
                                    step={5}
                                    isDark={isDark}
                                />
                                <div className="flex justify-between mt-2 px-1">
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>15</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>30</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>45</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>60</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label className={isDark ? 'text-white text-sm' : 'text-gray-900 text-sm'}>
                                        Максимум
                                    </Label>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {heatConfig.max}
                                    </span>
                                </div>
                                <CustomSlider
                                    value={heatConfig.max}
                                    onChange={(val: number) => saveConfig({...heatConfig, max: val})}
                                    min={50}
                                    max={150}
                                    step={10}
                                    isDark={isDark}
                                />
                                <div className="flex justify-between mt-2 px-1">
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>50</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>75</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>100</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>125</span>
                                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>150</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={resetHeatConfig}
                                className={`w-full ${isDark ? 'bg-zinc-800 border-white/20 text-white hover:bg-zinc-700' : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'}`}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" /> Сбросить настройки
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Модальное окно добавления точки */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className={`z-[10001] ${isDark ? 'bg-zinc-900 border-white/20' : 'bg-white border-gray-200'}`}>
                    <DialogHeader>
                        <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                            Добавить новую точку
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label className={isDark ? 'text-white' : 'text-gray-900'}>
                                Название места
                            </Label>
                            <Input
                                value={newPoint.name}
                                onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                                placeholder="Москва, дача..."
                                className={isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                            />
                        </div>
                        <div>
                            <Label className={isDark ? 'text-white' : 'text-gray-900'}>
                                CO₂e (кг)
                            </Label>
                            <Input
                                type="number"
                                value={newPoint.co2}
                                onChange={(e) => setNewPoint({ ...newPoint, co2: Number(e.target.value) })}
                                className={isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                            />
                        </div>
                        <Button
                            onClick={savePoint}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Сохранить точку
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}