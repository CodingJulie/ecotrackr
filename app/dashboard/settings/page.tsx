// app/dashboard/settings/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Globe, Loader2, Lock, LogOut, Save, Trash2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/Switch';
import {
    getPublicProfileUrl,
    isUsernameTakenError,
    normalizeUsername,
    suggestUsernameFromName,
    validateUsername,
} from '@/lib/profile';

export default function SettingsPage() {
    const { t } = useTranslation('common');
    const router = useRouter();

    // ✅ Все состояния объявлены в начале
    const [profile, setProfile] = useState({ name: '', email: '', username: '', is_public: false });
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [userInitial, setUserInitial] = useState('?');
    const [activeTab, setActiveTab] = useState<'account' | 'security' | 'danger'>('account');

    // Состояния для смены пароля
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // ✅ useCallback для стабильной ссылки на функцию
    const loadProfile = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('name, username, is_public')
                .eq('id', user.id)
                .single();

            const userName = profile?.name || user.email?.split('@')[0] || t('user');
            setProfile({
                name: userName,
                email: user.email || '',
                username: profile?.username || '',
                is_public: profile?.is_public ?? false,
            });
            setUserInitial(userName[0]?.toUpperCase() || '?');
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    }, [t]);

    // ✅ useEffect с правильной обработкой Promise и зависимостями
    useEffect(() => {
        loadProfile().catch((error) => {
            console.error('Failed to load profile:', error);
        });
    }, [loadProfile]);

    const updateProfile = async () => {
        setSaving(true);
        setUsernameError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const normalizedUsername = profile.username ? normalizeUsername(profile.username) : '';

            if (profile.is_public) {
                if (!normalizedUsername) {
                    setUsernameError(t('username_required_for_public'));
                    return;
                }

                const validation = validateUsername(normalizedUsername);
                if (!validation.valid) {
                    setUsernameError(t(validation.errorKey!));
                    return;
                }
            } else if (normalizedUsername) {
                const validation = validateUsername(normalizedUsername);
                if (!validation.valid) {
                    setUsernameError(t(validation.errorKey!));
                    return;
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    name: profile.name,
                    username: normalizedUsername || null,
                    is_public: profile.is_public,
                })
                .eq('id', user.id);

            if (error) {
                if (isUsernameTakenError(error)) {
                    setUsernameError(t('username_taken'));
                    return;
                }
                throw error;
            }

            setProfile((current) => ({ ...current, username: normalizedUsername }));
            alert(t('profile_updated'));
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(t('profile_update_error'));
        } finally {
            setSaving(false);
        }
    };

    const handlePublicToggle = (checked: boolean) => {
        setUsernameError(null);
        setProfile((current) => {
            const nextUsername = current.username || suggestUsernameFromName(current.name);
            return {
                ...current,
                is_public: checked,
                username: checked && !current.username ? nextUsername : current.username,
            };
        });
    };

    const copyProfileLink = async () => {
        if (!profile.username || !profile.is_public) return;

        try {
            await navigator.clipboard.writeText(
                getPublicProfileUrl(profile.username, 'all', window.location.origin)
            );
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (error) {
            console.error('Copy profile link error:', error);
        }
    };

    const updatePassword = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        if (newPassword.length < 6) {
            setPasswordError(t('password_min_length'));
            setPasswordLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(t('passwords_do_not_match'));
            setPasswordLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error(t('user_not_found'));

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email!,
                password: currentPassword,
            });

            if (signInError) {
                setPasswordError(t('current_password_incorrect'));
                setPasswordLoading(false);
                return;
            }

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                setPasswordSuccess(false);
            }, 3000);
        } catch (err: any) {
            setPasswordError(err.message || t('password_update_error'));
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await supabase.auth.signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            setLoggingOut(false);
        }
    };

    const deleteAccount = async () => {
        if (!confirm(t('delete_account_confirm'))) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('profiles').delete().eq('id', user.id);
            await supabase.from('footprint_entries').delete().eq('user_id', user.id);
            await supabase.from('user_map_points').delete().eq('user_id', user.id);

            await supabase.auth.signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error deleting account:', error);
            alert(t('delete_account_error'));
        }
    };

    // ✅ Проверка загрузки ПОСЛЕ всех хуков
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-2">{t('profile_settings')}</h1>
                <p className="text-muted-foreground">{t('profile_settings_desc')}</p>
            </div>

            {/* Кнопки табов */}
            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-0">
                <button
                    onClick={() => setActiveTab('account')}
                    className={`px-6 py-3 text-sm font-medium transition-all rounded-t-lg ${
                        activeTab === 'account'
                            ? 'bg-emerald-600 text-white'
                            : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                >
                    <User className="w-4 h-4 inline mr-2" />
                    {t('account')}
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-6 py-3 text-sm font-medium transition-all rounded-t-lg ${
                        activeTab === 'security'
                            ? 'bg-emerald-600 text-white'
                            : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                >
                    <Lock className="w-4 h-4 inline mr-2" />
                    {t('security')}
                </button>
                <button
                    onClick={() => setActiveTab('danger')}
                    className={`px-6 py-3 text-sm font-medium transition-all rounded-t-lg ${
                        activeTab === 'danger'
                            ? 'bg-red-600 text-white'
                            : 'text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                >
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {t('danger_zone')}
                </button>
            </div>

            {/* Контент вкладки Аккаунт */}
            {activeTab === 'account' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-600" />
                            {t('personal_info')}
                        </CardTitle>
                        <CardDescription>
                            {t('personal_info_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-20 h-20 border-4 border-emerald-100">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-lg">{profile.name}</p>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">{t('name')}</Label>
                                <Input
                                    id="name"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    placeholder={t('enter_name')}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    id="email"
                                    value={profile.email}
                                    disabled
                                    className="bg-muted mt-1.5"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('email_cannot_change')}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-medium flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-emerald-600" />
                                        {t('public_profile_title')}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t('public_profile_desc')}
                                    </p>
                                </div>
                                <Switch
                                    checked={profile.is_public}
                                    onCheckedChange={handlePublicToggle}
                                    aria-label={t('public_profile_title')}
                                />
                            </div>

                            <div>
                                <Label htmlFor="username">{t('username')}</Label>
                                <Input
                                    id="username"
                                    value={profile.username}
                                    onChange={(e) => {
                                        setUsernameError(null);
                                        setProfile({ ...profile, username: e.target.value });
                                    }}
                                    placeholder={t('username_placeholder')}
                                    className="mt-1.5"
                                    autoComplete="off"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('username_hint')}
                                </p>
                                {usernameError && (
                                    <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                                )}
                            </div>

                            {profile.is_public && profile.username && (
                                <div className="space-y-2">
                                    <Label>{t('public_profile_link')}</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={getPublicProfileUrl(
                                                profile.username,
                                                'all',
                                                typeof window !== 'undefined' ? window.location.origin : ''
                                            )}
                                            className="bg-white dark:bg-zinc-900"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={copyProfileLink}
                                            aria-label={t('copy_profile_link')}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {linkCopied && (
                                        <p className="text-xs text-emerald-600">{t('link_copied')}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button onClick={updateProfile} disabled={saving}
                                className="w-full bg-emerald-600 hover:bg-emerald-700">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :
                                <Save className="w-4 h-4 mr-2" />}
                            {saving ? t('saving') : t('save_changes')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Контент вкладки Безопасность */}
            {activeTab === 'security' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-emerald-600" />
                            {t('change_password')}
                        </CardTitle>
                        <CardDescription>
                            {t('change_password_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={updatePassword} className="space-y-5">
                            <div>
                                <Label htmlFor="current-password">{t('current_password')}</Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="current-password"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder={t('enter_current_password')}
                                        className="pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> :
                                            <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="new-password">{t('new_password')}</Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="new-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t('enter_new_password')}
                                        className="pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirm-password">{t('confirm_new_password')}</Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t('repeat_new_password')}
                                        className="pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> :
                                            <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {passwordError && (
                                <div
                                    className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-xl">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div
                                    className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{t('password_changed_success')}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :
                                    <Lock className="w-4 h-4 mr-2" />}
                                {passwordLoading ? t('changing') : t('change_password_btn')}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t">
                            <p className="text-sm text-muted-foreground mb-3">{t('logout_label')}</p>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                {loggingOut ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4 mr-2" />
                                )}
                                {loggingOut ? t('logging_out') : t('sign_out')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Контент вкладки Опасная зона */}
            {activeTab === 'danger' && (
                <Card className="border-red-200 dark:border-red-900">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {t('danger_zone')}
                        </CardTitle>
                        <CardDescription>
                            {t('danger_zone_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
                            <h3 className="font-semibold text-red-600 mb-2">{t('delete_account')}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('delete_account_warning')}
                            </p>
                            <Button
                                variant="destructive"
                                onClick={deleteAccount}
                                className="w-full"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('delete_account_btn')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}