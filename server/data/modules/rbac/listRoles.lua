local nk = require("nakama")

local function list_all(context, payload)
    local all_results = {}
    local next_cursor = nil
    repeat
      local results, cursor = nk.storage_list(nil, "rbac_roles", 100, next_cursor)
      for _, result in ipairs(results) do
        -- 간결한 역할 정보로 변환
        local role_info = result.value
        role_info.key = result.key
        role_info.create_time = result.create_time
        role_info.update_time = result.update_time
        table.insert(all_results, role_info)
      end
      next_cursor = cursor
    until (not next_cursor)
  
    return all_results
end

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
    
    local limit = 100
    local success, result = pcall(function()
        return list_all(context, payload)
    end)

    if not success then
        nk.logger_error("역할 목록 조회 실패: " .. tostring(result))
        error("역할 목록 조회 중 오류 발생: " .. tostring(result))
    end

    return nk.json_encode({
        success = true,
        roles = result,
        total_count = #result
    })
end, "rbac_list_roles") 