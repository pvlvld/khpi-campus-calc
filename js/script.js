const DEBUG = true;

const FUNCTIONS = ["√", "^", "!", "%", "\\/", "\\*"];
const REPLACEMENTS = { ",": "." };

const VALID_EXPRESSION_REGEX = new RegExp(
  `^([+\\-*/^(),!]|(?:\\d+(?:\\[.|,]\\d+)?|\\[.|,]\\d+)|${FUNCTIONS.join("|")})+$`
);

class Calculator {
  constructor(name = "race00_vpavlenko_dmykhailov") {
    this.cutrrentLayout = "Standart";
    this.eval = new MathExpressionParser().evaluate;
    this.currentInput = "";
    this.name = name;
    this.memory = 0;
    this.ui = {
      display: {
        expression: document.getElementById("display-expression"),
        resultInput: document.getElementById("display-input-result")
      },
      history: document.getElementById("history-content"),
      buttons: document.querySelectorAll(".btn"),
      templates: {
        historyItem: document.createElement("div")
      }
    };
    this.ui.templates.historyItem.classList.add("history-item");

    this.memoryUI = {
      container: document.getElementById("memory-content")
    };

    this.clipboard = {
      user: navigator.clipboard,
      local: "",
      permissions: { read: false, write: false }
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
      switch (true) {
        case e.key === "Enter":
          e.preventDefault();
          this.updateDisplay(undefined, this.calculateExpression());
          break;
        case e.ctrlKey && ["A", "a", "ф", "Ф"].includes(e.key):
          e.preventDefault();
          break;
        default:
          break;
      }
    });

    this.ui.buttons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleButtonClick(e));
    });

    document.querySelectorAll(".memory-control").forEach(btn => {
      btn.addEventListener("click", () => this.handleMemoryControl(btn.innerText));
    });
  }

  requestClipboardPermissions() {
    this.clipboard.user.readText()
      .then(text => {
        this.clipboard.local = text;
        this.clipboard.permissions.read = true;
      })
      .catch(err => console.error("Failed to read clipboard: ", err));

    this.clipboard.user.writeText(this.clipboard.local)
      .then(() => this.clipboard.permissions.write = true)
      .catch(err => console.error("Failed to write clipboard: ", err));
  }

  handleButtonClick(e) {
    const value = e.target.innerText;

    switch (true) {
      case value === "=":
        try {
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
        this.clearDisplay();
        break;

      case value === "←":
        this.currentInput = this.currentInput.slice(0, -1) || "";
        this.ui.display.resultInput.innerHTML = this.currentInput || "0";
        break;

      case /^[0-9]$/.test(value):
        this.ui.display.resultInput.innerHTML = this.currentInput += value;
        break;

      case ["+", "-", "*", "/", "!", "%", "^", ".", "√"].includes(value):
        this.handleAlgebraicButtonClick(value);
        break;

      case value === "±":
        this.toggleSign();
        break;

      case value === "1/x":
        try {
          const currentValue = parseFloat(this.ui.display.resultInput.innerHTML);
          if (currentValue === 0) {
            this.ui.display.resultInput.innerHTML = "Cannot divide by 0";
          } else {
            const result = 1 / currentValue;
            this.appendHistoryItem({
              expression: `1/(${currentValue})`,
              result
            });
            this.updateDisplay(`1/(${currentValue})`, result);
            this.currentInput = "" + result;
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
    const startIndex = lastNumberMatch.index + lastNumberMatch[0].lastIndexOf(lastNumber);
    const charBefore = this.currentInput[startIndex - 1];
    if (charBefore && /[!%√]/.test(charBefore)) return;

    let updatedInput = "";
    if (lastNumber.startsWith("-")) {
      updatedInput = this.currentInput.slice(0, startIndex) + lastNumber.slice(1);
    } else {
      updatedInput = this.currentInput.slice(0, startIndex) + "-" + lastNumber;
    }

    this.currentInput = updatedInput;
    this.ui.display.resultInput.innerHTML = this.currentInput;
  }

  handleAlgebraicButtonClick(operator) {
    if (this.currentInput.length === 0) {
      this.currentInput = operator === "√" ? operator : "0" + operator;
    } else if (!isNaN(+(this.currentInput.at(-1) || NaN)) || operator === "√") {
      this.currentInput += operator;
    } else {
      this.currentInput = this.currentInput.slice(0, -1) + operator;
    }

    this.ui.display.resultInput.innerHTML = this.currentInput;
  }

  appendHistoryItem(item) {
    const historyItem = this.generateHistoryItem(item.expression, item.result);
    this.ui.history.appendChild(historyItem);
  }

  generateHistoryItem(expression, result) {
    const item = this.ui.templates.historyItem.cloneNode();
    item.appendChild(document.createElement("div")).innerHTML = expression;
    item.appendChild(document.createElement("span")).innerHTML = "" + result;
    item.addEventListener("click", this.historyItemClickHandler.bind(this));
    return item;
  }

  updateDisplay(expression = undefined, result = undefined) {
    if (result !== undefined) this.ui.display.resultInput.innerHTML = "" + result;
    if (expression !== undefined) this.ui.display.expression.innerHTML = expression;
    return { expression, result };
  }

  prepareExpression(expression) {
    for (const [key, value] of Object.entries(REPLACEMENTS)) {
      expression = expression.replace(new RegExp(key, "g"), value);
    }
    return expression;
  }

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

  handleMemoryControl(action) {
    const currentValue = parseFloat(this.ui.display.resultInput.innerHTML);
    switch (action) {
      case "MC":
        this.memory = 0;
        this.memoryUI.container.innerHTML = "";
        break;
      case "MR":
        this.currentInput = "" + this.memory;
        this.ui.display.resultInput.innerHTML = this.currentInput;
        break;
      case "MS":
        this.memory = currentValue;
        this.renderMemory();
        break;
      case "M+":
        this.memory += currentValue;
        this.renderMemory();
        break;
      case "M−":
        this.memory -= currentValue;
        this.renderMemory();
        break;
    }
  }

  renderMemory() {
    this.memoryUI.container.innerHTML = "";
    const item = document.createElement("div");
    item.classList.add("memory-item");
    item.innerHTML = `
      <span>${this.memory}</span>
      <div class="memory-item-controlls">
        <button onclick="app.handleMemoryControl('M+')">M+</button>
        <button onclick="app.handleMemoryControl('M−')">M−</button>
        <button onclick="app.handleMemoryControl('MC')">MC</button>
      </div>`;
    this.memoryUI.container.appendChild(item);
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

  performOperation(left, operator, right) {
    switch (operator) {
      case "+": return left + right;
      case "-": return left - right;
      case "*": return left * right;
      case "/": return left / right;
      case "^": return Math.pow(left, right);
      case "!": return this.factorial(left);
      case "√": return Math.sqrt(right);
      default: throw new Error(`Unhandled operator: ${operator}`);
    }
  }

  evaluate = (exp) => this.parseExp(exp.replace(/\s+/g, ""));

  parseExp(exp) {
    if (!exp) return 0;
    exp = this.handleParentheses(exp);
    if (exp.startsWith("-")) return -this.parseExp(exp.slice(1));
    if (exp.startsWith("+")) return this.parseExp(exp.slice(1));
    if (exp.startsWith("√")) return Math.sqrt(this.parseExp(exp.slice(1)));
    if (exp.endsWith("%") && !this.hasOperator(exp.slice(0, -1))) {
      return parseFloat(exp.slice(0, -1)) / 100;
    }

    const { operator, index } = this.findLowestPriorityOperator(exp);
    if (!operator) {
      if (exp.endsWith("!")) return this.factorial(this.parseExp(exp.slice(0, -1)));
      return parseFloat(exp);
    }

    const leftExp = exp.slice(0, index);
    const rightExp = exp.slice(index + 1);

    if (operator === "√") return Math.sqrt(this.parseExp(rightExp));

    const leftValue = this.parseExp(leftExp);

    if (rightExp.endsWith("%")) {
      const percentValue = parseFloat(rightExp.slice(0, -1)) / 100;
      switch (operator) {
        case "+": return leftValue + leftValue * percentValue;
        case "-": return leftValue - leftValue * percentValue;
        case "*": return leftValue * percentValue;
        case "/": return leftValue / percentValue;
        default: return this.performOperation(leftValue, operator, percentValue);
      }
    }

    return this.performOperation(leftValue, operator, this.parseExp(rightExp));
  }

  hasOperator(exp) {
    return Object.keys(this.priority).some(op => exp.includes(op));
  }

  handleParentheses(exp) {
    if (!exp.includes("(")) return exp;
    let depth = 0, startIndex = -1;
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

  findLowestPriorityOperator(exp) {
    let lowest = Infinity, index = -1, op = null, depth = 0;
    for (let i = exp.length - 1; i >= 0; i--) {
      const char = exp[i];
      if (char === ")") depth++;
      else if (char === "(") depth--;
      if (depth === 0 && this.priority[char] !== undefined) {
        if (char === "%" && i === exp.length - 1) continue;
        if (char === "-" && (i === 0 || this.priority[exp[i - 1]] !== undefined || exp[i - 1] === "(")) continue;
        if (char === "!" && i === exp.length - 1) continue;
        if (char === "√" && i === 0) continue;
        if (this.priority[char] <= lowest) {
          lowest = this.priority[char];
          index = i;
          op = char;
        }
      }
    }
    return { operator: op, index };
  }

  factorial(n) {
    if (!Number.isInteger(n)) throw new Error("TODO: FLOAT FACTORIAL ERROR");
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
}

// === Вкладки (історія/пам’ять)
function switchTab(tab) {
  const hist = document.getElementById("history-content");
  const mem = document.getElementById("memory-content");
  if (tab === "history") {
    hist.style.display = "block";
    mem.style.display = "none";
  } else {
    hist.style.display = "none";
    mem.style.display = "block";
  }
}

// === Ініціалізація
const app = new Calculator();
app.init();

// === Бургер
document.getElementById("sidebar-toggle").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");

  // На десктопі — розширяємо трохи вправо
  if (window.innerWidth > 768) {
    if (sidebar.classList.contains("active")) {
      sidebar.style.width = "10rem";
    } else {
      sidebar.style.width = "3rem";
    }
  }
});

// === Journal (адаптивно)
document.getElementById("open-journal").addEventListener("click", (e) => {
  e.stopPropagation();
  const histMem = document.getElementById("hist-mem");
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    histMem.classList.toggle("active");
  } else {
    switchTab("history");
  }
});

// === Memory Slider (Mv)
document.getElementById("toggle-memory-slider").addEventListener("click", () => {
  const slider = document.getElementById("memory-slider");
  if (slider.style.display === "block") {
    slider.style.display = "none";
  } else {
    slider.innerText = "Memory: " + (app.memory || 0);
    slider.style.display = "block";
  }
});

// === Закриття слайдера поза ним (моб)
document.addEventListener("click", (e) => {
  const histMem = document.getElementById("hist-mem");
  const sidebar = document.getElementById("sidebar");
  const isMobile = window.innerWidth <= 768;

  if (
    isMobile &&
    histMem.classList.contains("active") &&
    !histMem.contains(e.target) &&
    !sidebar.contains(e.target)
  ) {
    histMem.classList.remove("active");
  }
});
