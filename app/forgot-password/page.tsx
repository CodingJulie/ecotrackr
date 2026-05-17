'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Leaf, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
    const { t } = useTranslation('common');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [cooldown, setCooldown] = useState(false);

    const handleResetPassword = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (cooldown) {
            setError(t('cooldown_error'));
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const redirectUrl = `${window.location.origin}/update-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (error) throw error;

            setSuccess(true);
            setCooldown(true);

            setTimeout(() => {
                setCooldown(false);
            }, 60000);

        } catch (err: any) {
            console.error('Reset error:', err);
            setError(err.message || t('reset_error'));
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
                    <CardTitle className="text-3xl">{t('reset_password')}</CardTitle>
                    <p className="text-muted-foreground mt-2">
                        {t('reset_password_desc')}
                    </p>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle className="w-16 h-16 text-emerald-500" />
                            </div>
                            <p className="text-lg font-semibold text-emerald-600">
                                {t('email_sent')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('check_email')} {email}.<br />
                                {t('reset_link_valid')}
                            </p>
                            {cooldown && (
                                <p className="text-sm text-amber-600">
                                    {t('cooldown_message')}
                                </p>
                            )}
                            <Link href="/login">
                                <Button variant="outline" className="w-full mt-4">
                                    {t('back_to_login')}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <Label htmlFor="email">{t('email')}</Label>
                                <div className="relative mt-1.5">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="pl-10"
                                        required
                                        disabled={loading || cooldown}
                                    />
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
                                disabled={loading || cooldown}
                            >
                                {loading ? t('sending') : cooldown ? t('cooldown_button') : t('send_link')}
                            </Button>

                            <div className="text-center mt-4">
                                <Link href="/login" className="text-sm text-emerald-600 hover:underline">
                                    {t('back_to_login')}
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}