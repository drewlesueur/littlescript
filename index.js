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
        vars[name] = value.replace(/\#\{([^\\}]*)\}/g, function(a, b) {
          var varso;
          varso = {
            name: b
          };
          varso = makeVars(varso);
          return '" +' + varso['name'] + '+ "';
        });
      } else if (value.match(/^[^A-Za-z0-9\.\"]/)) {
        console.log("what!!");
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
    var code, compiled, condition, end_info, end_pos, end_pos_2, end_stack, end_val, first_word, functions, index, line, liner, new_lines, ret, scope, second_word, start_stack, start_word, _i, _len, _len2;
    txt = txt.replace(/(\"[^\\][\s\S]*[^\\]\")/g, function(a) {
      return a.replace(/\n/g, '\\x0A').replace(/\n/g, '\\x0D').replace(/\x20/g, '\\x20');
    });
    console.log(txt);
    functions = [];
    scope = {};
    txt = txt.split("\n");
    scope.split_lines = [];
    scope.set_pc = -1;
    scope.stack = [];
    scope.argsStack = [];
    scope.argNames = {};
    end_info = {};
    end_stack = [];
    start_stack = [];
    new_lines = [];
    index = 0;
    for (_i = 0, _len = txt.length; _i < _len; _i++) {
      liner = txt[_i];
      liner = k.trimLeft(liner);
      end_pos = liner.indexOf(" ");
      if (end_pos === -1) {
        end_pos = liner.length;
      }
      first_word = k.s(liner, 0, end_pos);
      end_pos_2 = liner.indexOf(" ", end_pos + 1);
      second_word = k.s(liner, end_pos + 1, end_pos_2 - end_pos - 1);
      if (first_word === "if") {
        end_stack.push(index + 1);
        start_stack.push(first_word);
      } else if (first_word === "def" || first_word === "begin") {
        end_stack.push(index);
        start_stack.push(first_word);
      }
      if (first_word === "end") {
        end_val = end_stack.pop();
        end_info[end_val] = index;
        start_word = start_stack.pop();
        if (start_word === "def") {
          liner = "return so";
        }
        console.log(end_info);
      }
      if (first_word === "else" || first_word === "elseif") {
        end_val = end_stack.pop();
        end_info[end_val] = index;
        end_stack.push(index);
      }
      if (!(k(liner).startsWith("string") || k(liner).startsWith('`'))) {
        line = k.trimLeft(liner);
        line = k.trimRight(line);
        line = line.replace(/\s+/, " ");
        line = line.split(" ");
        if (line[0] === "def") {
          scope[line[1]] = index;
          scope.argNames[index] = k.s(line, 2);
        }
      }
      if (second_word === "=") {
        new_lines.push(k(liner).s(end_pos_2 + 1));
        new_lines.push(k(liner).s(0, end_pos_2) + " so");
        index += 2;
      } else if (first_word === "if" || first_word === "log") {
        new_lines.push(k(liner).s(end_pos + 1));
        new_lines.push(k(liner).s(0, end_pos) + " so");
        index += 2;
      } else {
        new_lines.push(liner);
        index += 1;
      }
    }
    txt = new_lines;
    scope.lines = txt;
    for (index = 0, _len2 = txt.length; index < _len2; index++) {
      line = txt[index];
      line = k.trimLeft(line);
      code = "";
      code += "/* " + index + " */function(scope) {";
      if (k.startsWith(line, "string")) {
        code += "scope.so = \"" + k.s(line, line.indexOf(" ") + 1) + '"';
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
          ret = makeVars(k.s(line, 1, 1));
          code += "scope.so = " + ret[0] + ";\n";
          code += "scope.args = scope.argsStack.pop()\n;";
          code += "scope.set_pc = scope.stack.pop();\n";
        } else if (line[0] !== "" && line.length > 1) {
          code += updateCodeForFunctionCall(scope, line);
        } else if (line[0] !== "" && line.length === 1) {
          code += interpolate("scope.so = {{varValue}}", {
            varValue: line[0]
          });
        }
      }
      code += "}";
      functions.push(code);
    }
    compiled = "scope = " + (JSON.stringify(scope)) + "\nfunctions = [" + (functions.join(",\n")) + "]\nscope.pc = 0\nscope.last_pc = 0\nscope.second_last_pc = 0\nfor (var j=0; j<100; j++) {\n  //console.log(\"Executing line\" + scope.pc + \": \" + scope.lines[scope.pc])\n  if (scope.pc >= functions.length || scope.__close__ == true) {\n    break;  \n  }\n  //console.log(\"Executing: \" + scope.lines[scope.pc])\n  functions[scope.pc](scope);\n  scope.not = ! scope.so\n  scope.second_last_pc = scope.last_pc\n  scope.last_pc = scope.pc\n  if (scope.set_pc != -1) {\n    scope.pc = scope.set_pc\n    scope.set_pc = -1\n  }\n  scope.pc ++\n}";
    return compiled;
  };
}).call(this);
