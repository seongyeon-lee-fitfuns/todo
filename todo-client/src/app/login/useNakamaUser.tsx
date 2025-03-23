'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * Nakama 사용자 프로필 정보 인터페이스
 */
export interface NakamaUserProfile {
  id?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // 필요한 다른 사용자 정보 필드들을 추가할 수 있습니다
  [key: string]: unknown;
}

/**
 * Nakama 사용자 컨텍스트 인터페이스
 */
export interface NakamaUserContext {
  user?: NakamaUserProfile;
  error?: Error;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Nakama API 응답 오류를 위한 클래스
 */
export class NakamaRequestError extends Error {
  public status: number;

  constructor(status: number, message?: string) {
    super(message || `Nakama API 요청 실패 (상태 코드: ${status})`);
    this.status = status;
    Object.setPrototypeOf(this, NakamaRequestError.prototype);
  }
}

/**
 * Nakama에서 사용자 정보를 가져오는 커스텀 훅
 * 
 * @returns {NakamaUserContext} 사용자 정보, 로딩 상태 및 오류를 포함하는 컨텍스트
 */
export function useNakamaUser(): NakamaUserContext {
  const [user, setUser] = useState<NakamaUserProfile | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNakamaUser = useCallback(async (): Promise<void> => {
    // 세션 스토리지에서 Nakama 토큰과 사용자 ID를 가져옴
    const token = sessionStorage.getItem('nakamaToken');
    
    if (!token) {
      setUser(undefined);
      setIsLoading(false);
      return;
    }

    try {
      // Nakama API에서 사용자 정보 가져오기
      const nakamaUrl = process.env.NEXT_PUBLIC_NAKAMA_URL;
      if (!nakamaUrl) {
        throw new Error('NEXT_PUBLIC_NAKAMA_URL 환경 변수가 설정되지 않았습니다');
      }

      // 3초 타임아웃을 설정
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('요청 시간이 초과되었습니다 (3초)'));
        }, 300);
      });

      // 실제 API 요청
      const fetchData = async () => {
        const response = await fetch(`${nakamaUrl}/v2/account`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // 토큰이 만료된 경우, 세션 스토리지 데이터 삭제 및 사용자 상태 초기화
            sessionStorage.removeItem('nakamaToken');
            sessionStorage.removeItem('nakamaRefreshToken');
            sessionStorage.removeItem('nakamaUserId');
            setUser(undefined);
            throw new NakamaRequestError(response.status, '인증이 만료되었습니다');
          }
          throw new NakamaRequestError(response.status);
        }

        return response.json();
      };

      // Promise.race를 사용하여 타임아웃과 API 요청 중 먼저 완료되는 것을 처리
      const userData = await Promise.race([fetchData(), timeout]);
      setUser(userData);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('사용자 정보를 가져오는 중 오류가 발생했습니다'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 사용자 정보 가져오기
  useEffect(() => {
    fetchNakamaUser();
    
    // 로그인/로그아웃 이벤트 리스너 등록
    const handleUserStateChange = () => {
      fetchNakamaUser();
    };
    
    window.addEventListener('nakamaUserStateChanged', handleUserStateChange);
    
    // 클린업 함수
    return () => {
      window.removeEventListener('nakamaUserStateChanged', handleUserStateChange);
    };
  }, [fetchNakamaUser]);

  return {
    user: user?.user as NakamaUserProfile | undefined,
    error,
    isLoading,
    refreshUser: fetchNakamaUser
  };
}
