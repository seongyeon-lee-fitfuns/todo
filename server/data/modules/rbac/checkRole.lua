local nk = require("nakama")

-- 사용자의 역할 확인 함수
nk.register_rpc(function(context, payload)
    -- 요청 검증
    if context.user_id == nil then
        error("인증되지 않은 사용자입니다")
    end
    
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    local user_id = json_payload.user_id or context.user_id
    local role_name = json_payload.role_name
    
    if not role_name then
        error("필수 정보가 누락되었습니다: 역할 이름이 필요합니다")
    end
    
    -- 사용자 역할 매핑 읽기
    local read_success, read_result = pcall(function()
        return nk.storage_read({
            {
                collection = "rbac_user_roles",
                key = user_id,
                user_id = nil
            }
        })
    end)
    
    -- 사용자에게 할당된 역할이 없는 경우
    if not read_success or #read_result == 0 then
        return nk.json_encode({
            success = true,
            has_role = false,
            message = "사용자에게 할당된 역할이 없습니다"
        })
    end
    
    -- 사용자 역할 데이터 가져오기
    local user_roles = read_result[1].value
    user_roles.roles = user_roles.roles or {}
    
    -- 역할 확인
    local has_role = false
    for _, role in ipairs(user_roles.roles) do
        if role == role_name then
            has_role = true
            break
        end
    end
    
    return nk.json_encode({
        success = true,
        has_role = has_role,
        user_id = user_id,
        role_name = role_name,
        message = has_role and "사용자에게 해당 역할이 할당되어 있습니다" or "사용자에게 해당 역할이 할당되어 있지 않습니다"
    })
end, "rbac_check_role") 