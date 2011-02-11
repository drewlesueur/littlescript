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
      } else {
        if (!k.startsWith(value, ".")) {
          value = "." + value;
        }
        vars[name] = "scope" + value.replace(/(?:\.{2}([\w]+)\b)/g, function(a, b) {
          return "[scope." + b + "]";
        });
      }
    }
    return vars;
  };
  interpolate = function(str, rawVars) {
    return _.template(str, makeVars(rawVars));
  };
  parse = window.parse = function(txt) {
    var code, compiled, functions, index, line, _len;
    functions = [];
    txt = txt.split("\n");
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
      } else if (k.startsWith(line, "`")) {
        code += k.s(line, line.indexOf(" ") + 1);
      } else if (k.startsWith(line, "#")) {} else {
        line = k.trimRight(line);
        line = line.replace(/\s+/, " ");
        line = line.split(" ");
        if (line[0] === "set" || line[0] === "=") {
          if (!line[2]) {
            line[2] = "so";
          }
          code += interpolate("{{varName}} = {{varValue}}", {
            varName: line[1],
            varValue: line[2]
          });
        } else if (line[0] === "goto") {
          code += interpolate("scope.pc = {{varValue}}", {
            varValue: line[1]
          });
        }
      }
      code += "}";
      functions.push(code);
    }
    compiled = "scope = {}\nfunctions = [" + (functions.join(",\n")) + "]\nscope.pc = 0\nfor (var j=0; j<100; j++) {\n  if (scope.pc >= functions.length) {\n    break;  \n  }\n  functions[scope.pc](scope);\n  scope.pc ++\n}";
    console.log(compiled);
    return eval(compiled);
  };
}).call(this);
