// components/maps/GoogleEmissionsMap.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, StandaloneSearchBox, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Route, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const center = { lat: 55.0, lng: 60.0 };
const mapContainerStyle = { width: '100%', height: '500px' };

export default function GoogleEmissionsMap() {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['places'],
    });

    const [markers, setMarkers] = useState<any[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [directions, setDirections] = useState<any>(null);

    const [newPoint, setNewPoint] = useState({ lat: 55.75, lng: 37.61, name: '', co2: 25 });

    const searchBoxRef = useRef<any>(null);

    const handlePlacesChanged = () => {
        const places = searchBoxRef.current?.getPlaces();
        if (places?.length > 0) {
            const place = places[0];
            const loc = place.geometry?.location;
            if (loc) {
                setNewPoint({
                    lat: loc.lat(),
                    lng: loc.lng(),
                    name: place.formatted_address || place.name || '',
                    co2: 25
                });
                setShowAddModal(true);
            }
        }
    };

    const handleMapClick = (e: any) => {
        if (e.latLng) {
            setNewPoint({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
                name: '',
                co2: 25
            });
            setShowAddModal(true);
        }
    };

    const addMarker = async () => {
        if (!newPoint.name.trim()) return;

        const marker = { ...newPoint, id: Date.now() };
        setMarkers(prev => [...prev, marker]);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('user_map_points').insert({
                user_id: user.id,
                lat: newPoint.lat,
                lng: newPoint.lng,
                name: newPoint.name,
                co2_estimate: newPoint.co2,
            });
        }

        setShowAddModal(false);
    };

    const calculateRoute = () => {
        if (markers.length < 2) {
            alert("Добавьте минимум 2 точки");
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
            origin: { lat: markers[0].lat, lng: markers[0].lng },
            destination: { lat: markers[markers.length - 1].lat, lng: markers[markers.length - 1].lng },
            travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                setDirections(result);
            } else {
                alert(`Ошибка: ${status}`);
            }
        });
    };

    const clearAll = () => {
        if (confirm("Удалить все маркеры?")) {
            setMarkers([]);
            setDirections(null);
            setSelectedMarker(null);
        }
    };

    if (!isLoaded) {
        return (
            <Card className="col-span-1 lg:col-span-7 h-[500px] flex items-center justify-center">
                <p className="text-muted-foreground">Загрузка Google Maps...</p>
            </Card>
        );
    }

    return (
        <div>
            <div className="p-4 border-b flex flex-wrap gap-3 items-center bg-zinc-50 dark:bg-zinc-900">
                <StandaloneSearchBox
                    onLoad={ref => searchBoxRef.current = ref}
                    onPlacesChanged={handlePlacesChanged}
                >
                    <Input type="text" placeholder="Поиск адреса..." className="w-80" />
                </StandaloneSearchBox>

                <Button onClick={calculateRoute} variant="default">
                    <Route className="mr-2 h-4 w-4" />
                    Построить маршрут
                </Button>

                <Button onClick={clearAll} variant="destructive" disabled={markers.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Очистить всё
                </Button>
            </div>

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={4}
                onClick={handleMapClick}
            >
                {markers.map((m) => (
                    <Marker
                        key={m.id}
                        position={{ lat: m.lat, lng: m.lng }}
                        onClick={() => setSelectedMarker(m)}
                    />
                ))}

                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div>
                            <h4 className="font-semibold">{selectedMarker.name}</h4>
                            <p className="text-emerald-600">{selectedMarker.co2} кг CO₂e</p>
                        </div>
                    </InfoWindow>
                )}

                {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>

            {/* Модальное окно */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить новую точку</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Название места</Label>
                            <Input
                                value={newPoint.name}
                                onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                                placeholder="Москва, офис"
                            />
                        </div>
                        <div>
                            <Label>CO₂e (кг)</Label>
                            <Input
                                type="number"
                                value={newPoint.co2}
                                onChange={(e) => setNewPoint({ ...newPoint, co2: Number(e.target.value) })}
                            />
                        </div>
                        <Button onClick={addMarker} className="w-full">Добавить точку</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}