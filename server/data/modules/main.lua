local nk = require("nakama")

nk.logger_info("Hello, world!")

nk.register_rpc(function(context, payload)
    return "Hello, world! This is the my first lua rpc"
end, "hello")

nk.register_req_before(function(context, payload)
    nk.logger_info("Before AddFriends")
    return payload
end, "AddFriends")

nk.register_req_after(function(context, payload)
    nk.logger_info("After AddFriends")
    return payload
end, "AddFriends")


