// https://github.com/microsoft/calculator/raw/refs/heads/main/src/Calculator/Assets/CalculatorIcons.ttf
// Icons Font

const DEBUG = true;

const FUNCTIONS = ["√", "^", "!", "%", "\\/", "\\*"];
const REPLACEMENTS = {",": "."};

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
    this.memory = 0;
    this.ui = {
      display: {
        expression: /** @type {HTMLElement} */ (
          document.getElementById("display-expression")
        ),
        resultInput: /** @type {HTMLElement} */ (
          document.getElementById("display-input-result")
        )
      },
      buttons: document.querySelectorAll(".btn"),
      templates: {
        historyItem: document.createElement("div")
      },
      history: /** @type {HTMLElement} */ (
        document.getElementById("history-content")
      ),
      memory: /** @type {HTMLElement} */ (
        document.getElementById("memory-content")
      ),
    };
    this.ui.templates.historyItem.classList.add("history-item");

    this.clipboard = {
      user: navigator.clipboard,
      local: "",
      permissions: {read: false, write: false}
    };

    this.overwriteInput = false;
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

    this.ui.buttons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleButtonClick(e));
    });

    document.querySelectorAll(".memory-control").forEach((btn) => {
      btn.addEventListener("click", () =>
        //@ts-expect-error
        this.handleMemoryControl(btn.innerText)
      );
    });

    document.querySelectorAll(".hist-mem-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        document
          .querySelectorAll(".hist-mem-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.switchTab(e);
      });
    });
  }

  switchTab(e) {
    if (e.target?.innerText === "History") {
      this.ui.history.style.display = "block";
      this.ui.memory.style.display = "none";
    } else {
      this.ui.history.style.display = "none";
      this.ui.memory.style.display = "block";
    }
  }

  requestClipboardPermissions() {
    this.clipboard.user
      .readText()
      .then((text) => {
        this.clipboard.local = text;
        this.clipboard.permissions.read = true;
      })
      .catch((err) => console.error("Failed to read clipboard: ", err));

    this.clipboard.user
      .writeText(this.clipboard.local)
      .then(() => (this.clipboard.permissions.write = true))
      .catch((err) => console.error("Failed to write clipboard: ", err));
  }

  handleButtonClick(e) {
    const value = e.target.innerText;

    switch (true) {
      case value === "=":
        try {
          if (this.overwriteInput) {
            this.currentInput = value;
          }
          const result = this.calculateExpression();
          this.appendHistoryItem({
            expression: this.ui.display.expression.innerHTML,
            result: result
          });
          this.updateDisplay(undefined, result);
        } catch (error) {
          console.error(error);
        }
        break;

      case value === "C":
      case value === "CE":
        if (this.overwriteInput) {
          this.currentInput = value;
        }
        this.clearDisplay();
        break;

      case value === "←":
        this.currentInput = this.currentInput.slice(0, -1) || "";
        this.ui.display.resultInput.innerHTML = this.currentInput || "0";
        break;

      case /^[0-9]$/.test(value):
        if (this.overwriteInput) {
          this.currentInput = value;
          this.overwriteInput = false;
        } else {
          this.currentInput += value;
        }
        this.ui.display.resultInput.innerHTML = this.currentInput;
        break;

      case ["+", "-", "*", "/", "!", "%", "^", ".", "√"].includes(value):
        this.handleAlgebraicButtonClick(value);
        break;

      case value === "±":
        this.toggleSign();
        break;

      case value === "1/x":
        try {
          const currentValue = parseFloat(
            this.ui.display.resultInput.innerHTML
          );
          if (currentValue === 0) return;
          const lastNumberMatch = this.currentInput.match(
            /(-?\d+(\.\d+)?)(?!.*\d)/
          );
          if (lastNumberMatch) {
            const number = lastNumberMatch[0];
            const index = this.currentInput.lastIndexOf(number);
            const before = this.currentInput.slice(0, index);
            const after = this.currentInput.slice(index + number.length);

            this.currentInput = `${before}(1/(${number}))${after}`;
            this.ui.display.resultInput.innerHTML = this.currentInput;
          }
        } catch (e) {
          console.error("Invalid 1/x operation", e);
        }
        break;

      default:
        console.error(`Unhandled button click: ${value}`);
        break;
    }
  }

  toggleSign() {
    if (this.currentInput.length === 0) return;

    const lastNumberMatch = this.currentInput.match(
      /(?:^|[+\-*/^%])\s*(-?\d+(\.\d+)?)(?=\s*$)/
    );
    if (!lastNumberMatch || !lastNumberMatch.index) return;

    const lastNumber = lastNumberMatch[1];
    const startIndex =
      lastNumberMatch.index + lastNumberMatch[0].lastIndexOf(lastNumber);
    const charBefore = this.currentInput[startIndex - 1];
    if (charBefore && /[!%√]/.test(charBefore)) return;

    let updatedInput = "";
    if (lastNumber.startsWith("-")) {
      updatedInput =
        this.currentInput.slice(0, startIndex) + lastNumber.slice(1);
    } else {
      updatedInput = this.currentInput.slice(0, startIndex) + "-" + lastNumber;
    }

    this.currentInput = updatedInput;
    this.ui.display.resultInput.innerHTML = this.currentInput;
  }

  handleAlgebraicButtonClick(operator) {
    if (this.currentInput.length === 0) {
      this.currentInput = operator === "√" ? operator : "0" + operator;
    } else {
      const lastChar = this.currentInput.at(-1) || "0";

      if (/[\d)]/.test(lastChar) || operator === "√") {
        this.currentInput += operator;
      } else {
        // заміни тільки якщо останній символ — оператор
        if (/[\+\-\*\/\^%√!]/.test(lastChar)) {
          this.currentInput = this.currentInput.slice(0, -1) + operator;
        }
      }
    }

    this.ui.display.resultInput.innerHTML = this.currentInput;
  }

  appendHistoryItem(item) {
    const historyItem = this.generateHistoryItem(item.expression, item.result);
    this.ui.history.appendChild(historyItem);
  }

  /**
   * @param {string} expression
   * @param {string | number} result
   * @returns {Node}
   */
  generateHistoryItem(expression, result) {
    const item = this.ui.templates.historyItem.cloneNode();
    item.appendChild(document.createElement("div")).innerHTML = expression;
    item.appendChild(document.createElement("span")).innerHTML = "" + result;
    item.addEventListener("click", this.historyItemClickHandler.bind(this));
    return item;
  }
  /**
   * @param {string | undefined} expression
   * @param {string | number | undefined} result
   */
  updateDisplay(expression = undefined, result = undefined) {
    if (result !== undefined)
      this.ui.display.resultInput.innerHTML = "" + result;
    if (expression !== undefined)
      this.ui.display.expression.innerHTML = expression;
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

  clearDisplay() {
    this.ui.display.expression.innerHTML = "";
    this.ui.display.resultInput.innerHTML = "0";
    this.currentInput = "";
  }

  historyItemClickHandler(e) {
    const expression = e.currentTarget.querySelector("div").innerText;
    const result = e.currentTarget.querySelector("span").innerText;
    this.ui.display.resultInput.innerHTML = result;
    this.ui.display.expression.innerHTML = expression;
    this.currentInput = expression.slice(0, -1);
    navigator.clipboard.writeText(this.currentInput);
  }

  calculateExpression() {
    if (!this.validateExpr(this.currentInput)) {
      console.log(`Invalid expression: ${this.currentInput}`);
    }

    const expr = this.prepareExpression(this.currentInput);
    this.ui.display.expression.innerHTML = expr + "=";
    this.currentInput = "";
    const result = this.eval(expr);
    return result;
  }

  /**
   * @param {"M+" | "M-" | "MC" | "MR" | "MS"} action
   * @param {HTMLElement | null} targetItem
   */
  handleMemoryControl(action, targetItem = null) {
    const currentValue = parseFloat(this.ui.display.resultInput.innerHTML);

    if (targetItem) {
      const span = targetItem.querySelector("span");
      if (!span) throw new Error("Memory item span not found");
      let value = parseFloat(span.textContent || "0");

      switch (action) {
        case "M+":
          value += currentValue;
          break;
        case "M-":
          value -= currentValue;
          break;
        case "MC":
          targetItem.remove();
          return;
      }

      span.textContent = String(value);
      return;
    }

    const items = this.ui.memory.querySelectorAll(".memory-item");
    let lastItem = items[0];

    // 🧩 Додаємо: якщо нема памʼяті, створити 0
    if ((action === "M+" || action === "M-") && !lastItem) {
      this.appendMemoryItem(0);
      //@ts-expect-error enough
      lastItem = this.ui.memory.querySelector(".memory-item");
    }

    switch (action) {
      case "MC":
        this.ui.memory.innerHTML = "";
        break;

      case "MR":
        if (lastItem) {
          const val = lastItem.querySelector("span")?.textContent;
          if (!val) throw new Error("Memory item span not found");
          this.currentInput = val;
          this.ui.display.resultInput.innerHTML = val;
          this.overwriteInput = false;
        }
        break;

      case "MS":
        this.appendMemoryItem(currentValue);
        break;

      case "M+":
      case "M-":
        if (lastItem) {
          const span = lastItem.querySelector("span");
          if (!span) throw new Error("Memory item span not found");
          let oldValue = parseFloat(span.textContent || "0");
          const newValue =
            action === "M+" ? oldValue + currentValue : oldValue - currentValue;
          span.textContent = String(newValue);
        }
        break;
    }
  }

  appendMemoryItem(value) {
    const item = document.createElement("div");
    item.classList.add("memory-item");

    const labelSpan = document.createElement("span");
    labelSpan.textContent = value;

    const controlls = document.createElement("div");
    controlls.className = "memory-item-controlls";

    const btnPlus = document.createElement("button");
    btnPlus.textContent = "M+";
    btnPlus.onclick = () => this.handleMemoryControl("M+", item);

    const btnMinus = document.createElement("button");
    btnMinus.textContent = "M−";
    btnMinus.onclick = () => this.handleMemoryControl("M-", item);

    const btnClear = document.createElement("button");
    btnClear.textContent = "MC";
    btnClear.onclick = () => this.handleMemoryControl("MC", item);

    controlls.appendChild(btnPlus);
    controlls.appendChild(btnMinus);
    controlls.appendChild(btnClear);

    item.appendChild(labelSpan);
    item.appendChild(controlls);

    this.ui.memory.prepend(item);
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

class App {
  constructor() {
    this.calculator = new Calculator();
    this.converter = new Converter();
    /**
     * @type {"Calculator" | "Converter"}
     */
    this.activeTab = "Calculator";
  }

  init() {
    this.calculator.init();
    this.converter.init();
    this.calculator.clearDisplay();

    // UI
    // Sidebar
    document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar");
      sidebar?.classList.toggle("active");

      // На десктопі — розширяємо трохи вправо
      if (window.innerWidth > 768) {
        if (sidebar?.classList.contains("active")) {
          sidebar.style.width = "10rem";
        } else {
          sidebar ? (sidebar.style.width = "") : null;
        }
      }
    });

    // Sidebar close on click outside
    document.addEventListener("click", (e) => {
      const sidebar = document.getElementById("sidebar");
      const toggleBtn = document.getElementById("sidebar-toggle");
      if (
        e.target instanceof Node &&
        toggleBtn &&
        sidebar &&
        !sidebar?.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        sidebar.classList.remove("active");
        sidebar.style.width = "";
      }
      // at least i tried
      e.preventDefault();
      e.stopPropagation();
    });

    // History / Memory
    document.getElementById("open-journal")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const histMem = document.getElementById("hist-mem");
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        histMem?.classList.toggle("active");
      } else {
        this.calculator.switchTab("history");
      }
    });

    // Switch between calculator and converter
    document.querySelectorAll(".mode-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (
          e.target instanceof HTMLButtonElement &&
          e.target.innerText !== this.activeTab
        ) {
          // @ts-expect-error
          this.switchScreen(e.target.innerText);
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (this.activeTab === "Calculator") {
        this.calculator.handleKeyPress(e);
      } else {
        this.converter.ui.inputFrom.focus();
      }
    });
  }

  /**
   *
   * @param {"Calculator" | "Converter"} tab
   */
  switchScreen(tab) {
    const conv = /** @type {HTMLElement} */ (
      document.getElementById("converter")
    );
    const calc = /** @type {HTMLElement} */ (
      document.getElementById("calculator")
    );
    if (tab === "Converter") {
      conv.style.display = "block";
      calc.style.display = "none";
    } else {
      conv.style.display = "none";
      calc.style.display = "flex";
    }
    this.activeTab = tab;
  }
}

class Converter {
  constructor() {
    /**
     * @type {"Length" | "Weight" | "Temperature"}
     */
    this.layout = "Length";
    this.ui = {
      inputFrom: /** @type {HTMLInputElement} */ (
        document.getElementById("converter-input-from")
      ),
      inputTo: /** @type {HTMLInputElement} */ (
        document.getElementById("converter-input-to")
      ),
      selectFrom: /** @type {HTMLSelectElement} */ (
        document.getElementById("converter-select-from")
      ),
      selectTo: /** @type {HTMLSelectElement} */ (
        document.getElementById("converter-select-to")
      ),
      convertFrom: /** @type {HTMLButtonElement} */ (
        document.getElementById("converter-convert-from")
      ),
      convertTo: /** @type {HTMLButtonElement} */ (
        document.getElementById("converter-convert-to")
      )
    };

    this.conversionRates = {
      Length: {
        m: 1,
        km: 0.001,
        cm: 100,
        mm: 1000,
        ft: 3.28084,
        in: 39.3701
      },
      Weight: {
        kg: 1,
        g: 1000,
        lb: 2.20462,
        oz: 35.274
      },
      Temperature: {
        C: (value) => +value,
        F: (value) => (value - 32) * (5 / 9),
        K: (value) => +value + 273.15
      }
    };
  }

  init() {
    this.ui.selectFrom.addEventListener("change", () => {
      this.convert(this.ui.inputFrom, this.ui.selectFrom, this.ui.selectTo);
    });
    this.ui.selectTo.addEventListener("change", () => {
      this.convert(this.ui.inputTo, this.ui.selectTo, this.ui.selectFrom);
    });
    this.ui.inputFrom.addEventListener("input", (e) => {
      let currentValue = e.target.value || "0";
      const isNegative = currentValue.startsWith("-");

      const isValidNumber = /^-?\d*\.?\d*$/.test(currentValue);
      if (!isValidNumber) {
        return void (e.target.value = this.ui.convertFrom.innerText);
      }

      if (currentValue === "0" || currentValue === "-0") {
        return void (this.ui.convertFrom.innerText = currentValue);
      }

      if (/^-?0\d+/.test(currentValue)) {
        let cleanValue = currentValue.replace(/^-?0+/, "") || "0";
        e.target.value = isNegative ? -Math.abs(cleanValue) : cleanValue;
      }

      this.ui.convertFrom.innerText = e.target.value;
    });
  }

  convert(input, from, to) {
    const value = parseFloat(input.value);
    if (isNaN(value)) {
      input.value = "";
      return;
    }

    const fromUnit = from.options[from.selectedIndex].value;
    const toUnit = to.options[to.selectedIndex].value;

    let result = this.convertUnits(value, fromUnit, toUnit);
    to.value = result.toFixed(2);
  }

  convertUnits(value, fromUnit, toUnit) {
    if (this.layout === "Temperature") {
      return this.conversionRates[this.layout][toUnit](
        this.conversionRates[this.layout][fromUnit](value)
      );
    }

    return (
      (value * this.conversionRates[this.layout][fromUnit]) /
      this.conversionRates[this.layout][toUnit]
    );
  }

  switchLayout(layout) {
    this.layout = layout;
    this.ui.selectFrom.innerHTML = "";
    this.ui.selectTo.innerHTML = "";

    Object.keys(this.conversionRates[layout]).forEach((unit) => {
      const optionFrom = document.createElement("option");
      optionFrom.value = unit;
      optionFrom.textContent = unit;
      this.ui.selectFrom.appendChild(optionFrom);

      const optionTo = document.createElement("option");
      optionTo.value = unit;
      optionTo.textContent = unit;
      this.ui.selectTo.appendChild(optionTo);
    });
  }
}

const app = new App();
app.init();
