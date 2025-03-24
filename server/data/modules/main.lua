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
