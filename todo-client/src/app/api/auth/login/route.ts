import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const username = session?.user?.name;
    const userEmail = session?.user?.email;

    // TODO:  defaultkey 환경변수로 변경
    const auth = Buffer.from('defaultkey:').toString('base64');
    
    
    // TODO: nakama 서버 주소 환경변수로 변경
    const response = await fetch(`http://localhost:7350/v2/account/authenticate/custom?create=true&username=${username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        id: userEmail // unique한 email 사용, 이름은 겹칠 수도
      })
    });
    console.log(response);

    if (!response.ok) {
      throw new Error('인증 실패');
    }
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
