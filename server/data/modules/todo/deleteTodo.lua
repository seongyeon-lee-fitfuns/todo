local nk = require("nakama")
local permissions = require("auth.permissions")

-- 핸들러 함수 정의
local function handle_delete_todo(context, payload)
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    nk.logger_info("페이로드: " .. nk.json_encode(json_payload))
    
    -- objects에서 필요한 정보 추출
    local obj = json_payload.objects
    local collection = obj.collection
    local key = obj.key

    nk.logger_info("obj: " .. nk.json_encode(obj))
    
    -- 스토리지 쓰기 객체 구성
    local storage_object = {
        collection = collection,
        key = key,
    }
    
    
    -- 스토리지 쓰기 작업 수행
    local success, result = pcall(function()
        return nk.storage_delete({storage_object})
    end)

    if success then
        nk.logger_info("Result: " ..  nk.json_encode(result))
    else
        nk.logger_info("Error result: " .. tostring(result))
    end
    
    -- 에러 처리
    if not success then
        nk.logger_error("Todo 삭제 실패: " .. tostring(result))
        error("Todo 삭제 중 오류 발생: " .. tostring(result))
    end
    
    -- 현재 시간 생성
    local current_time = os.date("!%Y-%m-%dT%H:%M:%SZ")
    
    -- 업데이트된 Todo 항목 반환
    local response = {
        id = key,
        meta = {
            collection = collection,
            key = key,
        }
    }
    
    return nk.json_encode(response)
end

-- 핸들러를 admin 권한으로 래핑하여 RPC 등록
nk.register_rpc(permissions.with_admin_permission(handle_delete_todo), "delete_todo")
