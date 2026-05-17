'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Trash2, Plus, Locate, ThermometerSun, Settings2, RotateCcw, BarChart3, Layers, X, Search, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buildHeatData } from '@/lib/heatmap';
import { useDebounce } from 'use-debounce';
import PollutionEffect from '@/components/ui/PollutionEffect';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

interface SearchResult {
    lat: string;
    lon: string;
    display_name: string;
    name: string;
    type: string;
    importance: number;
}

const createCustomIcon = (isDark: boolean, mapMarkerLabel: string, placeMarkerLabel: string) => {
    const color = isDark ? '#10b981' : '#059669';
    return new L.DivIcon({
        className: 'custom-marker',
        html: `
      <svg width="42" height="48" viewBox="0 0 42 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${mapMarkerLabel}">
        <title>${placeMarkerLabel}</title>
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

const MAP_TILES = {
    light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    light_hd: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    satellite_hd: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
};

const DEFAULT_HEAT_CONFIG = { radius: 45, blur: 35, max: 90 };
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const HEAT_GRADIENT = {
    0.0: '#22c55e',
    0.25: '#eab308',
    0.5: '#f97316',
    0.75: '#ef4444',
    1.0: '#991b1b',
};

interface HeatmapLayerProps {
    points: Array<{ lat: number; lng: number; co2_estimate?: number | null | string }>;
    showHeatmap: boolean;
    heatConfig: typeof DEFAULT_HEAT_CONFIG;
}

function HeatmapLayer({ points, showHeatmap, heatConfig }: HeatmapLayerProps) {
    const map = useMap();
    const heatLayerRef = useRef<any>(null);

    const syncHeatmap = useCallback(() => {
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        if (!showHeatmap || points.length === 0) {
            return;
        }

        const heatData = buildHeatData(points, heatConfig.max);
        heatLayerRef.current = (L as any).heatLayer(heatData, {
            radius: heatConfig.radius,
            blur: heatConfig.blur,
            max: 1,
            // leaflet.heat scales intensity by 2^(maxZoom - zoom); pin maxZoom to the
            // current zoom so points keep distinct brightness at low zoom levels.
            maxZoom: map.getZoom(),
            gradient: HEAT_GRADIENT,
            minOpacity: 0.05,
        }).addTo(map);
    }, [map, points, showHeatmap, heatConfig]);

    useEffect(() => {
        syncHeatmap();

        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
                heatLayerRef.current = null;
            }
        };
    }, [map, syncHeatmap]);

    useMapEvents({
        zoomend: syncHeatmap,
    });

    return null;
}

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
                style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, ${isDark ? '#374151' : '#e5e7eb'} ${percentage}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)` }}
            />
            <style>{`
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
                input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }
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

interface OpenStreetMapProps {
    mapPoints: any[];
}

export default function OpenStreetMap({ mapPoints }: OpenStreetMapProps) {
    const { t, i18n } = useTranslation('common');
    const [isDark, setIsDark] = useState(false);
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
    const [showPollution, setShowPollution] = useState(false);
    const [lastCO2Amount, setLastCO2Amount] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchInputRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);

    useEffect(() => {
        setPoints(mapPoints || []);
    }, [mapPoints]);

    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('heatmapConfig');
        if (saved) setHeatConfig(JSON.parse(saved));
        const savedQuality = localStorage.getItem('mapQuality');
        if (savedQuality === 'ultra') setMapQuality('ultra');
    }, []);

    useEffect(() => {
        const searchAddress = async () => {
            if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 3) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const response = await fetch(
                    `/api/places/search?q=${encodeURIComponent(debouncedSearchQuery)}&lang=${encodeURIComponent(i18n.language)}`
                );
                if (!response.ok) {
                    throw new Error('Search failed');
                }
                const data = await response.json();
                setSearchResults(Array.isArray(data) ? data : []);
                setShowSearchResults(true);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };
        searchAddress();
    }, [debouncedSearchQuery, i18n.language]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSelect = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setTempCoords({ lat, lng });
        setNewPoint({ name: result.name || result.display_name.split(',')[0], co2: 25 });
        setShowAddModal(true);
        setShowSearchResults(false);
        setSearchQuery('');
        if (mapRef.current) mapRef.current.setView([lat, lng], 13);
    };

    useEffect(() => {
        if (isDark) setCurrentTile('dark');
        else setCurrentTile(mapQuality === 'ultra' ? 'light_hd' : 'light');
    }, [isDark, mapQuality]);

    const toggleMapQuality = () => {
        const newQuality = mapQuality === 'high' ? 'ultra' : 'high';
        setMapQuality(newQuality);
        localStorage.setItem('mapQuality', newQuality);
    };

    const saveConfig = (config: typeof heatConfig) => {
        setHeatConfig(config);
        localStorage.setItem('heatmapConfig', JSON.stringify(config));
    };

    const resetHeatConfig = () => {
        setHeatConfig(DEFAULT_HEAT_CONFIG);
        localStorage.setItem('heatmapConfig', JSON.stringify(DEFAULT_HEAT_CONFIG));
    };

    const barData = useMemo(() => {
        if (!points || points.length === 0) return [];
        return points.slice(0, 7).map((p, i) => ({
            name: p?.name?.length > 10 ? p.name.substring(0, 8) + '...' : p.name || t('unnamed'),
            co2: Math.round(p?.co2_estimate || 25),
            fill: COLORS[i % COLORS.length]
        }));
    }, [points, t]);

    const pieData = useMemo(() => {
        if (!points || points.length === 0) return [];
        return points.slice(0, 5).map((p, i) => ({
            name: p?.name?.length > 12 ? p.name.substring(0, 10) + '...' : p.name || t('unnamed'),
            value: Math.round(p?.co2_estimate || 25),
            fill: COLORS[i % COLORS.length]
        }));
    }, [points, t]);

    const chartTooltipProps = useMemo(() => ({
        contentStyle: {
            backgroundColor: isDark ? '#1f2937' : '#fff',
            color: isDark ? '#f3f4f6' : '#111827',
            border: isDark ? '1px solid rgba(255,255,255,0.12)' : 'none',
            borderRadius: '8px',
            fontSize: '11px',
        },
        itemStyle: {
            color: isDark ? '#f3f4f6' : '#111827',
        },
        labelStyle: {
            color: isDark ? '#f3f4f6' : '#111827',
        },
    }), [isDark]);

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
                setShowSearchResults(false);
            },
        });
        return null;
    }

    const savePoint = async () => {
        if (!newPoint.name.trim()) {
            alert(t('enter_name_alert'));
            return;
        }
        if (!tempCoords) {
            alert(t('select_location_alert'));
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert(t('user_not_authorized'));
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
            alert(t('error_saving_point'));
        } else {
            const { data: updated } = await supabase
                .from('user_map_points')
                .select('*')
                .eq('user_id', user.id);
            setPoints(updated || []);
            setShowAddModal(false);
            setNewPoint({ name: '', co2: 25 });
            setTempCoords(null);
            setLastCO2Amount(newPoint.co2);
            setShowPollution(true);
        }
    };

    const deletePoint = async (id: string) => {
        await supabase.from('user_map_points').delete().eq('id', id);
        setPoints(prev => prev.filter(p => p.id !== id));
    };

    const clearAll = async () => {
        if (!confirm(t('confirm_delete_all'))) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_map_points').delete().eq('user_id', user.id);
            setPoints([]);
        }
    };

    const panelBgClass = isDark ? 'bg-black/80 backdrop-blur-lg border-white/20' : 'bg-white/90 backdrop-blur-lg border-gray-200 shadow-lg';
    const buttonClass = isDark ? 'text-white hover:bg-zinc-800' : 'text-gray-900 hover:bg-gray-100';

    return (
        <>
            <div className="relative z-0 w-full pt-4">
                <div className="relative isolate z-0 h-[520px] overflow-hidden rounded-2xl border border-zinc-200 shadow-lg dark:border-zinc-800">
                    <MapContainer
                        center={[55.0, 60.0]}
                        zoom={4}
                        className="relative z-0 h-full w-full"
                        ref={mapRef}
                    >
                        <TileLayer url={MAP_TILES[currentTile]} attribution='&copy; OpenStreetMap contributors' maxZoom={19} tileSize={256} zoomOffset={0} />
                        <HeatmapLayer points={points} showHeatmap={showHeatmap} heatConfig={heatConfig} />
                        <LocationMarker />
                        {points && points.length > 0 && points.map((point) => (
                            <Marker
                                key={point.id || `marker-${point.lat}-${point.lng}-${Math.random()}`}
                                position={[point.lat, point.lng]}
                                icon={createCustomIcon(currentTile === 'dark', t('map_marker'), t('place_marker'))}
                            >
                                <Popup>
                                    <div className="min-w-[200px]">
                                        <h3 className="font-semibold">{point.name}</h3>
                                        <p className="text-emerald-600">{point.co2_estimate} кг CO₂e</p>
                                        <Button variant="destructive" size="sm" className="mt-3 w-full" onClick={() => deletePoint(point.id)} aria-label={t('delete_point', { name: point.name })}>
                                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> {t('delete')}
                                        </Button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    <div className="pointer-events-none absolute inset-0 z-[1000]">
                        <div className="absolute top-4 left-1/2 w-96 max-w-[calc(100%-2rem)] -translate-x-1/2 pointer-events-auto">
                            <div className="relative" ref={searchInputRef}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                    <Input
                                        type="text"
                                        placeholder={t('search_place')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                                        className="pl-9 pr-10 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg"
                                        aria-label={t('search_place')}
                                    />
                                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" aria-hidden="true" />}
                                </div>
                                {showSearchResults && (searchResults.length > 0 || isSearching) && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-muted-foreground">
                                                <Loader2 className="w-5 h-5 animate-spin inline mr-2" aria-hidden="true" /> {t('searching')}
                                            </div>
                                        ) : (
                                            searchResults.map((result, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSearchSelect(result)}
                                                    className="w-full text-left p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-b last:border-b-0 border-zinc-100 dark:border-zinc-800"
                                                    aria-label={t('select_place', { name: result.name })}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                                        <div>
                                                            <p className="text-sm font-medium">{result.name}</p>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">{result.display_name}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`absolute top-4 right-4 flex flex-col gap-3 p-2 rounded-2xl pointer-events-auto ${panelBgClass} shadow-lg`}>
                        <div className="flex flex-col gap-1">
                            <Button
                                variant={currentTile === 'light_hd' || currentTile === 'light' ? "default" : "ghost"}
                                size="sm"
                                className={(currentTile === 'light_hd' || currentTile === 'light') ? "bg-emerald-600 text-white" : buttonClass}
                                onClick={() => setCurrentTile(mapQuality === 'ultra' ? 'light_hd' : 'light')}
                                aria-label={t('light')}
                            >
                                <Layers className="mr-2 h-4 w-4" aria-hidden="true" /> {t('light')}
                            </Button>
                            <Button
                                variant={currentTile === 'dark' ? "default" : "ghost"}
                                size="sm"
                                className={currentTile === 'dark' ? "bg-emerald-600 text-white" : buttonClass}
                                onClick={() => setCurrentTile('dark')}
                                aria-label={t('dark')}
                            >
                                <Layers className="mr-2 h-4 w-4" aria-hidden="true" /> {t('dark')}
                            </Button>
                        </div>
                        <Button
                            variant={showHeatmap ? "default" : "outline"}
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className={showHeatmap ? "bg-emerald-600 hover:bg-emerald-700 text-white" : buttonClass}
                            aria-label={showHeatmap ? t('hide_heat') : t('show_heat')}
                        >
                            <ThermometerSun className="mr-2 h-4 w-4" aria-hidden="true" />
                            {showHeatmap ? t('hide_heat') : t('show_heat')}
                        </Button>
                        <Button variant="outline" onClick={() => setShowHeatSettings(!showHeatSettings)} className={buttonClass} aria-label={t('heat_settings')}>
                            <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" /> {t('heat_settings')}
                        </Button>
                        </div>

                        <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
                        <div className={`${panelBgClass} rounded-full p-1 shadow-lg`}>
                            <Button variant="ghost" size="sm" onClick={toggleMapQuality} className={buttonClass} aria-label={t('toggle_quality')}>
                                <Layers className="mr-2 h-4 w-4" aria-hidden="true" />
                                {mapQuality === 'high' ? t('hd') : t('ultra_hd')}
                            </Button>
                        </div>
                        <Button onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg p-3 h-auto w-auto ${isAnalyticsOpen ? 'ring-2 ring-emerald-300' : ''}`} aria-label={t('co2_analytics')}>
                            <BarChart3 className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        </div>

                        {isAnalyticsOpen && points.length > 0 && (
                            <div className="absolute bottom-28 left-4 pointer-events-auto">
                            <div className={`rounded-2xl shadow-2xl border w-80 max-h-[400px] overflow-y-auto ${isDark ? 'bg-black/95 border-white/20' : 'bg-white/95 border-gray-200'}`}>
                                <div className={`flex items-center justify-between p-3 border-b sticky top-0 ${isDark ? 'border-white/10 bg-black/95' : 'border-gray-200 bg-white/95'}`}>
                                    <h3 className={`font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        <BarChart3 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                                        {t('co2_analytics')}
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => setIsAnalyticsOpen(false)} className="p-1 h-6 w-6" aria-label={t('close_analytics')}>
                                        <X className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-900'}`} aria-hidden="true" />
                                    </Button>
                                </div>
                                <div className="p-3 space-y-4">
                                    <div>
                                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('co2_emissions_by_places')}</p>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={barData}>
                                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} stroke={isDark ? '#fff' : '#000'} />
                                                    <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={50} stroke={isDark ? '#fff' : '#000'} />
                                                    <YAxis fontSize={10} stroke={isDark ? '#fff' : '#000'} />
                                                    <Tooltip {...chartTooltipProps} />
                                                    <Bar dataKey="co2" fill="#10b981" radius={6} animationDuration={1000} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('emissions_distribution')}</p>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" animationDuration={1200}>
                                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                                    </Pie>
                                                    <Tooltip {...chartTooltipProps} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className={`text-xs space-y-2 pt-2 border-t ${isDark ? 'border-white/10 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                                        <div className="flex justify-between"><span>{t('total_points_label')}</span><span className="font-semibold">{points.length}</span></div>
                                        <div className="flex justify-between"><span>{t('average_co2_label')}</span><span className="font-semibold text-emerald-600">{Math.round(points.reduce((sum, p) => sum + (p.co2_estimate || 25), 0) / points.length)} кг</span></div>
                                        <div className="flex justify-between"><span>{t('max_co2_label')}</span><span className="font-semibold text-red-500">{Math.max(...points.map(p => p.co2_estimate || 25))} кг</span></div>
                                        <div className="flex justify-between"><span>{t('min_co2_label')}</span><span className="font-semibold text-emerald-500">{Math.min(...points.map(p => p.co2_estimate || 25))} кг</span></div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}

                        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-full pointer-events-auto ${panelBgClass} shadow-lg`}>
                        <Button variant="default" size="sm" onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4" aria-label={t('add_point')}>
                            <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> {t('add_point')}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={locateUser} className={`rounded-full px-4 ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`} aria-label={t('my_location')}>
                            <Locate className="mr-1 h-4 w-4" aria-hidden="true" /> {t('my_location')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={clearAll} className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4" aria-label={t('clear_all')}>
                            <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" /> {t('clear_all')}
                        </Button>
                        </div>

                        {showHeatSettings && (
                            <div className={`absolute bottom-24 right-4 w-80 rounded-2xl shadow-2xl border p-4 pointer-events-auto ${isDark ? 'bg-zinc-900 border-white/20' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('heat_settings_title')}</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowHeatSettings(false)} className={isDark ? 'text-white hover:bg-zinc-800' : 'text-gray-900 hover:bg-gray-100'} aria-label={t('close_analytics')}>
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between mb-2"><Label className={isDark ? 'text-white text-sm' : 'text-gray-900 text-sm'}>{t('radius_label')}</Label><span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{heatConfig.radius} px</span></div>
                                    <CustomSlider value={heatConfig.radius} onChange={(val: number) => saveConfig({...heatConfig, radius: val})} min={20} max={80} step={5} isDark={isDark} />
                                    <div className="flex justify-between mt-2 px-1"><span className="text-[10px] text-muted-foreground">20</span><span className="text-[10px] text-muted-foreground">35</span><span className="text-[10px] text-muted-foreground">50</span><span className="text-[10px] text-muted-foreground">65</span><span className="text-[10px] text-muted-foreground">80</span></div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2"><Label className={isDark ? 'text-white text-sm' : 'text-gray-900 text-sm'}>{t('blur_label')}</Label><span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{heatConfig.blur} px</span></div>
                                    <CustomSlider value={heatConfig.blur} onChange={(val: number) => saveConfig({...heatConfig, blur: val})} min={15} max={60} step={5} isDark={isDark} />
                                    <div className="flex justify-between mt-2 px-1"><span className="text-[10px] text-muted-foreground">15</span><span className="text-[10px] text-muted-foreground">30</span><span className="text-[10px] text-muted-foreground">45</span><span className="text-[10px] text-muted-foreground">60</span></div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2"><Label className={isDark ? 'text-white text-sm' : 'text-gray-900 text-sm'}>{t('max_label')}</Label><span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{heatConfig.max}</span></div>
                                    <CustomSlider value={heatConfig.max} onChange={(val: number) => saveConfig({...heatConfig, max: val})} min={50} max={150} step={10} isDark={isDark} />
                                    <div className="flex justify-between mt-2 px-1"><span className="text-[10px] text-muted-foreground">50</span><span className="text-[10px] text-muted-foreground">75</span><span className="text-[10px] text-muted-foreground">100</span><span className="text-[10px] text-muted-foreground">125</span><span className="text-[10px] text-muted-foreground">150</span></div>
                                </div>
                                <Button variant="outline" onClick={resetHeatConfig} className={`w-full ${isDark ? 'bg-zinc-800 border-white/20 text-white hover:bg-zinc-700' : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'}`} aria-label={t('reset_heat_settings')}>
                                    <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> {t('reset_heat_settings')}
                                </Button>
                            </div>
                            </div>
                        )}
                    </div>
                </div>

                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogContent className={isDark ? 'bg-zinc-900 border-white/20' : 'bg-white border-gray-200'}>
                        <DialogHeader>
                            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>{t('add_new_point')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label className={isDark ? 'text-white' : 'text-gray-900'}>{t('place_name')}</Label>
                                <Input
                                    value={newPoint.name}
                                    onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                                    placeholder={t('point_name_placeholder')}
                                    className={isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                                    aria-label={t('place_name')}
                                />
                            </div>
                            <div>
                                <Label className={isDark ? 'text-white' : 'text-gray-900'}>{t('co2_value')}</Label>
                                <Input
                                    type="number"
                                    value={newPoint.co2}
                                    onChange={(e) => setNewPoint({ ...newPoint, co2: Number(e.target.value) })}
                                    className={isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}
                                    aria-label={t('co2_value')}
                                />
                            </div>
                            <Button onClick={savePoint} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" aria-label={t('save_point')}>
                                {t('save_point')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {showPollution && (
                <PollutionEffect co2Amount={lastCO2Amount} onComplete={() => setShowPollution(false)} />
            )}
        </>
    );
}