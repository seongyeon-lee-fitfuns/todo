local nk = require("nakama")

-- 사용자에게 역할 할당 함수
nk.register_rpc(function(context, payload)
    -- 요청 검증
    if context.user_id == nil then
        error("인증되지 않은 사용자입니다")
    end
    
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    if not json_payload.user_id or not json_payload.role_name then
        error("필수 정보가 누락되었습니다: 사용자 ID와 역할 이름이 필요합니다")
    end
    
    -- 관리자 권한 확인 (추후 구현 가능)
    -- TODO: 여기에 관리자 확인 로직 추가
    
    -- 역할이 존재하는지 확인
    local role_success, role_result = pcall(function()
        return nk.storage_read({
            {
                collection = "rbac_roles",
                key = json_payload.role_name,
                user_id = nil
            }
        })
    end)
    
    if not role_success or #role_result == 0 then
        error("역할을 찾을 수 없습니다: " .. json_payload.role_name)
    end
    
    -- 사용자 역할 매핑 읽기
    local read_success, read_result = pcall(function()
        return nk.storage_read({
            {
                collection = "rbac_user_roles",
                key = json_payload.user_id,
                user_id = nil
            }
        })
    end)
    
    local user_roles = {}
    if read_success and #read_result > 0 then
        user_roles = read_result[1].value
    else
        user_roles = {
            roles = {},
            created_at = os.date("!%Y-%m-%dT%H:%M:%SZ"),
            updated_at = os.date("!%Y-%m-%dT%H:%M:%SZ")
        }
    end
    
    -- 역할이 이미 있는지 확인
    local role_exists = false
    user_roles.roles = user_roles.roles or {}
    
    for _, role in ipairs(user_roles.roles) do
        if role == json_payload.role_name then
            role_exists = true
            break
        end
    end
    
    -- 역할이 없으면 추가
    if not role_exists then
        table.insert(user_roles.roles, json_payload.role_name)
        user_roles.updated_at = os.date("!%Y-%m-%dT%H:%M:%SZ")
        
        -- 스토리지에 업데이트된 사용자-역할 매핑 저장
        local storage_object = {
            collection = "rbac_user_roles",
            key = json_payload.user_id,
            user_id = nil,
            value = user_roles,
            version = (read_success and #read_result > 0) and read_result[1].version or "*",
            permission_read = 1,
            permission_write = 1
        }
        
        local write_success, write_result = pcall(function()
            return nk.storage_write({storage_object})
        end)
        
        if not write_success then
            nk.logger_error("역할 할당 실패: " .. tostring(write_result))
            error("역할 할당 중 오류 발생: " .. tostring(write_result))
        end
    end
    
    return nk.json_encode({
        success = true,
        user_id = json_payload.user_id,
        role_name = json_payload.role_name,
        user_roles = user_roles,
        message = role_exists and "역할이 이미 사용자에게 할당되어 있습니다" or "역할이 성공적으로 할당되었습니다"
    })
end, "rbac_assign_role") 