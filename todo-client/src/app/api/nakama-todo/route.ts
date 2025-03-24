import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { TodoInfo } from '../todoApi';

/**
 * Nakama 서버에 Todo 업데이트/생성 요청을 보내는 PUT API
 * RPC를 사용하여 처리합니다.
 */
export async function PUT(req: NextRequest) {
  try {
    // 사용자 세션 확인
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    // 요청 본문에서 데이터 추출
    const data = await req.json();
    const { collection, todoItem } = data;
    
    if (!collection || !todoItem) {
      return NextResponse.json(
        { error: 'collection과 todoItem 필드가 필요합니다' },
        { status: 400 }
      );
    }

    // Todo 아이템 ID 확인
    if (!todoItem.id) {
      return NextResponse.json(
        { error: 'Todo 아이템에 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 인증 토큰 가져오기
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '유효한 인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    // 버전 정보 가져오기 (업데이트의 경우)
    const version = todoItem.meta?.version || '*';
    
    // RPC 호출용 객체 생성
    const rpcBody = {
      todoItem: {
        collection: collection,
        key: todoItem.id.toString(),
        value: JSON.stringify({
          id: todoItem.id,
          text: todoItem.text,
          completed: todoItem.completed
        }),
        version: version
      }
    };
    
    // Nakama RPC 엔드포인트 호출
    const nakamaUrl = process.env.NAKAMA_URL || process.env.NEXT_PUBLIC_NAKAMA_URL;
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(`${nakamaUrl}/v2/rpc/update_todo?unwrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(rpcBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `Nakama 서버 요청 실패: ${response.status}`;
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    // RPC 응답 처리
    if (!result || result.error) {
      return NextResponse.json(
        { error: result?.error || '서버 응답에서 Todo 항목을 찾을 수 없습니다' },
        { status: 500 }
      );
    }
    
    // 메타데이터 업데이트
    const updatedMeta = {
      collection: collection,
      create_time: todoItem.meta?.create_time || result.create_time,
      key: todoItem.id.toString(),
      permission_read: 2,
      permission_write: 1,
      update_time: result.update_time,
      user_id: session.user.sub || '',
      version: result.version
    };
    
    // 업데이트된 Todo 항목 반환
    const updatedTodo: TodoInfo = {
      ...todoItem,
      meta: updatedMeta
    };
    
    return NextResponse.json({
      success: true,
      data: updatedTodo
    });
    
  } catch (error) {
    console.error('Nakama Todo 처리 중 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 