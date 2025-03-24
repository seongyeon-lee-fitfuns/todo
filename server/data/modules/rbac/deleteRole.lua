local nk = require("nakama")

-- 역할 삭제 함수
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
    
    -- 관리자 권한 확인 (추후 구현 가능)
    -- TODO: 여기에 관리자 확인 로직 추가
    
    -- 스토리지에서 역할 삭제
    local success, result = pcall(function()
        return nk.storage_delete({
            {
                collection = "rbac_roles",
                key = json_payload.role_name,
                user_id = nil
            }
        })
    end)
    
    if not success then
        nk.logger_error("역할 삭제 실패: " .. tostring(result))
        error("역할 삭제 중 오류 발생: " .. tostring(result))
    end
    
    -- 해당 역할이 할당된 모든 사용자에서 역할 제거 (추가 구현 필요)
    -- TODO: 사용자-역할 매핑 테이블에서 해당 역할 제거
    
    return nk.json_encode({
        success = true,
        message = "역할이 성공적으로 삭제되었습니다"
    })
end, "rbac_delete_role") 