'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Создаём пользователя
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name }, // сохраняем имя в user metadata
                },
            });

            if (signUpError) throw signUpError;

            // 2. Создаём профиль в таблице profiles
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        name: name,
                    });

                if (profileError) console.error('Profile creation error:', profileError);
            }

            alert('Регистрация прошла успешно! Проверьте почту для подтверждения (если включено).');
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Ошибка при регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-zinc-950 px-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-3xl">Создать аккаунт</CardTitle>
                    <p className="text-muted-foreground mt-2">
                        Начни менять своё влияние на планету уже сегодня
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <Label htmlFor="name">Имя</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Иван Иванов"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Пароль</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Минимум 6 символов"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-950 p-3 rounded-xl">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            Уже есть аккаунт?{' '}
                            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
                                Войти
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}