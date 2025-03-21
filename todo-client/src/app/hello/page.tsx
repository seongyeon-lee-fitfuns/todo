'use client';

import { motion, useAnimationControls, Variants } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Home() {
  const text = "HELLO WORLD";
  const [isHovered, setIsHovered] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const controls = useAnimationControls();

  // 물리 효과가 적용된 애니메이션 변수
  const letterVariants: Variants = {
    hover: (i: number) => ({
      y: [-15, 0, -7, 0, -3, 0],
      rotateZ: [0, 10, -10, 5, -5, 0],
      scale: [1, 1.2, 0.9, 1.1, 1],
      transition: {
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        duration: 0.6,
        ease: "easeInOut",
        delay: i * 0.05
      }
    }),
    // 중력 효과 - 아래로 떨어지는 애니메이션
    fall: {
      y: [0, 200, 400, 600],
      opacity: [1, 1, 0.5, 0],
      rotateZ: [0, 45, 90, 180],
      transition: {
        times: [0, 0.3, 0.6, 1],
        duration: 1.5,
        ease: "easeIn"
      }
    },
    // 튕기는 효과 - 클릭 시 적용
    bounce: {
      y: [0, -100, 0, -50, 0, -20, 0],
      scale: [1, 1.3, 1, 1.1, 1, 1.05, 1],
      transition: {
        times: [0, 0.2, 0.4, 0.6, 0.7, 0.9, 1],
        duration: 0.8,
        ease: "easeOut"
      }
    },
    // 물리 진동 효과 - 마우스 오버 시 적용되는 지속적 효과
    vibrate: (i: number) => ({
      x: [0, -2, 2, -1, 1, 0],
      y: [0, 1, -1, 1, -1, 0],
      transition: {
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        duration: 0.3,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
        delay: i * 0.02
      }
    }),
    // 기본 상태
    initial: { 
      y: 0, 
      rotateZ: 0, 
      scale: 1,
      x: 0
    },
    // 초기 애니메이션
    animate: (i: number) => ({
      y: [50, 0],
      opacity: [0, 1],
      transition: {
        duration: 0.7,
        delay: i * 0.1,
        ease: [0.16, 1, 0.3, 1] // 탄성 효과를 위한 커스텀 ease
      }
    })
  };

  // 글자가 공중에 떠있는 효과를 주는 컨테이너 애니메이션
  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    },
    shake: {
      x: [0, -10, 10, -5, 5, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  // 페이지 로드 시 연쇄 물리 효과
  useEffect(() => {
    // 1초 후 전체 텍스트에 진동 효과
    const timer = setTimeout(() => {
      controls.start("shake").then(() => {
        controls.start("animate");
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [controls]);

  // 글자 클릭 핸들러
  const handleClick = (index: number) => {
    setClickedIndex(index);
    // 0.8초 후 초기화
    setTimeout(() => {
      setClickedIndex(null);
    }, 800);
  };

  // 연속적인 글자 효과를 위한 트리거
  const handleChainReaction = () => {
    // 모든 글자에 순차적으로 애니메이션 효과
    for (let i = 0; i < text.length; i++) {
      setTimeout(() => {
        setClickedIndex(i);
        // 다음 글자로 넘어가기 전에 이전 글자 효과 제거
        setTimeout(() => setClickedIndex(null), 200);
      }, i * 150);
    }
  };

  return (
	<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
		<motion.div 
			className="flex flex-wrap justify-center gap-2 md:gap-3 text-5xl font-bold"
			variants={containerVariants}
			initial="initial"
			animate={controls}
			onClick={handleChainReaction}
      >
			{text.split('').map((char, i) => {
          // 현재 글자의 애니메이션 상태 결정
          const currentState = 
            clickedIndex === i
              ? "bounce"
              : isHovered === i
              ? "vibrate"
              : "initial";
              
          return (
	<motion.span
		key={`${char}-${i}`}
		custom={i}
		variants={letterVariants}
		initial="initial"
		animate={currentState}
		whileHover="hover"
		onHoverStart={() => setIsHovered(i)}
		onHoverEnd={() => setIsHovered(null)}
		onClick={(e) => {
                e.stopPropagation();
                handleClick(i);
              }}
		className={`inline-block cursor-pointer ${char === ' ' ? 'w-6' : ''}`}
		style={{
                color: isHovered === i 
                  ? `hsl(${i * 30}, 100%, 50%)` 
                  : clickedIndex === i 
                  ? `hsl(${i * 30 + 180}, 100%, 60%)` 
                  : 'black',
                textShadow: (isHovered === i || clickedIndex === i) 
                  ? '0px 3px 5px rgba(0, 0, 0, 0.2)' 
                  : 'none',
                transformOrigin: 'bottom',
                display: 'inline-block',
                padding: '0 0.1em',
                userSelect: 'none',
                perspective: '1000px'
              }}
            >
		{char === ' ' ? '\u00A0' : char}
	</motion.span>
          );
        })}
		</motion.div>
      
		<motion.div
			className="cursor-pointer px-4 py-2 text-white rounded-md shadow-md"
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			onClick={handleChainReaction}
      >
			👋
		</motion.div>
	</div>
  );
}
