_.templateSettings = 
    interpolate : /\{\{(.+?)\}\}/g

makeVars = (vars) ->
  for name, value of vars
    if k.isNumeric value
      vars[name] = value
    else
      vars[name] = "scope." + value.replace /(?:\.{2}([\w]+)\b)/g, (a,b) -> "[#{b}]" #using the bracket notation
  vars  


interpolate = (str, rawVars) ->
  _.template str, makeVars rawVars

parse = window.parse = (txt) ->
  functions = []
  txt = txt.split "\n"
  for line, index in txt
    line = k.trimLeft line
    code = ""
    code += "function(scope) {"
    if k.startsWith(line, "string") || k.startsWith(line, '"')
      code += "scope.so = \"" + k.s(line, line.indexOf(" ") + 1) + '"'
      console.log line
      console.log k.s line, (line.indexOf(" ") + 1)
      console.log line.indexOf(" ")
    else if k.startsWith line, "`"
      code += k.s(line, line.indexOf(" ") + 1)
    else 
      line = k.trimRight line
      line = line.replace /\s+/, " "
      line = line.split " "
      if line[0] is "set" or line[0] is "="
        if not line[2] then line[2] = "so"
        code += interpolate "{{varName}} = {{varValue}}", varName: line[1], varValue: line[2] 
        
      else if line[0] is "goto"
        code += interpolate "scope.pc = {{varValue}}", varValue: line[1]
    code += "}"
    functions.push(code)
 
  compiled = """
    scope = {}
    functions = [#{functions.join(",\n")}]
    scope.pc = 0
    for (var j=0; j<100; j++) {
      if (scope.pc >= functions.length) {
        break;  
      }
      functions[scope.pc](scope);
      scope.pc ++
    }
  """
  console.log compiled
  eval compiled
