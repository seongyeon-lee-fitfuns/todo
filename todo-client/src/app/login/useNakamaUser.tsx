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
      return;
    }

    try {
      // Nakama API에서 사용자 정보 가져오기
      const nakamaUrl = process.env.NEXT_PUBLIC_NAKAMA_URL;
      if (!nakamaUrl) {
        throw new Error('NEXT_PUBLIC_NAKAMA_URL 환경 변수가 설정되지 않았습니다');
      }

      const response = await fetch(`${nakamaUrl}/v2/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰이 만료된 경우 리프레시 토큰으로 갱신을 시도할 수 있음
          // 이 부분은 별도로 구현 필요
          throw new NakamaRequestError(response.status, '인증이 만료되었습니다');
        }
        throw new NakamaRequestError(response.status);
      }

      const userData = await response.json();
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
  }, [fetchNakamaUser]);

  return {
    user: user?.user as NakamaUserProfile | undefined,
    error,
    isLoading,
    refreshUser: fetchNakamaUser
  };
}
