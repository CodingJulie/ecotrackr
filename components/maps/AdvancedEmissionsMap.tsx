'use client';

import { useState } from 'react';
import MapboxMap from './OpenStreetMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, ThermometerSun, MapPin } from 'lucide-react';

export default function AdvancedEmissionsMap() {
    const [viewMode, setViewMode] = useState<'heatmap' | 'markers'>('heatmap');

    return (
        <Card className="col-span-1 lg:col-span-7">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        <Leaf className="text-emerald-600" />
                        География вашего воздействия
                    </CardTitle>

                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1">
                        <Button
                            variant={viewMode === 'heatmap' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode('heatmap')}
                        >
                            <ThermometerSun className="w-4 h-4 mr-2" />
                            Тепловая карта
                        </Button>
                        <Button
                            variant={viewMode === 'markers' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode('markers')}
                        >
                            <MapPin className="w-4 h-4 mr-2" />
                            Маркеры
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <MapboxMap viewMode={viewMode} />
            </CardContent>
        </Card>
    );
}