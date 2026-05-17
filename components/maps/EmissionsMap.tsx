// components/maps/EmissionsMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmissionsMap() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>География вашего воздействия</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
                <MapContainer center={[55.75, 37.61]} zoom={4} style={{ height: '100%', borderRadius: '16px' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[55.75, 37.61]}>
                        <Popup>Москва — 42 кг CO₂e в этом месяце</Popup>
                    </Marker>
                    {/* Можно добавить больше маркеров */}
                </MapContainer>
            </CardContent>
        </Card>
    );
}