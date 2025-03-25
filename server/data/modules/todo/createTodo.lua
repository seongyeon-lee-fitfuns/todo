local nk = require("nakama")

-- 그룹 메타데이터를 추출하는 유틸 함수
local function extract_group_metadata(user_id)
    local groups = nk.user_groups_list(user_id)
    nk.logger_info("유저가 속한 그룹: " .. nk.json_encode(groups))

    local metadata_list = {}
    for _, group in ipairs(groups) do
        local metadata = group.group.metadata
        if metadata then
            table.insert(metadata_list,
                metadata
            )
        end
    end
    return metadata_list
end

nk.register_rpc(function(context, payload)
    -- 페이로드 파싱
    local json_payload = nk.json_decode(payload)
    nk.logger_info("페이로드: " .. nk.json_encode(json_payload))
    
    -- 유저가 속한 그룹 확인
    local user_id = context.user_id
    local permissions = extract_group_metadata(user_id)
    nk.logger_info("권한 정보: " .. nk.json_encode(permissions))

    
 
    -- objects에서 필요한 정보 추출
    local obj = json_payload.objects
    local collection = obj.collection
    local key = obj.key
    
    nk.logger_info("obj: " .. nk.json_encode(obj))
    local value_obj = nk.json_decode(obj.value)
    -- TODO: 추후 여기에 권한 검사 로직을 추가할 수 있습니다.
    -- 관리자 권한 확인
    local is_admin = false
    
    nk.logger_info("EXTRACTED METADATA: " .. nk.json_encode(permissions))
    -- 그룹 메타데이터에서 권한 확인
    for _, metadata_info in ipairs(permissions) do
        -- JSON 문자열을 Lua 테이블로 디코딩
        nk.logger_info("METADATA INFO: " .. nk.json_encode(metadata_info))
        if metadata_info.permission == "all" then
            is_admin = true
            break
        end
    end
    
    if is_admin then
        nk.logger_info("권한 검사 통과")
    else
        nk.logger_info("권한 검사 실패")
        return error({
            code = 401,
            message = "권한이 없습니다."
        })
    end

    
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
end, "create_todo")
