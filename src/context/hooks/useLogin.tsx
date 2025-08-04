import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface LoginFormData {
    email: string;
    password: string;
}

export function useLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState<'login' | 'recovery'>('login');
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent, onSuccess: () => void) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                // Registrar intento fallido
                await supabase.rpc('log_evento', {
                    usuario: '00000000-0000-0000-0000-000000000000',
                    rol: 'guest',
                    email: formData.email,
                    exito: false
                });
                throw error;
            }

            // Login exitoso - registrar evento
            if (data.user) {
                // Registrar intento exitoso con rol por defecto
                await supabase.rpc('log_evento', {
                    usuario: data.user.id,
                    rol: 'user',
                    email: formData.email,
                    exito: true
                });
            }

            onSuccess();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleShowPasswordRecovery = () => {
        setCurrentView('recovery');
    };

    const handleBackToLogin = () => {
        setCurrentView('login');
        setError('');
    };

    return {
        // Estado
        showPassword,
        loading,
        error,
        currentView,
        formData,
        // Acciones
        setShowPassword,
        handleSubmit,
        handleInputChange,
        handleShowPasswordRecovery,
        handleBackToLogin
    };
}