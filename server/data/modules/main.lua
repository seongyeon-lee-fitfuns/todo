local nk = require("nakama")

nk.logger_info("Hello, world!")

nk.register_rpc(function(context, payload)
    local user_id = context.user_id
    local storage_object = nk.storage_read(user_id, "user_data")
    nk.logger_info("Storage object: " .. storage_object)
    nk.logger_info("Payload: " .. payload)
    return payload
end, "ReadStorageObject")

nk.register_req_before(function(context, payload)
    nk.logger_info("Before ")
    return payload
end, "hello")

-- Todo 항목 업데이트하는 RPC 함수
nk.register_rpc(function(context, payload)
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    local todo_id = json_payload.id
    local todo_text = json_payload.text
    local todo_completed = json_payload.completed
    local collection = json_payload.collection
    local version = json_payload.version or "*"
    
    -- 스토리지 쓰기 객체 구성
    local storage_object = {
        collection = collection,
        key = tostring(todo_id),
        value = nk.json_encode({
            id = todo_id,
            text = todo_text,
            completed = todo_completed
        }),
        version = version,
        permission_read = 2,
        permission_write = 1
    }
    
    -- 스토리지 쓰기 작업 수행
    local success, result = pcall(function()
        return nk.storage_write(context.user_id, {storage_object})
    end)
    
    -- 에러 처리
    if not success then
        nk.logger_error("Todo 업데이트 실패: " .. tostring(result))
        error("Todo 업데이트 중 오류 발생: " .. tostring(result))
    end
    
    -- 응답에서 첫 번째 객체 가져오기
    local updated_object = result[1]
    if not updated_object then
        error("서버 응답에서 Todo 항목을 찾을 수 없습니다")
    end
    
    -- 업데이트된 Todo 항목 반환
    local response = {
        id = todo_id,
        text = todo_text,
        completed = todo_completed,
        meta = {
            collection = collection,
            create_time = updated_object.create_time,
            key = tostring(todo_id),
            permission_read = 2,
            permission_write = 1,
            update_time = updated_object.update_time,
            user_id = context.user_id,
            version = updated_object.version
        }
    }
    
    return nk.json_encode(response)
end, "UpdateTodo")

