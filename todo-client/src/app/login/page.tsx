'use client'
import { useState, useEffect } from 'react'
import { useLogin } from './useLogin'
import { useSearchParams } from 'next/navigation'

export default function Login() {
    const { handleLogin, isLoading, error } = useLogin();
    const searchParams = useSearchParams();

    useEffect(() => {
        // URL에 authCompleted 파라미터가 있는지 확인
        const authCompleted = searchParams.get('authCompleted');
        const authError = searchParams.get('error');
        
        if (authError) {
            console.error('인증 오류:', authError);
        }
    }, [searchParams]);

    const onLoginClick = async () => {
        try {
            const result = await handleLogin();
            if (!result.success && result.error) {
                alert(result.error);
            }
        } catch (error) {
            alert('로그인 중 오류가 발생했습니다');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="w-full max-w-md bg-white/20 backdrop-blur-lg p-10 rounded-3xl shadow-lg text-center">
                <h1 className="text-4xl font-bold text-white mb-10">Todo App</h1>
                
                <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-white/90 mb-6 text-lg">
                            투두 앱을 사용하려면 로그인해 주세요
                        </p>
                        
                        {error && <div className="error-message">{error}</div>}
                        
                        <button
                            onClick={onLoginClick}
                            disabled={isLoading}
                            className="w-full bg-white/90 hover:bg-white text-purple-700 font-bold py-3 px-8 rounded-lg transition-all duration-200 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">로그인 중...</span>
                            ) : (
                                "로그인"
                            )}
                        </button>
                    </div>
                </div>
                
                <p className="mt-12 text-white/70 text-sm">
                    © 2025 Todo App for Onboarding
                </p>
            </div>
        </div>
    )
}