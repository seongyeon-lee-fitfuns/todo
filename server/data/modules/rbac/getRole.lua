local nk = require("nakama")

-- 역할 조회 함수
nk.register_rpc(function(context, payload)
    -- 요청 검증
    if context.user_id == nil then
        error("인증되지 않은 사용자입니다")
    end
    
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    if not json_payload.role_name then
        error("필수 정보가 누락되었습니다: 역할 이름이 필요합니다")
    end
    
    -- 스토리지에서 역할 읽기
    local success, result = pcall(function()
        return nk.storage_read({
            {
                collection = "rbac_roles",
                key = json_payload.role_name,
                user_id = nil
            }
        })
    end)
    
    if not success then
        nk.logger_error("역할 조회 실패: " .. tostring(result))
        error("역할 조회 중 오류 발생: " .. tostring(result))
    end
    
    -- 역할이 존재하지 않는 경우
    if #result == 0 then
        return nk.json_encode({
            success = false,
            message = "지정된 역할을 찾을 수 없습니다"
        })
    end
    
    return nk.json_encode({
        success = true,
        role = result[1].value
    })
end, "rbac_get_role") 