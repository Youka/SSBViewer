CodeMirror.defineMode('ssb', function(){
	return{
		startState: function(){
			return {context: 0};
		},
		token: function(stream, state) {
			if(stream.sol()){
				if(stream.indentation()){
					stream.skipToEnd();
					return "error";
				}else if(stream.match("//")){
					stream.skipToEnd();
					return "comment";
				}else if(stream.eat("#")){
					stream.skipToEnd();
					if(stream.current() == "#EVENTS")
						state.context = 2;
					else if(stream.current() == "#STYLES")
						state.context = 1;
					else
						state.context = 0;
					return "def";
				}else if(state.context <= 1 && stream.match(/.*: /))
					return "keyword";
				else if(state.context == 2 && stream.match(/[\d:.]+-[\d:.]+\|.*\|.*\|/))
					return "number";
			}else if(state.context >= 1 && stream.match(/{[^}]*}/))
				return "string";
			stream.next();
			return null;
		}
	}
});
CodeMirror.defineMIME("text/ssb", "ssb");