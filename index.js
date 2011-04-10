(function() {
  var compile, functions, scope;
  scope = {};
  functions = [];
  compile = function(code) {
    var args, func, line, _i, _len;
    code = code.split("\n");
    for (_i = 0, _len = code.length; _i < _len; _i++) {
      line = code[_i];
      console.log(line);
      line = line.split(" ");
      func = line[0];
      args = _.s(line, 1);
      functions.push("funciton() {\n  " + func + "(\"" + (args.join('", "')) + "\");\n}");
    }
    return " \nvar scope = " + (JSON.stringify(scope)) + ";\nfunctions = [" + (functions.join(',\n')) + "]\nscope.pc = 0\nscope.last_pc = 0\nfor (var j=0; j<10000; j++) {\n  if (scope.pc >= functions.length || scope.__close__ == true) {\n    break;  \n  }\n  functions[scope.pc](scope);\n  scope.second_last_pc = scope.last_pc\n  scope.last_pc = scope.pc\n  if (scope.set_pc != -1) {\n    scope.pc = scope.set_pc\n    scope.set_pc = -1\n  }\n  scope.pc ++\n}";
  };
  $(document).ready(function() {
    $('#code').persistValue();
    return $("#compile").click(function() {
      var code, compiled;
      code = $('#code').val();
      compiled = compile(code);
      return $('#output1').val(compiled);
    });
  });
}).call(this);
