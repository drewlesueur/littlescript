(function() {
  var interpolate, makeVars, parse, updateCodeForFunctionCall;
  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
  };
  updateCodeForFunctionCall = function(scope, line) {
    var argNameIndex, args, code, name, _len, _ref;
    code = "";
    args = makeVars(k.s(line, 1));
    code += "scope.argsStack.push(scope.args)\n";
    code += "scope.args = [" + args.join(", ") + "]\n";
    code += "scope.stack.push(scope.pc)\n";
    _ref = scope.argNames[scope[line[0]]];
    for (argNameIndex = 0, _len = _ref.length; argNameIndex < _len; argNameIndex++) {
      name = _ref[argNameIndex];
      code += interpolate("scope." + name + " = {{varValue}};\n", {
        varValue: line[argNameIndex + 1]
      });
    }
    return code += interpolate("scope.set_pc = {{varValue}}\n", {
      varValue: line[0]
    });
  };
  makeVars = function(vars) {
    var name, value;
    for (name in vars) {
      value = vars[name];
      if (k.isNumeric(value)) {
        vars[name] = value;
      } else if (value === "object" || value === "{}") {
        vars[name] = "{}";
      } else if (value === "array" || value === "[]") {
        vars[name] = "[]";
      } else if (k.startsWith(value, '"') || k.startsWith(value, "'")) {
        vars[name] = value;
      } else {
        if (!k.startsWith(value, ".")) {
          value = "." + value;
        }
        value = value.replace(/(?:\.{2}([\w]+)\b)/g, function(a, b) {
          return "[scope." + b + "]";
        });
        value = value.replace(/(?:\.(\w+)\b)/g, function(a, b) {
          return "[\"" + b + "\"]";
        });
        vars[name] = "scope" + value;
      }
    }
    return vars;
  };
  interpolate = function(str, rawVars) {
    return _.template(str, makeVars(rawVars));
  };
  parse = window.parse = function(txt) {
    var code, compiled, condition, debug, end_info, end_pos, end_stack, end_val, first_word, functions, index, line, ret, scope, _len, _len2;
    debug = true;
    functions = [];
    scope = {};
    txt = txt.split("\n");
    scope.lines = txt;
    scope.split_lines = [];
    scope.set_pc = -1;
    scope.stack = [];
    scope.argsStack = [];
    scope.argNames = {};
    end_info = {};
    end_stack = [];
    for (index = 0, _len = txt.length; index < _len; index++) {
      line = txt[index];
      end_pos = line.indexOf(" ");
      if (end_pos === -1) {
        end_pos = line.length;
      }
      first_word = k.s(line, 0, end_pos);
      if (first_word === "if" || first_word === "def" || first_word === "begin") {
        end_stack.push(index);
        if (first_word === "def") {
          line = k.trimLeft(line);
          line = k.trimRight(line);
          line = line.replace(/\s+/, " ");
          line = line.split(" ");
          scope[line[1]] = index;
          scope.argNames[index] = k.s(line, 2);
        }
      }
      if (first_word === "end") {
        end_val = end_stack.pop();
        end_info[end_val] = index;
      }
      if (first_word === "else" || first_word === "elseif") {
        end_val = end_stack.pop();
        end_info[end_val] = index;
        end_stack.push(index);
      }
    }
    for (index = 0, _len2 = txt.length; index < _len2; index++) {
      line = txt[index];
      line = k.trimLeft(line);
      code = "";
      code += "/* " + index + " */function(scope) {";
      if (k.startsWith(line, "string") || k.startsWith(line, '"')) {
        code += "scope.so = \"" + k.s(line, line.indexOf(" ") + 1) + '"';
      } else if (k.startsWith(line, "str")) {
        code += interpolate("{{varName}} = \"" + (k.s(line, line.indexOf(' ', 4) + 1)) + "\"", {
          varName: k.s(line, 4, line.indexOf(" ", 4) - 4)
        });
      } else if (k.startsWith(line, "`")) {
        code += "scope.so = " + k.s(line, line.indexOf(" ") + 1);
      } else if (k.startsWith(line, "#")) {} else {
        line = k.trimRight(line);
        line = line.replace(/\s+/, " ");
        line = line.split(" ");
        scope.split_lines[index] = line;
        if (line[0] === "set" || line[0] === "=") {
          if (!line[2]) {
            line[2] = "so";
          }
          code += interpolate("{{varName}} = {{varValue}}", {
            varName: line[1],
            varValue: line[2]
          });
        } else if (line[1] === "=") {
          if (line.length === 3) {
            code += interpolate("{{varName}} = {{varValue}}", {
              varName: line[0],
              varValue: line[2]
            });
          } else {

          }
        } else if (line[0] === "goto") {
          code += interpolate("scope.set_pc = {{varValue}}", {
            varValue: line[1]
          });
        } else if (line[0] === "if") {
          code += interpolate("if (!{{condition}}) {\n  scope.set_pc = " + end_info[index] + "\n  scope.follow_else = true\n} else {\n  scope.follow_else = false\n}\n", {
            condition: line[1]
          });
        } else if (line[0] === "elseif" || line[0] === "else" && line[1] === "if") {
          condition = k.s(line, -1)[0];
          code += interpolate("if (scope.follow_else) {\n  if (!{{condition}}) {\n    scope.set_pc = " + end_info[index] + "\n    scope.follow_else = true\n  } else {\n    scope.follow_else = false\n  }\n}", {
            condition: condition
          });
        } else if (line[0] === "else") {
          code += "if (!scope.follow_else) {\n  scope.set_pc = " + end_info[index] + "\n}";
        } else if (line[0] === "end") {} else if (line[0] === "ifgoto") {
          code += interpolate("if ({{condition}}) {\n  scope.set_pc = {{goto}}\n}", {
            condition: line[1],
            goto: line[2]
          });
        } else if (line[0] === "def") {
          code += "scope.set_pc = " + end_info[index];
        } else if (line[0] === "label") {
          scope[line[1]] = index;
          code += "//Label " + line[1] + "\n";
        } else if (line[0] === "exit") {
          code += "scope.__close__ = true";
        } else if (line[0] === "incr") {
          if (!line[2]) {
            line[2] = "1";
          }
          code += interpolate("{{varName}} = {{varName}} + {{varValue}}", {
            varName: line[1],
            varValue: line[2]
          });
        } else if (line[0] === "log") {
          code += interpolate("console.log({{varName}})", {
            varName: line[1]
          });
        } else if (line[1] === "is") {
          code += interpolate("scope.so = {{val1}} == {{val2}}", {
            val1: line[0],
            val2: line[2]
          });
        } else if (line[0] === "return") {
          ret = makeVars(k.s(line, 1));
          code += "scope.ret = [" + ret.join(", ") + "]\n";
          code += "scope.args = scope.argsStack.pop()\n;";
          code += "scope.set_pc = scope.stack.pop();\n";
        } else if (line[0] !== "") {
          code += updateCodeForFunctionCall(scope, line);
        }
      }
      code += "}";
      functions.push(code);
    }
    compiled = "scope = " + (JSON.stringify(scope)) + "\nfunctions = [" + (functions.join(",\n")) + "]\nscope.pc = 0\nscope.last_pc = 0\nscope.second_last_pc = 0\nfor (var j=0; j<100; j++) {\n  console.log(\"Executing line\" + scope.pc + \": \" + scope.lines[scope.pc])\n  if (scope.pc >= functions.length || scope.__close__ == true) {\n    break;  \n  }\n  //console.log(\"Executing: \" + scope.lines[scope.pc])\n  functions[scope.pc](scope);\n  scope.not = ! scope.so\n  scope.second_last_pc = scope.last_pc\n  scope.last_pc = scope.pc\n  if (scope.set_pc != -1) {\n    scope.pc = scope.set_pc\n    scope.set_pc = -1\n  }\n  scope.pc ++\n}";
    return compiled;
  };
}).call(this);
