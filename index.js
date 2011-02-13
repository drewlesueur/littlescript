(function() {
  var interpolate, makeVars, parse;
  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
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
    var args, code, compiled, functions, index, line, ret, scope, _len;
    functions = [];
    scope = {};
    txt = txt.split("\n");
    scope.lines = txt;
    scope.split_lines = [];
    scope.set_pc = -1;
    scope.stack = [];
    for (index = 0, _len = txt.length; index < _len; index++) {
      line = txt[index];
      line = k.trimLeft(line);
      code = "";
      code += "function(scope) {";
      if (k.startsWith(line, "string") || k.startsWith(line, '"')) {
        code += "scope.so = \"" + k.s(line, line.indexOf(" ") + 1) + '"';
        console.log(line);
        console.log(k.s(line, line.indexOf(" ") + 1));
        console.log(line.indexOf(" "));
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
          code += interpolate("{{varName}} = {{varValue}}", {
            varName: line[0],
            varValue: line[2]
          });
        } else if (line[0] === "goto") {
          code += interpolate("scope.set_pc = {{varValue}}", {
            varValue: line[1]
          });
        } else if (line[0] === "if") {
          code += interpolate("if ({{condition}}) {\n  scope.pc = {{goto}}\n}", {
            condition: line[1],
            goto: line[2]
          });
        } else if (line[0] === "label") {
          console.log("we have a label");
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
          code += "scope.set_pc = scope.stack.pop()";
        } else if (line[0] !== "") {
          args = makeVars(k.s(line, 1));
          code += "scope.args = [" + args.join(", ") + "]\n";
          code += "scope.stack.push(scope.pc)\n";
          code += interpolate("scope.set_pc = {{varValue}}\n", {
            varValue: line[0]
          });
        }
      }
      code += "}";
      functions.push(code);
    }
    compiled = "scope = " + (JSON.stringify(scope)) + "\nfunctions = [" + (functions.join(",\n")) + "]\nscope.pc = 0\nscope.last_pc = 0\nscope.second_last_pc = 0\nfor (var j=0; j<100; j++) {\n  if (scope.pc >= functions.length || scope.__close__ == true) {\n    break;  \n  }\n  console.log(\"Executing: \" + scope.lines[scope.pc])\n  functions[scope.pc](scope);\n  scope.not = ! scope.so\n  scope.second_last_pc = scope.last_pc\n  scope.last_pc = scope.pc\n  if (scope.set_pc != -1) {\n    scope.pc = scope.set_pc\n    scope.set_pc = -1\n  }\n  scope.pc ++\n}";
    return compiled;
  };
}).call(this);
