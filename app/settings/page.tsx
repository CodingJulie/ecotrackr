'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';

export default function SettingsPage() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            if (data) setName(data.name || '');
        }
    };

    const updateProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({ name })
                .eq('id', user.id);

            if (error) {
                setMessage('Ошибка обновления');
            } else {
                setMessage('Профиль успешно обновлён ✓');
            }
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Leaf className="text-emerald-600" />
                        Настройки профиля
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="name">Имя</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ваше имя"
                        />
                    </div>

                    <Button onClick={updateProfile} disabled={loading} className="w-full">
                        {loading ? 'Сохраняем...' : 'Сохранить изменения'}
                    </Button>

                    {message && (
                        <p className="text-center text-emerald-600 font-medium">{message}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}