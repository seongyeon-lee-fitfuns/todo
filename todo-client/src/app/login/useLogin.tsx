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
      
      // Auth0 로그인으로 리다이렉트 처리
      if (response.status === 401 && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return { success: false, error: '인증이 필요합니다' };
      }
      
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
        
        // 사용자 상태 변경 이벤트 발생
        window.dispatchEvent(new Event('nakamaUserStateChanged'));
        
        // 로그인 성공 후 메인 페이지로 리다이렉트
        window.location.href = '/';
      }
      
      return { success: true };
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다');
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('handleLogout 호출');

    try {
      // 세션 스토리지에서 모든 Nakama 관련 데이터 삭제
      sessionStorage.removeItem('nakamaToken');
      sessionStorage.removeItem('nakamaRefreshToken');
      sessionStorage.removeItem('nakamaUserId');
      
      // Auth0 로그아웃 요청
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Nakama 로그아웃 요청
      await fetch('/api/nakama-logout', {
        method: 'POST',
      });

      // 사용자 상태 변경 이벤트 발생
      window.dispatchEvent(new Event('nakamaUserStateChanged'));
      
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return { handleLogin, handleLogout, error, isLoading };
};
