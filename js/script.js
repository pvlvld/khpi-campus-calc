// https://github.com/microsoft/calculator/raw/refs/heads/main/src/Calculator/Assets/CalculatorIcons.ttf
// Icons Font
const FUNCTIONS = [
  "√",
  // TODO:
  // "π",
  // "e",
  "^",
  "!",
  "%",
  "\\/",
  "\\*"
];

const REPLACEMENTS = {
  ",": "."
};

const VALID_EXPRESSION_REGEX = new RegExp(
  `^([+\\-*/^(),!]|(?:\\d+(?:\\[.|,]\\d+)?|\\[.|,]\\d+)|${FUNCTIONS.join(
    "|"
  )})+$`
);

class Calculator {
  constructor(name = "race00_vpavlenko_dmykhailov") {
    /**
     * @type {"Standart" | "Scientific" | "Programmer"}
     */
    this.cutrrentLayout = "Standart";
    this.eval = new MathExpressionParser().evaluate;
    this.currentInput = "";
    this.name = name;
    this.ui = {
      display: {
        expression: /** @type {HTMLElement} */ (
          document.getElementById("display-expression")
        ),
        resultInput: /** @type {HTMLElement} */ (
          document.getElementById("display-input-result")
        )
      },
      history: /** @type {HTMLElement} */ (document.getElementById("history")),
      buttons: document.querySelectorAll(".btn"),

      templates: {
        historyItem: document.createElement("div")
      }
    };
    this.clipboard = {
      user: navigator.clipboard,
      local: "",
      permissions: {
        read: false,
        write: false
      }
    };

    this.requestClipboardPermissions();
  }

  init() {
    document.addEventListener("paste", (event) => {
      const data = event.clipboardData?.getData("text");
      if (data && this.validateExpr(data)) {
        this.ui.display.resultInput.innerHTML = data;
        this.currentInput = data;
      }
    });

    document.addEventListener("keydown", (e) => {
      console.log(
        `Key: ${e.key}, Ctrl: ${e.ctrlKey}, Shift: ${e.shiftKey}, Alt: ${e.altKey}`
      );

      switch (true) {
        case e.key === "Enter":
          e.preventDefault();
          this.updateDisplay(undefined, this.calculateExpression());
          break;
        case e.ctrlKey && e.key === "A":
        case e.ctrlKey && e.key === "a":
        case e.ctrlKey && e.key === "ф":
        case e.ctrlKey && e.key === "Ф":
          e.preventDefault();
          console.log("No :D");
          break;
        default:
          break;
      }
    });

    // TODO:
    this.ui.buttons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleButtonClick(e));
    });
  }

  requestClipboardPermissions() {
    this.clipboard.user
      .readText()
      .then((text) => {
        this.clipboard.local = text;
        this.clipboard.permissions.read = true;
      })
      .catch((err) => {
        console.error("Failed to read clipboard contents: ", err);
      });

    this.clipboard.user
      .writeText(this.clipboard.local)
      .then(() => {
        this.clipboard.permissions.write = true;
      })
      .catch((err) => {
        console.error("Failed to write clipboard contents: ", err);
      });
  }

  handleButtonClick(e) {
    const value = e.target.innerText;

    switch (true) {
      case value === "=":
        try {
          const result = this.calculateExpression();
          this.appendHistoryItem({
            expression: this.ui.display.innerHTML + "=",
            result: result
          });
          this.updateDisplay(undefined, result);
        } catch (error) {
          console.error(error);
        }
        break;
      case value === "C":
        this.clearDisplay();
        break;
      case value === "CE":
        this.clearDisplay();
        break;
      case /^[0-9]$/.test(value):
        this.ui.display.resultInput.innerHTML = this.currentInput += value;
        break;
      case ["+", "-", "*", "/", "!", "%", "^"].includes(value):
        this.handleAlgebraicButtonClick(value);
        break;
      default:
        console.error(`Unhandled button click: ${value}`);
        break;
    }
  }

  handleAlgebraicButtonClick(operator) {
    if (this.currentInput.length === 0) {
      this.currentInput = (this.currentInput || "0") + operator;
    } else if (!isNaN(+(this.currentInput.at(-1) || NaN))) {
      this.currentInput += operator;
    } else {
      this.currentInput = this.currentInput.slice(0, -1) + operator;
    }

    this.ui.display.resultInput.innerHTML = this.currentInput;
  }

  changeLayout() {
    this.clearDisplay();
    // TODO:
  }

  appendHistoryItem(item) {
    // JSON representation locally or plain HTML string?
    // const data = {history: this.ui.history.innerHTML};
    // localStorage.setItem(this.name, JSON.stringify(data));
  }

  /**
   * @param {string | undefined} expression
   * @param {string | number | undefined} result
   */
  updateDisplay(expression = undefined, result = undefined) {
    if (result) this.ui.display.resultInput.innerHTML = "" + result;
    if (expression) this.ui.display.expression.innerHTML = expression;

    return {expression, result};
  }

  /**
   * @param {string} expression
   */
  prepareExpression(expression) {
    for (const [key, value] of Object.entries(REPLACEMENTS)) {
      expression = expression.replace(new RegExp(key, "g"), value);
    }

    return expression;
  }

  /**
   * @param {string} expression
   */
  validateExpr = (expression) => VALID_EXPRESSION_REGEX.test(expression);

  /**
   * @param {string} expression
   * @param {string | number} result
   * @returns {Node}
   */
  generateHistoryItem(expression, result) {
    const item = this.ui.templates.historyItem.cloneNode();
    //@ts-expect-error
    item.classList.add("history-item");
    item.appendChild(document.createElement("div")).innerHTML = expression;
    item.appendChild(document.createElement("span")).innerHTML = "" + result;

    return item;
  }

  loadHistory() {
    this.ui.history.innerHTML =
      JSON.parse(localStorage.getItem(this.name) || "{}").history || "";
  }

  clearHistory() {
    localStorage.removeItem(this.name);
    this.ui.history.innerHTML = "";
  }

  clearDisplay() {
    this.ui.display.expression.innerHTML = "";
    this.ui.display.resultInput.innerHTML = "0";
    this.currentInput = "";
  }

  historyItemClickHandler(e) {
    if (!e.target.classList.contains("history-item")) return;
    this.ui.display.innerHTML = e.target.innerText;
    navigator.clipboard.writeText(e.target.innerText);
  }

  calculateExpression() {
    if (!this.validateExpr(this.currentInput)) {
      throw new Error("Invalid expression");
    }

    const expr = this.prepareExpression(this.currentInput);
    this.ui.display.expression.innerHTML = expr + "=";
    this.currentInput = "";

    return this.eval(expr);
  }
}

class MathExpressionParser {
  constructor() {
    this.priority = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
      "^": 3,
      "!": 4,
      "√": 4
    };
  }

  /**
   * @param {number} left
   * @param {string} operator
   * @param {number} right
   */
  performOperation(left, operator, right) {
    switch (operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "^":
        return Math.pow(left, right);
      case "!":
        return this.factorial(left);
      case "√":
        return Math.sqrt(right);
      default:
        throw new Error(`Unhandled operator: ${operator}`);
    }
  }

  /**
   * @param {string} exp
   * @returns {number}
   */
  evaluate = (exp) => this.parseExp(exp.replace(/\s+/g, ""));

  /**
   * @param {string} exp
   * @returns {number}
   */
  parseExp(exp) {
    if (!exp) return 0;

    exp = this.handleParentheses(exp);

    if (exp.startsWith("-")) return -this.parseExp(exp.slice(1));
    if (exp.startsWith("+")) return this.parseExp(exp.slice(1));
    if (exp.startsWith("√")) return Math.sqrt(this.parseExp(exp.slice(1)));

    const {operator, index} = this.findLowestPriorityOperator(exp);

    if (!operator) {
      if (exp.endsWith("!")) {
        return this.factorial(this.parseExp(exp.slice(0, exp.length - 1)));
      }
      return parseFloat(exp);
    }

    const leftExp = exp.slice(0, index);
    const rightExp = exp.slice(index + 1);

    if (operator === "√") return Math.sqrt(this.parseExp(rightExp));

    const leftValue = this.parseExp(leftExp);

    if (rightExp.endsWith("%")) {
      const percentValue =
        parseFloat(rightExp.slice(0, rightExp.length - 1)) / 100;

      switch (operator) {
        case "+":
          return leftValue + leftValue * percentValue;
        case "-":
          return leftValue - leftValue * percentValue;
        case "*":
          return leftValue * percentValue;
        case "/":
          return leftValue / percentValue;
        default:
          return this.performOperation(leftValue, operator, percentValue);
      }
    }

    return this.performOperation(leftValue, operator, this.parseExp(rightExp));
  }

  /**
   * @param {string} exp
   * @returns {boolean}
   */
  hasOperator(exp) {
    for (const op of Object.keys(this.priority)) {
      if (exp.includes(op)) return true;
    }
    return false;
  }

  /**
   * @param {string} exp
   * @returns {string}
   */
  handleParentheses(exp) {
    if (!exp.includes("(")) return exp;

    let depth = 0;
    let startIndex = -1;

    for (let i = 0; i < exp.length; i++) {
      if (exp[i] === "(") {
        if (depth === 0) startIndex = i;
        depth++;
      } else if (exp[i] === ")") {
        depth--;

        if (depth === 0) {
          const result = this.parseExp(exp.slice(startIndex + 1, i));
          exp = exp.slice(0, startIndex) + result + exp.slice(i + 1);
          i = -1;
        }
      }
    }

    return exp;
  }

  /**
   * @param {string} exp
   * @returns {{operator: string | null, index: number}}
   */
  findLowestPriorityOperator(exp) {
    let lowestPriority = Infinity;
    let lowestPriorityIndex = -1;
    let lowestPriorityOperator = null;
    let depth = 0;

    for (let i = exp.length - 1; i >= 0; i--) {
      const char = exp[i];

      if (char === ")") {
        depth++;
      } else if (char === "(") {
        depth--;
      }

      if (depth === 0) {
        if (this.priority[char] !== undefined) {
          // Skip % since handled separately
          if (char === "%" && i === exp.length - 1) continue;

          // Unary minus case
          if (
            char === "-" &&
            (i === 0 ||
              this.priority[exp[i - 1]] !== undefined ||
              exp[i - 1] === "(")
          )
            continue;

          if (char === "!" && i === exp.length - 1) continue;
          if (char === "√" && i === 0) continue;
          if (this.priority[char] <= lowestPriority) {
            lowestPriority = this.priority[char];
            lowestPriorityIndex = i;
            lowestPriorityOperator = char;
          }
        }
      }
    }

    return {
      operator: lowestPriorityOperator,
      index: lowestPriorityIndex
    };
  }

  /**
   * @param {number} n
   * @returns {number}
   */
  factorial(n) {
    //TODO: huh? floats?
    if (!Number.isInteger(n)) throw new Error("TODO: FLOAT FACTORIAL ERROR");
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
}

const app = new Calculator().init();
