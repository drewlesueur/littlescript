sope = {}
functions = []
compile = (code) ->
  functions = []
  scope = {}
  code = code.split "\n"  
  for line in code
    line = line.split " "
    func = line[0]
    if func.length is 0 then continue
    args = _.s line, 1
    # you could turn `'val` to scope["val"] here
    # right now you are doing it at run time
    functions.push """
      function() {
        instructionSet.#{func}(\"#{args.join("\", \"")}");
      }
    """
  
  """ 
    instructionSet = {
      'set' : function(name, val) {
        scope.so = scope[this.get(name)] = this.get(val)
        return scope.so
      },
      'label': function(name) {
        return this.set(this.get(name), scope.pc);
      },
      'log': function(name) {
        scope.so = this.get(name)
        console.log(scope.so)
        return scope.so
      },
      'get' : function(name) {
        if (_.s(name, 0, 1) !== "'") {
          scope.so = scope[name]
        } else {
          
          scope.so = _.s(name, 1)
        }
        return scope.so
      },
      'add' : function(a, b) {
        scope.so = this.get(a) - 0 + this.get(b) - 0
        return scope.so
      }
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


