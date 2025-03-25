local nk = require("nakama")

local M = {} -- 모듈 테이블

-- 그룹 메타데이터를 추출하는 유틸 함수
function M.extract_group_metadata(user_id)
    local groups = nk.user_groups_list(user_id)
    nk.logger_info("유저가 속한 그룹: " .. nk.json_encode(groups))

    local metadata_list = {}
    for _, group in ipairs(groups) do
        local metadata = group.group.metadata
        if metadata then
            table.insert(metadata_list, metadata)
        end
    end
    return metadata_list
end

-- 관리자 권한 확인 함수
function M.is_admin(user_id)
    local permissions = M.extract_group_metadata(user_id)
    nk.logger_info("권한 정보: " .. nk.json_encode(permissions))
    
    -- 관리자 권한 확인
    for _, metadata_info in ipairs(permissions) do
        if metadata_info.permission == "all" then
            nk.logger_info("관리자 권한 확인됨")
            return true
        end
    end
    
    nk.logger_info("관리자 권한 없음")
    return false
end

-- 특정 권한 확인 함수
function M.has_permission(user_id, required_permission)
    local permissions = M.extract_group_metadata(user_id)
    
    for _, metadata_info in ipairs(permissions) do
        if metadata_info.permission == required_permission or metadata_info.permission == "all" then
            return true
        end
    end
    
    return false
end

-- 권한 검사 및 에러 처리 함수
function M.check_admin_permission(user_id)
    if not M.is_admin(user_id) then
        nk.logger_info("권한 검사 실패")
        error(nk.json_encode({message = "권한이 없습니다.", code = 16}))
    end
    nk.logger_info("권한 검사 통과")
    return true
end

-- 권한 관련 RPC 핸들러를 래핑하는 유틸리티 함수
function M.with_admin_permission(handler_fn)
    return function(context, payload)
        M.check_admin_permission(context.user_id)
        return handler_fn(context, payload)
    end
end

return M 