'use client'
export default function Login() {
    return (
        <div>
            <button onClick={() => {
                fetch('/api/auth/login', {
                    method: 'POST',
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('로그인 실패');
                    }
                    return response.json();
                })
                .then(data => {
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
                })
                .catch(error => {
                    console.error('로그인 에러:', error);
                    alert('로그인에 실패했습니다.');
                });
            }}>Login</button>
        </div>
    )
}