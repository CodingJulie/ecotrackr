// components/maps/EmissionsHeatmap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const heatData = [
    [55.75, 37.61, 0.95], [59.93, 30.31, 0.75], [56.84, 60.59, 0.85],
    [54.99, 73.36, 0.65], [55.03, 82.92, 0.55], [43.11, 131.88, 0.45],
];

export default function EmissionsHeatmap({ viewMode }: { viewMode: 'heat' | 'markers' }) {
    const mapRef = useRef<any>(null);
    const [userPoints, setUserPoints] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [tempPosition, setTempPosition] = useState<{lat: number, lng: number} | null>(null);
    const [newPointName, setNewPointName] = useState('');
    const [newPointCo2, setNewPointCo2] = useState(25);

    const addPoint = (lat: number, lng: number) => {
        setTempPosition({ lat, lng });
        setNewPointName('');
        setNewPointCo2(25);
        setShowModal(true);
    };

    const savePoint = async () => {
        if (!newPointName.trim() || !tempPosition) return;

        const point = {
            lat: tempPosition.lat,
            lng: tempPosition.lng,
            name: newPointName,
            co2: newPointCo2,
            date: new Date().toISOString().split('T')[0]
        };

        setUserPoints(prev => [...prev, point]);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_map_points').insert({
                user_id: user.id,
                lat: point.lat,
                lng: point.lng,
                name: point.name,
                co2_estimate: point.co2,
            });
        }

        setShowModal(false);
    };

    // Обновление карты
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        map.eachLayer((layer: any) => {
            if (layer instanceof (L as any).HeatLayer || layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        if (viewMode === 'heat') {
            (L as any).heatLayer(heatData, {
                radius: 40,
                blur: 25,
                gradient: { 0.4: '#9be9a8', 0.6: '#40c463', 0.8: '#30a14e', 1.0: '#216e39' }
            }).addTo(map);
        } else {
            userPoints.forEach((point, i) => {
                L.marker([point.lat, point.lng])
                    .addTo(map)
                    .bindPopup(`<b>${point.name}</b><br/>${point.co2} кг CO₂e`);
            });
        }
    }, [viewMode, userPoints]);

    return (
        <>
            <div className="relative h-[500px]">
                <MapContainer
                    center={[55.0, 60.0]}
                    zoom={4}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    <LocationMarker onAddPoint={addPoint} />
                </MapContainer>
            </div>

            {/* Модальное окно */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить точку на карту</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Название места</Label>
                            <Input
                                value={newPointName}
                                onChange={(e) => setNewPointName(e.target.value)}
                                placeholder="Москва, офис"
                            />
                        </div>
                        <div>
                            <Label>Примерный CO₂e (кг)</Label>
                            <Input
                                type="number"
                                value={newPointCo2}
                                onChange={(e) => setNewPointCo2(Number(e.target.value))}
                            />
                        </div>
                        <Button onClick={savePoint} className="w-full">Сохранить точку</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function LocationMarker({ onAddPoint }: { onAddPoint: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onAddPoint(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}