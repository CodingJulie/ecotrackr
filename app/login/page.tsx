// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Leaf, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const { t } = useTranslation('common');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }

            if (data.session) {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || t('login_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <Link href="/" className="mx-auto inline-block hover:opacity-80 transition-opacity">
                        <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Leaf className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-3xl">{t('login_to_ecotrackr')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('login_desc')}
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <Label htmlFor="email">{t('email')}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">{t('password')}</Label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-muted-foreground">{t('remember_me')}</span>
                            </label>
                            <Link href="/forgot-password" className="text-sm text-emerald-600 hover:underline">
                                {t('forgot_password')}
                            </Link>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-xl">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700"
                            disabled={loading}
                        >
                            {loading ? t('logging_in') : t('login')}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            {t('no_account')}{' '}
                            <Link href="/register" className="text-emerald-600 hover:underline font-medium">
                                {t('register')}
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}