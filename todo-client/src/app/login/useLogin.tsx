import { useState } from 'react';

interface LoginResult {
  success: boolean;
  error?: string;
}

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/nakama-login', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`로그인 실패: ${data.error}`);
      }
      
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
      
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, error, isLoading };
};
