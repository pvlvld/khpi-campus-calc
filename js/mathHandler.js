export class MathExpressionParser {
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
    if (exp.endsWith("%") && !this.hasOperator(exp.slice(0, -1))) {
      return parseFloat(exp.slice(0, -1)) / 100;
    }

    const {operator, index} = this.findLowestPriorityOperator(exp);
    if (!operator) {
      if (exp.endsWith("!"))
        return this.factorial(this.parseExp(exp.slice(0, -1)));
      return parseFloat(exp);
    }

    const leftExp = exp.slice(0, index);
    const rightExp = exp.slice(index + 1);

    if (operator === "√") return Math.sqrt(this.parseExp(rightExp));

    const leftValue = this.parseExp(leftExp);

    if (rightExp.endsWith("%")) {
      const percentValue = parseFloat(rightExp.slice(0, -1)) / 100;
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
    return Object.keys(this.priority).some((op) => exp.includes(op));
  }

  /**
   * @param {string} exp
   * @returns {string}
   */
  handleParentheses(exp) {
    if (!exp.includes("(")) return exp;
    let depth = 0,
      startIndex = -1;
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
    let lowest = Infinity;
    let index = -1;
    let operator = null;
    let depth = 0;
    for (let i = exp.length - 1; i >= 0; i--) {
      const char = exp[i];
      if (char === ")") depth++;
      else if (char === "(") depth--;
      if (depth === 0 && this.priority[char] !== undefined) {
        if (char === "%" && i === exp.length - 1) continue;
        if (
          char === "-" &&
          (i === 0 ||
            this.priority[exp[i - 1]] !== undefined ||
            exp[i - 1] === "(")
        )
          continue;
        if (char === "!" && i === exp.length - 1) continue;
        if (char === "√" && i === 0) continue;
        if (this.priority[char] <= lowest) {
          lowest = this.priority[char];
          index = i;
          operator = char;
        }
      }
    }
    return {operator, index};
  }

  /**
   * @param {number} n
   * @returns {number}
   */
  factorial(n) {
    if (!Number.isInteger(n)) throw new Error("TODO: FLOAT FACTORIAL ERROR");
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
}