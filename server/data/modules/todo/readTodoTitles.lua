local nk = require("nakama")
local permissions = require("auth.permissions")

-- 핸들러 함수 정의
local function handle_read_todo_titles(context, payload)
    -- 페이로드 파싱 (읽기에는 특별한 페이로드가 필요 없을 수 있습니다)
    local json_payload = nil
    if payload and payload ~= "" then
        json_payload = nk.json_decode(payload)
        nk.logger_info("페이로드: " .. nk.json_encode(json_payload))
    end

    -- 스토리지에서 Todo 제목 목록 읽기
    local success, result = pcall(function()
        return nk.storage_read({
            {collection = "todo_title", key = "all_title", user_id = nil}
        })
    end)
    
    -- 에러 처리
    if not success then
        nk.logger_error("Todo 제목 읽기 실패: " .. tostring(result))
        error("Todo 제목 읽기 중 오류 발생: " .. tostring(result))
    end
    
    -- 현재 시간 생성
    local current_time = os.date("!%Y-%m-%dT%H:%M:%SZ")
    
    -- 결과 처리
    local response = {}
    if #result > 0 then
        -- 데이터가 존재하는 경우
        response = {
            titles = result[1].value.titles or {},
            meta = {
                collection = result[1].collection,
                create_time = result[1].create_time,
                key = result[1].key,
                permission_read = result[1].permission_read,
                permission_write = result[1].permission_write,
                update_time = result[1].update_time,
                version = result[1].version
            }
        }
    else
        -- 데이터가 없는 경우 빈 배열 반환
        response = {
            titles = {},
            meta = {
                collection = "todo_title",
                create_time = current_time,
                key = "all_title",
                permission_read = 2,
                permission_write = 1,
                update_time = current_time
            }
        }
    end

    return nk.json_encode(response)
end

-- 핸들러를 RPC 등록 (읽기 작업이므로 권한 확인 없이 등록)
nk.register_rpc(handle_read_todo_titles, "read_todo_titles")
