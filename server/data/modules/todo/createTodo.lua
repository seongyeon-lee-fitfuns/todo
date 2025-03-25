local nk = require("nakama")
local permissions = require("auth.permissions")

-- 원래 핸들러 함수를 정의합니다
local function handle_create_todo(context, payload)
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    nk.logger_info("페이로드: " .. nk.json_encode(json_payload))
    
    -- objects에서 필요한 정보 추출
    local obj = json_payload.objects
    local collection = obj.collection
    local key = obj.key
    
    local value_obj = nk.json_decode(obj.value)
    
    -- 스토리지 쓰기 객체 구성
    local storage_object = {
        collection = collection,
        key = key,
        value = value_obj,
        version = "*",
        permission_read = 2,
        permission_write = 1
    }
    
    -- 스토리지 쓰기 작업 수행
    local success, result = pcall(function()
        return nk.storage_write({storage_object})
    end)

    if success then
        nk.logger_info("Result: " .. nk.json_encode(result))
    else
        nk.logger_info("Error result: " .. tostring(result))
    end
    
    -- 에러 처리
    if not success then
        nk.logger_error("Todo 업데이트 실패: " .. tostring(result))
        error("Todo 업데이트 중 오류 발생: " .. tostring(result))
    end
    
    -- 현재 시간 생성
    local current_time = os.date("!%Y-%m-%dT%H:%M:%SZ")
    
    -- 업데이트된 Todo 항목 반환
    local response = {
        id = value_obj.id,
        text = value_obj.text,
        completed = value_obj.completed,
        meta = {
            collection = collection,
            create_time = value_obj.meta and value_obj.meta.create_time,
            key = key,
            permission_read = 2,
            permission_write = 1,
            update_time = current_time,
            user_id = context.user_id,
            version = result[1].version
        }
    }
    
    return nk.json_encode(response)
end

-- 핸들러를 admin 권한으로 래핑하여 RPC 등록
nk.register_rpc(permissions.with_admin_permission(handle_create_todo), "create_todo")
