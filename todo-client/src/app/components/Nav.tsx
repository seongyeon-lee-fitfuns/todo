"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNakamaUser } from '@/app/login/useNakamaUser';
import { useLogin } from '@/app/login/useLogin';

export default function Nav() {
  const { user, error: nakamaError, isLoading: nakamaLoading } = useNakamaUser();
  const { handleLogin, handleLogout, error: loginError, isLoading: loginLoading } = useLogin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 에러 메시지를 표시하는 함수
  const renderErrorMessage = () => {
    if (loginError) {
      return (
        <div className="text-red-500 text-sm mt-2">
          {loginError || '로그인에 실패했습니다.'}
        </div>
      );
    }
    return null;
  };
  
  return (
    <nav className="bg-gray-800/90 backdrop-blur-md text-white p-4 sticky top-0 z-10 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold font-mono">Todo App</Link>
        
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/" className="hover:text-gray-300 transition duration-200">홈</Link>
          <Link href="/todos" className="hover:text-gray-300 transition duration-200">할 일 목록</Link>
          {nakamaLoading ? (
            <div className="w-24 h-8 bg-gray-700 animate-pulse rounded"></div>
          ) : user ? (
            <>
              <span className="text-gray-300">안녕하세요, {user.displayName || user.username}님!</span>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button 
                  onClick={handleLogout} 
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg shadow-md transition duration-200"
                >
                  로그아웃
                </button>
              </motion.div>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex flex-col">
              <button 
                onClick={handleLogin}
                disabled={loginLoading}
                className={`px-4 py-2 rounded-lg shadow-md transition duration-200 ${
                  loginLoading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loginLoading ? '로그인 중...' : '로그인'}
              </button>
              {renderErrorMessage()}
            </motion.div>
          )}
        </div>
        
        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="focus:outline-none"
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-gray-700/90 backdrop-blur-md mt-2 p-4 rounded-lg shadow-lg"
        >
          <div className="flex flex-col space-y-4">
            <Link href="/" className="hover:text-gray-300 py-2">홈</Link>
            <Link href="/todos" className="hover:text-gray-300 py-2">할 일 목록</Link>
            {nakamaLoading ? (
              <div className="w-full h-10 bg-gray-600 animate-pulse rounded"></div>
            ) : user ? (
              <>
                <span className="text-gray-300 py-2">안녕하세요, {user.displayName || user.username}님!</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-center transition duration-200"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <div className="flex flex-col">
                <button 
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className={`px-4 py-2 rounded text-center transition duration-200 ${
                    loginLoading 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {loginLoading ? '로그인 중...' : '로그인'}
                </button>
                {renderErrorMessage()}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
} 