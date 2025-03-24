local nk = require("nakama")

-- 사용자의 권한 확인 함수
nk.register_rpc(function(context, payload)
    -- 요청 검증
    if context.user_id == nil then
        error("인증되지 않은 사용자입니다")
    end
    
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    local user_id = json_payload.user_id or context.user_id
    local permission = json_payload.permission
    
    if not permission then
        error("필수 정보가 누락되었습니다: 권한이 필요합니다")
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
            has_permission = false,
            message = "사용자에게 할당된 역할이 없습니다"
        })
    end
    
    -- 사용자 역할 데이터 가져오기
    local user_roles = read_result[1].value
    user_roles.roles = user_roles.roles or {}
    
    -- 각 역할에 대해 권한 확인
    local has_permission = false
    local allowed_by_role = nil
    
    for _, role_name in ipairs(user_roles.roles) do
        -- 역할 정보 읽기
        local role_success, role_result = pcall(function()
            return nk.storage_read({
                {
                    collection = "rbac_roles",
                    key = role_name,
                    user_id = nil
                }
            })
        end)
        
        if role_success and #role_result > 0 then
            local role_data = role_result[1].value
            role_data.permissions = role_data.permissions or {}
            
            -- 권한 확인
            for _, perm in ipairs(role_data.permissions) do
                if perm == permission then
                    has_permission = true
                    allowed_by_role = role_name
                    break
                end
            end
            
            if has_permission then
                break
            end
        end
    end
    
    return nk.json_encode({
        success = true,
        has_permission = has_permission,
        user_id = user_id,
        permission = permission,
        allowed_by_role = allowed_by_role,
        message = has_permission 
            and "사용자에게 해당 권한이 있습니다 (역할: " .. allowed_by_role .. ")" 
            or "사용자에게 해당 권한이 없습니다"
    })
end, "rbac_check_permission") 