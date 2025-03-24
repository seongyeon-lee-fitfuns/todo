local nk = require("nakama")

-- 사용자에서 역할 제거 함수
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
    
    -- 사용자에게 할당된 역할이 없는 경우
    if not read_success or #read_result == 0 then
        return nk.json_encode({
            success = false,
            message = "사용자에게 할당된 역할이 없습니다"
        })
    end
    
    -- 사용자 역할 데이터 가져오기
    local user_roles = read_result[1].value
    user_roles.roles = user_roles.roles or {}
    
    -- 역할 제거
    local role_removed = false
    for i, role in ipairs(user_roles.roles) do
        if role == json_payload.role_name then
            table.remove(user_roles.roles, i)
            role_removed = true
            break
        end
    end
    
    -- 역할이 제거되었으면 저장
    if role_removed then
        user_roles.updated_at = os.date("!%Y-%m-%dT%H:%M:%SZ")
        
        -- 스토리지에 업데이트된 사용자-역할 매핑 저장
        local storage_object = {
            collection = "rbac_user_roles",
            key = json_payload.user_id,
            user_id = nil,
            value = user_roles,
            version = read_result[1].version,
            permission_read = 1,
            permission_write = 1
        }
        
        local write_success, write_result = pcall(function()
            return nk.storage_write({storage_object})
        end)
        
        if not write_success then
            nk.logger_error("역할 제거 실패: " .. tostring(write_result))
            error("역할 제거 중 오류 발생: " .. tostring(write_result))
        end
    end
    
    return nk.json_encode({
        success = true,
        user_id = json_payload.user_id,
        user_roles = user_roles,
        message = role_removed and "역할이 성공적으로 제거되었습니다" or "사용자에게 해당 역할이 할당되어 있지 않습니다"
    })
end, "rbac_remove_role") 