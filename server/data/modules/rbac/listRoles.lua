local nk = require("nakama")

-- 역할 목록 조회 함수
nk.register_rpc(function(context, payload)
    -- 요청 검증
    if context.user_id == nil then
        error("인증되지 않은 사용자입니다")
    end
    
    -- 페이로드 파싱 (필터 등이 있을 수 있음)
    local json_payload = nil
    if payload and payload ~= "" then
        json_payload = nk.json_decode(payload)
    end
    
    -- 스토리지에서 모든 역할 읽기
    local success, result = pcall(function()
        return nk.storage_list(nil, "rbac_roles", nil, nil, 100)
    end)
    
    if not success then
        nk.logger_error("역할 목록 조회 실패: " .. tostring(result))
        error("역할 목록 조회 중 오류 발생: " .. tostring(result))
    end
    
    -- 결과 가공
    local roles = {}
    for _, role in ipairs(result.objects) do
        table.insert(roles, role.value)
    end
    
    return nk.json_encode({
        success = true,
        roles = roles,
        total_count = #roles
    })
end, "rbac_list_roles") 