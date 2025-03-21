'use client'
import Image from 'next/image'
import { useState } from 'react'

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
            });
            
            if (!response.ok) {
                throw new Error('로그인 실패');
            }
            
            const data = await response.json();
            
            // 토큰 정보를 세션 스토리지에 저장
            if (data.token) {
                sessionStorage.setItem('nakamaToken', data.token);
                
                // 리프레시 토큰이 있다면 저장
                if (data.refresh_token) {
                    sessionStorage.setItem('nakamaRefreshToken', data.refresh_token);
                }
                
                // 사용자 정보가 있다면 저장
                if (data.user_id) {
                    sessionStorage.setItem('nakamaUserId', data.user_id);
                }
                
                // 로그인 성공 후 메인 페이지로 리다이렉트
                window.location.href = '/';
            }
        } catch (error) {
            console.error('로그인 에러:', error);
            alert('로그인에 실패했습니다.');
        } finally {
            setIsLoading(false);
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
                        
                        <button
                            onClick={handleLogin}
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