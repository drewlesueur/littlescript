scope = {}
functions = []
compile = (code) ->
  functions = []
  scope = {}
  code = code.split "\n"  
  for line in code
    console.log line 
    line = line.split " "
    func = line[0]
    if func.length is 0 then continue
    args = _.s line, 1
    functions.push """
      function() {
        #{func}(\"#{args.join("\", \"")}");
      }
    """
  
  """ 
    function set(name, val) {
      scope[name] = val
    }
    function label(name) {
      set(name, scope.pc);
    }
    var scope = #{JSON.stringify(scope)};
    functions = [\n#{functions.join(',\n')}]
    scope.pc = 0
    scope.last_pc = 0
    scope.set_pc = -1
    for (var j=0; j<10000; j++) {
      if (scope.pc >= functions.length || scope.__close__ == true) {
        console.log(scope);
        break;  
      }
      console.log(scope.pc)
      functions[scope.pc](scope);
      scope.second_last_pc = scope.last_pc
      scope.last_pc = scope.pc
      if (scope.set_pc != -1) {
        scope.pc = scope.set_pc
        scope.set_pc = -1
      }
      scope.pc++
    }
  """


  

$(document).ready () ->
  $('#code').persistValue()
  compileCode = () ->
    code = $('#code').val()
    compiled = compile code 
    $('#output1').val compiled
    eval compiled
  $("#compile").click compileCode

  $(document.body).bind "keydown", (e) ->
    if e.keyCode is 116 #f5
      e.preventDefault()
      compileCode()


