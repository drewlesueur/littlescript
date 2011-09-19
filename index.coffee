sope = {}
functions = []

window.parseParens = (code) ->
  ret = []
  code = code.replace(/\(/g, "[").replace /\)/g, "]"
  code = code.replace /(\w)\s(\w)/g, "$1\", \"$2"
  code = code.replace /^(\w)/g, "\"$1"
  code = code.replace /(\w)$/g, "$1\""
  code = code.replace /\[(\w)/g, "[\"$1"
  code = code.replace /(\w)\]/g, "$1\"]"
  code = code.replace /(\w)\s\[/g, "$1\", ["
  code = code.replace /\]\s(\w)/g, "], \"$1"
  code = code.replace /\]\s*\[/g, "], ["
  ret = JSON.parse code
  console.log ret
  ret



replaceQuotes = (txt) ->
  txt = txt.replace /\\"/g, '\\x22'
  #"
  txt = txt.replace /(\"[^\"]*[^\\]\")/g, (a, b) ->
    #"
    return a.replace(/\n/g, '\\x0A').replace(/\n/g, '\\x0D').replace(/\x20/g, '\\x20')
  txt = txt.replace /\\\n/g, ' '
  txt


compile = (code) ->
  code = replaceQuotes code
  get = (name) ->
    if _.isNumeric(name) 
      scope.so = name
    else if _.s(name, 0, 1) != "'"
      scope.so = scope[name]
    else
      scope.so = _.s(name, 1)
    return scope.so
  functions = []
  scope = {}
  code = code.split "\n"  
  newcode = []
  for line in code
    if line.length > 0
      newcode.push line
  code = newcode
  for line, index in code
    line = line.split " "
    func = line[0]
    if func.length is 0 then continue
    args = _.s line, 1
    # you could turn `'val` to scope["val"] here
    # right now you are doing it at run time
    if func == "label"
      scope[get(args[0])] = index
    else
      functions.push """
        function() {
          instructionSet.#{func}("#{args.join("\", \"")}");
        }
      """
  
  """ 
    instructionSet = {
      'set' : function(name, val) {
        scope.so = scope[this.get(name)] = this.get(val)
        return scope.so
      },
      'label': function(name) {
        return this.set(name, scope.pc+1);
      },
      'log': function(name) {
        scope.so = this.get(name)
        console.log(scope.so)
        return scope.so
      },
      'get' : function(name) {
        if (_.isNumeric(name)) {
          scope.so = name
        } else if (_.s(name, 0, 1) !== "'") {
          scope.so = scope[name]
        } else {
          scope.so = _.s(name, 1)
        }
        return scope.so
      },
      'add' : function(a, b) {
        scope.so = (this.get(a) - 0) + (this.get(b) - 0)
        return scope.so
      },
      goto: function(line) {
        scope.set_pc = this.get(line)
      },
      compare: function(a,b) {
        return scope.so = this.get(a) == this.get(b)
      },
      ifgoto: function (cond, line) {
        if (this.get(cond)) {
          this.goto(line)
        }
      },
      exit: function() {
        scope.__close__ = true;
      },
      def: function() {
       
      }
    }

    var scope = #{JSON.stringify(scope)};
    functions = [\n#{functions.join(',\n')}]
    scope.pc = 0
    scope.last_pc = 0
    scope.set_pc = -1
    for (var j=0; j<100; j++) {
      if (scope.pc >= functions.length || scope.__close__ == true) {
        console.log(scope);
        break;  
      }
      functions[scope.pc](scope);
      scope.second_last_pc = scope.last_pc
      scope.last_pc = scope.pc
      scope.pc++
      if (scope.set_pc != -1) {
        scope.pc = scope.set_pc
        scope.set_pc = -1
      }
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


