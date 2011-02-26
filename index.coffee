_.templateSettings = 
    interpolate : /\{\{(.+?)\}\}/g

updateCodeForFunctionCall = (scope, line) ->
  code = ""
  args = makeVars k.s line, 1
  code += "scope.argsStack.push(scope.args)\n"
  code += "scope.args = [" + args.join(", ") + "]\n"
  code += "scope.stack.push(scope.pc)\n"
  for name, argNameIndex in scope.argNames[scope[line[0]]]
    code += interpolate """scope.#{name} = {{varValue}};\n""", varValue: line[argNameIndex + 1]
  code += interpolate "scope.set_pc = {{varValue}}\n", varValue: line[0]

makeVars = (vars) ->
  for name, value of vars
    if k.isNumeric value
      vars[name] = value
    else if value in ["object", "{}"]
      vars[name] = "{}"
    else if value in ["array", "[]"]
      vars[name] = "[]"
    else if k.startsWith(value, '"') or k.startsWith(value, "'")
      vars[name] = value
    else if value.match(/^[^A-Za-z0-9\.]/)
      vars[name] = '"'+value+'"'
    else
      if not k.startsWith(value, ".")
        value = "." + value
      value = value.replace /(?:\.{2}([\w]+)\b)/g, (a,b) -> 
        "[scope.#{b}]" #using the bracket notation
      value = value.replace /(?:\.(\w+)\b)/g, (a,b) ->
        "[\"#{b}\"]"
      vars[name] = "scope" + value
  vars  

interpolate = (str, rawVars) ->
  _.template str, makeVars rawVars

parse = window.parse = (txt) ->
  functions = []
  scope = {}
  txt = txt.split "\n"
  scope.split_lines = []
  scope.set_pc = -1
  scope.stack = []
  scope.argsStack = []
  scope.argNames = {}
  end_info = {} 
  end_stack = []
  start_stack = []

  new_lines = []
  index = 0
  #first pass
  for liner in txt
    end_pos = liner.indexOf(" ")
    if end_pos is -1 then end_pos = liner.length
    first_word = k.s liner, 0, end_pos
    end_pos_2 = liner.indexOf(" ", end_pos + 1)
    second_word = k.s liner, end_pos+1, end_pos_2 - end_pos-1

    if first_word in ["if"]
      end_stack.push index + 1
      start_stack.push first_word
    else if first_word in ["def", "begin"]
      end_stack.push index
      start_stack.push first_word
    if first_word in ["end"]
      end_val = end_stack.pop()
      end_info[end_val] = index
      start_word = start_stack.pop()
      if start_word == "def"
        liner = "return so"
      console.log end_info
    if first_word in ["else", "elseif"] #these act as both
      end_val = end_stack.pop()
      end_info[end_val] = index
      end_stack.push index

    if not (k(liner).startsWith("string") or k(liner).startsWith('"') or k(liner).startsWith('`') or k(liner).startsWith('str'))
      line = k.trimLeft liner
      line = k.trimRight line
      line = line.replace /\s+/, " "
      line = line.split " "
      if line[0] == "def"
        scope[line[1]] = index
        scope.argNames[index] = k.s(line, 2)

    if second_word == "="
      new_lines.push k(liner).s(end_pos_2 + 1)
      new_lines.push k(liner).s(0, end_pos_2) + " so"
      index += 2
    else if first_word is "if"
      new_lines.push k(liner).s(end_pos + 1)
      new_lines.push k(liner).s(0, end_pos) + " so"
      index += 2
    else 
      new_lines.push liner
      index += 1

  txt = new_lines
  scope.lines = txt

  for line, index in txt
    line = k.trimLeft line
    code = ""
    code += "/* #{index} */function(scope) {"
    if k.startsWith(line, "string") || k.startsWith(line, '"')
      code += "scope.so = \"" + k.s(line, line.indexOf(" ") + 1) + '"'
    else if k.startsWith line, "str"
      code += interpolate "{{varName}} = \"#{k.s(line, line.indexOf(' ', 4)+1)}\"", 
        varName: k.s(line, 4, line.indexOf(" ", 4)-4)
    else if k.startsWith line, "`"
      code += "scope.so = " +  k.s(line, line.indexOf(" ") + 1)
    else if k.startsWith line, "#"
      #pass
      #if vs hash
    else
      line = k.trimRight line
      line = line.replace /\s+/, " "
      line = line.split " "
      scope.split_lines[index] = line
      if line[0] is "set" or line[0] is "="
        if not line[2] then line[2] = "so"
        code += interpolate "{{varName}} = {{varValue}}", varName: line[1], varValue: line[2] 
      else if line[1] is "="
        if line.length == 3
          code += interpolate "{{varName}} = {{varValue}}", varName: line[0], varValue: line[2] 
        else
          # this doesn't work like I thought it might
          #code += updateCodeForFunctionCall(scope, k.s(line, 2))
          #code += interpolate "{{varName}} = scope.so", varName: line[0]

      else if line[0] is "goto"
        code += interpolate "scope.set_pc = {{varValue}}", varValue: line[1]
      else if line[0] is "if"
        code += interpolate """
          if (!{{condition}}) {
            scope.set_pc = #{end_info[index]}
            scope.follow_else = true
          } else {
            scope.follow_else = false
          }

        """, condition: line[1]
      else if line[0] is "elseif" or line[0] is "else" and line[1] is "if"
        condition = k.s(line, -1)[0]
        code += interpolate """
          if (scope.follow_else) {
            if (!{{condition}}) {
              scope.set_pc = #{end_info[index]}
              scope.follow_else = true
            } else {
              scope.follow_else = false
            }
          }
        """, condition: condition
      else if line[0] is "else"
        code += """
          if (!scope.follow_else) {
            scope.set_pc = #{end_info[index]}
          }
        """
      else if line[0] is "end"
        #pass
      else if line[0] is "ifgoto"
        code += interpolate """
          if ({{condition}}) {
            scope.set_pc = {{goto}}
          }
        """, condition: line[1], goto: line[2] 
      else if line[0] is "def"
        code += """
          scope.set_pc = #{end_info[index]}
        """
      else if line[0] is "label"
        scope[line[1]] = index #presetting the scope
        code += "//Label #{line[1]}\n"
      else if line[0] == "exit"
        code += "scope.__close__ = true"
      else if line[0] == "incr"
        if not line[2] then line[2] = "1"
        code += interpolate "{{varName}} = {{varName}} + {{varValue}}",
          varName: line[1]
          varValue: line[2]
      else if line[0] == "log"
        code += interpolate "console.log({{varName}})", varName: line[1]
      else if line[1] == "is"
        code += interpolate "scope.so = {{val1}} == {{val2}}",
          val1: line[0]
          val2: line[2]
      else if line[0] == "return"
        ret = makeVars k.s(line, 1, 1)
        code += "scope.so = " + ret[0] + ";\n"
        code += "scope.args = scope.argsStack.pop()\n;"
        code += "scope.set_pc = scope.stack.pop();\n"
      else if line[0] != "" and line.length > 1
        #code += "scope.set_pc = scope.call" tried to implement this in littlescipt
        code += updateCodeForFunctionCall(scope, line)
      else if line[0] != "" and line.length == 1
        code += interpolate "scope.so = {{varValue}}", varValue: line[0] 
    code += "}"
    functions.push(code)
 
  compiled = """
    scope = #{JSON.stringify scope}
    functions = [#{functions.join(",\n")}]
    scope.pc = 0
    scope.last_pc = 0
    scope.second_last_pc = 0
    for (var j=0; j<100; j++) {
      console.log("Executing line" + scope.pc + ": " + scope.lines[scope.pc])
      if (scope.pc >= functions.length || scope.__close__ == true) {
        break;  
      }
      //console.log("Executing: " + scope.lines[scope.pc])
      functions[scope.pc](scope);
      scope.not = ! scope.so
      scope.second_last_pc = scope.last_pc
      scope.last_pc = scope.pc
      if (scope.set_pc != -1) {
        scope.pc = scope.set_pc
        scope.set_pc = -1
      }
      scope.pc ++
    }
  """
  return compiled
