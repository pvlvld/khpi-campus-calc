import {DEBUG, REPLACEMENTS, VALID_EXPRESSION_REGEX} from "./consts.js";
import {MathExpressionParser} from "./mathHandler.js";

export class Calculator {
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
      )
    };
    this.ui.templates.historyItem.classList.add("history-item");

    this.clipboard = {
      user: navigator.clipboard,
      local: "",
      permissions: {read: false, write: false}
    };

    this.overwriteInput = false;

    // Keyboard buttons glow animation
    const keyboard = document.getElementById("keyboard-standart");
    const keyboardButtons = /** @type {NodeListOf<HTMLElement> | undefined} */ (
      keyboard?.children
    );

    if (!keyboard || !keyboardButtons) {
      throw new Error("Keyboard element not found");
    }

    keyboard.addEventListener("pointermove", (ev) => {
      for (const featureEl of keyboardButtons) {
        const rect = featureEl.getBoundingClientRect();
        featureEl.style.setProperty("--x", String(ev.clientX - rect.left));
        featureEl.style.setProperty("--y", String(ev.clientY - rect.top));
        featureEl.classList.add("cursor-glow");
      }
    });

    keyboard.addEventListener("pointerleave", () => {
      // Remove the glow effect when the pointer leaves
      for (const featureEl of keyboardButtons) {
        featureEl.classList.remove("cursor-glow");
      }
    });

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
      button.addEventListener("click", (e) =>
        //@ts-expect-error
        this.handleUserInput(e.target?.innerText ?? "")
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

  handleKeyPress(e) {
    switch (true) {
      case e.key === "Enter":
        e.preventDefault();
        this.updateDisplay(undefined, this.calculateExpression());
        break;
      case e.ctrlKey && ["A", "a", "ф", "Ф"].includes(e.key):
        e.preventDefault();
        break;
      default:
        this.handleUserInput(e.key);
        break;
    }
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
      .catch((e) => {});

    this.clipboard.user
      .writeText(this.clipboard.local)
      .then(() => (this.clipboard.permissions.write = true))
      .catch((e) => {});
  }

  handleUserInput(value) {
    for (const [k, v] of Object.entries(REPLACEMENTS)) {
      value = value.replace(new RegExp(`^${k}$`, "i"), v);
    }

    const isDelAction = ["Delete", "Backspace", "←"].includes(value);
    if (!isDelAction && this.currentInput.length >= 120) {
      this.currentInput = this.currentInput.slice(0, 120);
      this.ui.display.resultInput.innerHTML = this.currentInput;
      return;
    }

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

      case value === "C" || value === "Delete" || value === "Del":
        if (this.overwriteInput) {
          this.currentInput = value;
        }
        this.clearDisplay();
        break;
      case value === "CE":
        if (!/\d/.test(this.currentInput.at(-1) || "")) {
          this.currentInput = this.currentInput.slice(0, -1);
        }
        while (
          this.currentInput.length > 0 &&
          /\d/.test(this.currentInput.at(-1) || "")
        ) {
          this.currentInput = this.currentInput.slice(0, -1);
        }

        this.updateDisplay(undefined, this.currentInput);
        break;

      case value === "←" || value === "Backspace":
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

      case ["M+", "M-", "MC", "MR", "MS"].includes(value):
        this.handleMemoryControl(value);
        break;

      default:
        if (DEBUG) console.error(`Unhandled button click: ${value}`);
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
