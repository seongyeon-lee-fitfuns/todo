local nk = require("nakama")

-- 역할 생성 함수
nk.register_rpc(function(context, payload)
    -- 요청 검증
    if context.user_id == nil then
        error("인증되지 않은 사용자입니다")
    end
    
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    if not json_payload.role_name or not json_payload.description then
        error("필수 정보가 누락되었습니다: 역할 이름과 설명이 필요합니다")
    end
    
    -- 관리자 권한 확인 (추후 구현 가능)
    -- TODO: 여기에 관리자 확인 로직 추가
    
    -- 역할 생성 시간
    local create_time = os.date("!%Y-%m-%dT%H:%M:%SZ")
    
    -- 역할 객체 생성
    local role_data = {
        role_name = json_payload.role_name,
        description = json_payload.description,
        permissions = json_payload.permissions or {},
        created_at = create_time,
        updated_at = create_time,
        created_by = context.user_id
    }
    
    -- 스토리지에 역할 저장
    local storage_object = {
        collection = "rbac_roles",
        key = json_payload.role_name,
        user_id = nil,  -- 전역 데이터로 저장
        value = role_data,
        permission_read = 1,  -- 소유자만 읽기 가능
        permission_write = 1  -- 소유자만 쓰기 가능
    }
    
    local success, result = pcall(function()
        return nk.storage_write({storage_object})
    end)
    
    if not success then
        nk.logger_error("역할 생성 실패: " .. tostring(result))
        error("역할 생성 중 오류 발생: " .. tostring(result))
    end
    
    return nk.json_encode({
        success = true,
        role = role_data,
        message = "역할이 성공적으로 생성되었습니다"
    })
end, "rbac_create_role")
