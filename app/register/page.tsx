// app/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Leaf, AlertCircle, CheckCircle, Eye, EyeOff, Shield, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
    const { t } = useTranslation('common');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/dashboard');
            }
        };
        checkSession();
    }, [router]);

    const getPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 6) strength++;
        if (pass.length >= 10) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(password);
    const isPasswordValid = password.length >= 6;
    const isPasswordMatch = password === confirmPassword;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const getPasswordStrengthText = () => {
        if (password.length === 0) return '';
        if (passwordStrength <= 2) return t('weak_password');
        if (passwordStrength <= 3) return t('medium_password');
        return t('strong_password');
    };

    const getPasswordStrengthColor = () => {
        if (password.length === 0) return '';
        if (passwordStrength <= 2) return 'text-red-500';
        if (passwordStrength <= 3) return 'text-yellow-500';
        return 'text-green-500';
    };

    const handleRegister = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!isEmailValid) {
            setError(t('invalid_email'));
            setLoading(false);
            return;
        }

        if (!isPasswordValid) {
            setError(t('password_min_length'));
            setLoading(false);
            return;
        }

        if (!isPasswordMatch) {
            setError(t('passwords_do_not_match'));
            setLoading(false);
            return;
        }

        if (!agreedToTerms) {
            setError(t('agree_to_terms_error'));
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name.trim() || email.split('@')[0],
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (err: any) {
            setError(err.message || t('registration_error'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{t('registration_success')}</h2>
                        <p className="text-muted-foreground mb-4">
                            {t('confirmation_email_sent')} <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            {t('confirm_email_instructions')}
                        </p>
                        <Button onClick={() => router.push('/login')} className="w-full">
                            {t('go_to_login')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-zinc-950 dark:to-zinc-900 px-6 py-12">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <Link href="/" className="mx-auto inline-block hover:opacity-80 transition-opacity">
                        <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Leaf className="w-8 h-8 text-white" />
                        </div>
                    </Link>
                    <Link href="/" className="block hover:opacity-80 transition-opacity">
                        <h1 className="text-3xl font-bold">{t('create_account')}</h1>
                    </Link>
                    <p className="text-muted-foreground mt-2">
                        {t('create_account_desc')}
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <User className="w-4 h-4" /> {t('name')}
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('enter_name')}
                                className="mt-1.5"
                                aria-label={t('name')}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('name_optional')}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {t('email')} *
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className={`mt-1.5 ${email && !isEmailValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                aria-label={t('email')}
                            />
                            {email && !isEmailValid && (
                                <p className="text-xs text-red-500 mt-1">{t('invalid_email')}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="password" className="flex items-center gap-2">
                                <Lock className="w-4 h-4" /> {t('password')} *
                            </Label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('min_6_chars')}
                                    required
                                    className={`pr-10 ${password && !isPasswordValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    aria-label={t('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? t('hide_password') : t('show_password')}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 h-1.5 mb-1">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={`flex-1 rounded-full transition-all ${
                                                    level <= passwordStrength
                                                        ? passwordStrength <= 2
                                                            ? 'bg-red-500'
                                                            : passwordStrength <= 3
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-500'
                                                        : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs ${getPasswordStrengthColor()}`}>
                                        {getPasswordStrengthText()}
                                    </p>
                                    {!isPasswordValid && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {t('password_min_length')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                                <Lock className="w-4 h-4" /> {t('confirm_new_password')} *
                            </Label>
                            <div className="relative mt-1.5">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="off"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={`pr-10 ${confirmPassword && !isPasswordMatch ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    aria-label={t('confirm_new_password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showConfirmPassword ? t('hide_password') : t('show_password')}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && !isPasswordMatch && (
                                <p className="text-xs text-red-500 mt-1">{t('passwords_do_not_match')}</p>
                            )}
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                aria-label={t('agree_to_terms')}
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground">
                                {t('i_agree_to')}{' '}
                                <Link href="/terms" className="text-emerald-600 hover:underline">
                                    {t('terms_of_service')}
                                </Link>{' '}
                                {t('and')}{' '}
                                <Link href="/privacy" className="text-emerald-600 hover:underline">
                                    {t('privacy_policy')}
                                </Link>
                            </label>
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
                            disabled={loading || !isEmailValid || !isPasswordValid || !isPasswordMatch || !agreedToTerms}
                            aria-label={t('register')}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t('registering')}
                                </div>
                            ) : (
                                t('register')
                            )}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            {t('already_have_account')}{' '}
                            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
                                {t('login')}
                            </Link>
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t text-xs text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        {t('data_safe')}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}