'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Leaf, AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

export default function UpdatePasswordPage() {
    const { t } = useTranslation('common');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const checkToken = async () => {
            try {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');

                if (accessToken && type === 'recovery') {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (error) {
                        console.error('Error setting session:', error);
                        setIsValidToken(false);
                    } else {
                        setIsValidToken(true);
                    }
                } else if (accessToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (error) {
                        console.error('Error setting session:', error);
                        setIsValidToken(false);
                    } else {
                        setIsValidToken(true);
                    }
                } else {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        setIsValidToken(true);
                    } else {
                        setIsValidToken(false);
                    }
                }
            } catch (err) {
                console.error('Error checking token:', err);
                setIsValidToken(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkToken();
    }, []);

    const handleUpdatePassword = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError(t('password_min_length'));
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError(t('passwords_do_not_match'));
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);

            setTimeout(() => {
                supabase.auth.signOut();
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || t('password_update_error'));
        } finally {
            setLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-pulse mx-auto" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-4 border-emerald-600 rounded-full animate-spin border-t-transparent" />
                        <p className="mt-4 text-muted-foreground">{t('checking_link')}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isValidToken === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">{t('invalid_link')}</h2>
                        <p className="text-muted-foreground mb-6">
                            {t('invalid_link_desc')}
                        </p>
                        <Link href="/forgot-password">
                            <Button>{t('request_new_link')}</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 pb-8 text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">{t('password_updated')}</h2>
                        <p className="text-muted-foreground mb-6">
                            {t('password_updated_desc')}
                        </p>
                        <Link href="/login">
                            <Button>{t('go_to_login')}</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <Link href="/" className="mx-auto inline-block hover:opacity-80 transition-opacity">
                        <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Leaf className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold">{t('new_password')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('new_password_desc')}
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div>
                            <Label htmlFor="password">{t('new_password')}</Label>
                            <div className="relative mt-1.5">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('min_6_chars')}
                                    className="pl-10 pr-10"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">{t('confirm_new_password')}</Label>
                            <div className="relative mt-1.5">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('repeat_new_password')}
                                    className="pl-10 pr-10"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
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
                            {loading ? t('saving') : t('save_password')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}