_.templateSettings = 
    interpolate : /\{\{(.+?)\}\}/g

makeVars = (vars) ->
  for name, value of vars
    if k.isNumeric value
      vars[name] = value
    else if value in ["object", "{}"]
      vars[name] = "{}"
    else if value in ["array", "[]"]
      vars[name] = "[]"
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
  scope.lines = txt
  for line, index in txt
    line = k.trimLeft line
    code = ""
    code += "function(scope) {"
    if k.startsWith(line, "string") || k.startsWith(line, '"')
      code += "scope.so = \"" + k.s(line, line.indexOf(" ") + 1) + '"'
      console.log line
      console.log k.s line, (line.indexOf(" ") + 1)
      console.log line.indexOf(" ")
    else if k.startsWith line, "str"
      code += interpolate "{{varName}} = \"#{k.s(line, line.indexOf(' ', 4)+1)}\"", 
        varName: k.s(line, 4, line.indexOf(" ", 4)-4)
    else if k.startsWith line, "`"
      code += k.s(line, line.indexOf(" ") + 1)
    else if k.startsWith line, "#"
      #pass
      #if vs hash
    else
      line = k.trimRight line
      line = line.replace /\s+/, " "
      line = line.split " "
      if line[0] is "set" or line[0] is "="
        if not line[2] then line[2] = "so"
        code += interpolate "{{varName}} = {{varValue}}", varName: line[1], varValue: line[2] 
      else if line[1] is "="
        code += interpolate "{{varName}} = {{varValue}}", varName: line[0], varValue: line[2] 
      else if line[0] is "goto"
        code += interpolate "scope.pc = {{varValue}}", varValue: line[1]
      else if line[0] is "if"
        code += interpolate """
          if ({{condition}}) {
            scope.pc = {{goto}}
          }
        """, condition: line[1], goto: line[2] 
      else if line[0] is "label"
        console.log "we have a label"
        scope[line[1]] = index #presetting the scope
        code += "//Label #{line[1]}\n"
      else if line[0] == "exit"
        code += "scope.__close__ = true"
      else if line[0] != ""
        args = makeVars k.s line, 1
        code += "scope.args = [" + args.join(", ") + "]\n"
        code += interpolate "scope.pc = {{varValue}}\n", varValue: line[0]
        
    code += "}"
    functions.push(code)
 
  compiled = """
    scope = #{JSON.stringify scope}
    functions = [#{functions.join(",\n")}]
    scope.pc = 0
    for (var j=0; j<100; j++) {
      if (scope.pc >= functions.length || scope.__close__ == true) {
        break;  
      }
      console.log("Executing: " + scope.lines[scope.pc])
      functions[scope.pc](scope);
      scope.pc ++
    }
  """
  return compiled


