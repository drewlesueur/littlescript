scope = {}
functions = []
compile = (code) ->
  code = code.split "\n"  
  for line in code
    console.log line 
    line = line.split " "
    func = line[0]
    args = _.s line, 1
    functions.push """
      funciton() {
        #{func}("#{args.join('", "')}");
      }
    """
  
  """ 
    var scope = #{JSON.stringify(scope)};
    functions = [#{functions.join(',\n')}]
    scope.pc = 0
    scope.last_pc = 0
    for (var j=0; j<10000; j++) {
      if (scope.pc >= functions.length || scope.__close__ == true) {
        break;  
      }
      functions[scope.pc](scope);
      scope.second_last_pc = scope.last_pc
      scope.last_pc = scope.pc
      if (scope.set_pc != -1) {
        scope.pc = scope.set_pc
        scope.set_pc = -1
      }
      scope.pc ++
    }
  """


  

$(document).ready () ->
  $('#code').persistValue()
  $("#compile").click () ->
    code = $('#code').val()
    compiled = compile code 
    $('#output1').val compiled

