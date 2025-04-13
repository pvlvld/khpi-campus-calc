const DEBUG = true;

const FUNCTIONS = ["√", "^", "!", "%", "/", "*"];
const REPLACEMENTS = {",": ".", s: "√"};

function escapeRegex(str) {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
}

const ESCAPED_FUNCTIONS = FUNCTIONS.map(escapeRegex).join("|");

const VALID_EXPRESSION_REGEX = new RegExp(
  `^([+\\-*/^(),]|(?:\\d+(?:[.,]\\d+)?|[.,]\\d+)|${ESCAPED_FUNCTIONS})+$`
);

export {DEBUG, FUNCTIONS, REPLACEMENTS, VALID_EXPRESSION_REGEX};
