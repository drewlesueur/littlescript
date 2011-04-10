(function() {
  var compile, functions, sope;
  sope = {};
  functions = [];
  compile = function(code) {
    var args, func, line, scope, _i, _len;
    functions = [];
    scope = {};
    code = code.split("\n");
    for (_i = 0, _len = code.length; _i < _len; _i++) {
      line = code[_i];
      line = line.split(" ");
      func = line[0];
      if (func.length === 0) {
        continue;
      }
      args = _.s(line, 1);
      functions.push("function() {\n  instructionSet." + func + "(\"" + (args.join("\", \"")) + "\");\n}");
    }
    return " \ninstructionSet = {\n  'set' : function(name, val) {\n    scope.so = scope[this.get(name)] = this.get(val)\n    return scope.so\n  },\n  'label': function(name) {\n    return this.set(this.get(name), scope.pc);\n  },\n  'log': function(name) {\n    scope.so = this.get(name)\n    console.log(scope.so)\n    return scope.so\n  },\n  'get' : function(name) {\n    if (_.s(name, 0, 1) !== \"'\") {\n      scope.so = scope[name]\n    } else {\n      \n      scope.so = _.s(name, 1)\n    }\n    return scope.so\n  },\n  'add' : function(a, b) {\n    scope.so = this.get(a) - 0 + this.get(b) - 0\n    return scope.so\n  }\n}\n\nvar scope = " + (JSON.stringify(scope)) + ";\nfunctions = [\n" + (functions.join(',\n')) + "]\nscope.pc = 0\nscope.last_pc = 0\nscope.set_pc = -1\nfor (var j=0; j<10000; j++) {\n  if (scope.pc >= functions.length || scope.__close__ == true) {\n    console.log(scope);\n    break;  \n  }\n  functions[scope.pc](scope);\n  scope.second_last_pc = scope.last_pc\n  scope.last_pc = scope.pc\n  if (scope.set_pc != -1) {\n    scope.pc = scope.set_pc\n    scope.set_pc = -1\n  }\n  scope.pc++\n}";
  };
  $(document).ready(function() {
    var compileCode;
    $('#code').persistValue();
    compileCode = function() {
      var code, compiled;
      code = $('#code').val();
      compiled = compile(code);
      $('#output1').val(compiled);
      return eval(compiled);
    };
    $("#compile").click(compileCode);
    return $(document.body).bind("keydown", function(e) {
      if (e.keyCode === 116) {
        e.preventDefault();
        return compileCode();
      }
    });
  });
}).call(this);
