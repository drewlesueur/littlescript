(function() {
  var compile, functions, sope;
  sope = {};
  functions = [];
  window.parseParens = function(code) {
    var ret;
    ret = [];
    code = code.replace(/\(/g, "[").replace(/\)/g, "]");
    code = code.replace(/(\w)\s(\w)/g, "$1\", \"$2");
    code = code.replace(/^(\w)/g, "\"$1");
    code = code.replace(/(\w)$/g, "$1\"");
    code = code.replace(/\[(\w)/g, "[\"$1");
    code = code.replace(/(\w)\]/g, "$1\"]");
    code = code.replace(/(\w)\s\[/g, "$1\", [");
    code = code.replace(/\]\s(\w)/g, "], \"$1");
    code = code.replace(/\]\s*\[/g, "], [");
    ret = JSON.parse(code);
    console.log(ret);
    return ret;
  };
  compile = function(code) {
    var args, func, get, index, line, newcode, scope, _i, _len, _len2;
    get = function(name) {
      if (_.isNumeric(name)) {
        scope.so = name;
      } else if (_.s(name, 0, 1) !== "'") {
        scope.so = scope[name];
      } else {
        scope.so = _.s(name, 1);
      }
      return scope.so;
    };
    functions = [];
    scope = {};
    code = code.split("\n");
    newcode = [];
    for (_i = 0, _len = code.length; _i < _len; _i++) {
      line = code[_i];
      if (line.length > 0) {
        newcode.push(line);
      }
    }
    code = newcode;
    for (index = 0, _len2 = code.length; index < _len2; index++) {
      line = code[index];
      line = line.split(" ");
      func = line[0];
      if (func.length === 0) {
        continue;
      }
      args = _.s(line, 1);
      if (func === "label") {
        scope[get(args[0])] = index;
      }
      functions.push("function() {\n  instructionSet." + func + "(\"" + (args.join("\", \"")) + "\");\n}");
    }
    return " \ninstructionSet = {\n  'set' : function(name, val) {\n    scope.so = scope[this.get(name)] = this.get(val)\n    return scope.so\n  },\n  'label': function(name) {\n    return this.set(name, scope.pc+1);\n  },\n  'log': function(name) {\n    scope.so = this.get(name)\n    console.log(scope.so)\n    return scope.so\n  },\n  'get' : function(name) {\n    if (_.isNumeric(name)) {\n      scope.so = name\n    } else if (_.s(name, 0, 1) !== \"'\") {\n      scope.so = scope[name]\n    } else {\n      scope.so = _.s(name, 1)\n    }\n    return scope.so\n  },\n  'add' : function(a, b) {\n    scope.so = (this.get(a) - 0) + (this.get(b) - 0)\n    return scope.so\n  },\n  goto: function(line) {\n    scope.set_pc = this.get(line)\n  },\n  compare: function(a,b) {\n    return scope.so = this.get(a) == this.get(b)\n  },\n  ifgoto: function (cond, line) {\n    if (this.get(cond)) {\n      this.goto(line)\n    }\n  },\n  exit: function() {\n    scope.__close__ = true;\n  },\n  def: function() {\n   \n  }\n}\n\nvar scope = " + (JSON.stringify(scope)) + ";\nfunctions = [\n" + (functions.join(',\n')) + "]\nscope.pc = 0\nscope.last_pc = 0\nscope.set_pc = -1\nfor (var j=0; j<100; j++) {\n  if (scope.pc >= functions.length || scope.__close__ == true) {\n    console.log(scope);\n    break;  \n  }\n  functions[scope.pc](scope);\n  scope.second_last_pc = scope.last_pc\n  scope.last_pc = scope.pc\n  scope.pc++\n  if (scope.set_pc != -1) {\n    scope.pc = scope.set_pc\n    scope.set_pc = -1\n  }\n}";
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
