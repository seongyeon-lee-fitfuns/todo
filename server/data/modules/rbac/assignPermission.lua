local nk = require("nakama")

-- 역할에 권한 할당 함수
nk.register_rpc(function(context, payload)
    -- 요청 검증
    if context.user_id == nil then
        error("인증되지 않은 사용자입니다")
    end
    
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    if not json_payload.role_name or not json_payload.permission then
        error("필수 정보가 누락되었습니다: 역할 이름과 권한이 필요합니다")
    end
    
    -- 관리자 권한 확인 (추후 구현 가능)
    -- TODO: 여기에 관리자 확인 로직 추가
    
    -- 스토리지에서 역할 읽기
    local read_success, read_result = pcall(function()
        return nk.storage_read({
            {
                collection = "rbac_roles",
                key = json_payload.role_name,
                user_id = nil
            }
        })
    end)
    
    if not read_success or #read_result == 0 then
        error("역할을 찾을 수 없습니다: " .. json_payload.role_name)
    end
    
    -- 역할 데이터 가져오기
    local role_data = read_result[1].value
    
    -- 권한이 이미 있는지 확인
    local permission_exists = false
    role_data.permissions = role_data.permissions or {}
    
    for _, perm in ipairs(role_data.permissions) do
        if perm == json_payload.permission then
            permission_exists = true
            break
        end
    end
    
    -- 권한이 없으면 추가
    if not permission_exists then
        table.insert(role_data.permissions, json_payload.permission)
        role_data.updated_at = os.date("!%Y-%m-%dT%H:%M:%SZ")
        
        -- 스토리지에 업데이트된 역할 저장
        local storage_object = {
            collection = "rbac_roles",
            key = json_payload.role_name,
            user_id = nil,
            value = role_data,
            version = read_result[1].version,
            permission_read = 1,
            permission_write = 1
        }
        
        local write_success, write_result = pcall(function()
            return nk.storage_write({storage_object})
        end)
        
        if not write_success then
            nk.logger_error("권한 할당 실패: " .. tostring(write_result))
            error("권한 할당 중 오류 발생: " .. tostring(write_result))
        end
    end
    
    return nk.json_encode({
        success = true,
        role = role_data,
        message = permission_exists and "권한이 이미 역할에 존재합니다" or "권한이 성공적으로 할당되었습니다"
    })
end, "rbac_assign_permission") 