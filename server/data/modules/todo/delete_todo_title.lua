local nk = require("nakama")


nk.register_rpc(function(context, payload)
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    nk.logger_info("페이로드: " .. nk.json_encode(json_payload))
    local title = json_payload
    nk.logger_info("title: " .. nk.json_encode(title))

    -- TODO: 추후 여기에 권한 검사 로직을 추가할 수 있습니다.

    
    -- 스토리지 쓰기 객체 구성
    local storage_object = {
        collection = "todo_title",
        key = "all_title",
        -- todo 기존 제목 목록에 추가
        value = json_payload,
        version = "*",
        permission_read = 2,
        permission_write = 1
    }
    
    
    -- 스토리지 쓰기 작업 수행
    local success, result = pcall(function()
        -- 먼저 기존 데이터 읽기
        local read_success, read_result = pcall(function()
            return nk.storage_read({
                {collection = "todo_title", key = "all_title", user_id = nil}
            })
        end)
        
        -- 기존 데이터가 있는지 확인
        if read_success and #read_result > 0 then
            -- 기존 데이터에서 제목 삭제
            local existing_data = read_result[1].value
            
            -- 기존 데이터가 배열이 아니면 배열로 변환
            if not existing_data.titles then
                existing_data = {titles = {}}
            else
                -- 삭제할 제목 찾기
                local new_titles = {}
                for i, title in ipairs(existing_data.titles) do
                    if title ~= json_payload.title then
                        table.insert(new_titles, title)
                    end
                end
                existing_data.titles = new_titles
            end
            
            -- 스토리지 객체 업데이트
            storage_object.value = existing_data
            storage_object.version = read_result[1].version
        else
            -- 기존 데이터가 없으면 빈 배열 생성
            storage_object.value = {titles = {}}
        end
        
        return nk.storage_write({storage_object})
    end)

    if success then
        nk.logger_info("Result: " .. nk.json_encode(result))
    else
        nk.logger_info("Error result: " .. tostring(result))
    end
    
    -- 에러 처리
    if not success then
        nk.logger_error("Todo 제목 삭제 실패: " .. tostring(result))
        error("Todo 제목 삭제 중 오류 발생: " .. tostring(result))
    end
    
    -- 현재 시간 생성
    local current_time = os.date("!%Y-%m-%dT%H:%M:%SZ")
  
    
    return nk.json_encode(storage_object.value)
end, "delete_todo_title")
