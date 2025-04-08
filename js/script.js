const FUNCTIONS = [
  "√",
  "sqrt",
  "π",
  "PI",
  "sin",
  "asin",
  "cos",
  "acos",
  "tan",
  "atan",
  "log",
  "pow",
  "e",
  "!",
  "%",
  "÷"
];

const REPLACEMENTS = {
  "√": "sqrt",
  π: "PI",
  ",": ".",
  "×": "*",
  "÷": "/"
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
    this.name = name;
    this.ui = {
      display: {
        expression: /** @type {HTMLElement} */ (
          document.getElementById("display-expression")
        ),
        result: /** @type {HTMLElement} */ (
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
      if (data && this.validateExpr(data)) this.ui.display.innerHTML = data;
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
      button.addEventListener("click", (e) => {
        this.handleButtonClick(e);
      });
    });
  }

  requestClipboardPermissions() {
    console.log("here");
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

  changeLayout() {
    this.clearDisplay();
    // TODO:
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
        this.ui.display.result.innerHTML += value;
        break;
      default:
        console.error(`Unhandled button click: ${value}`);
        break;
    }
  }

  appendHistoryItem(item) {
    // JSON representation locally or plain HTML string?
    const data = {history: this.ui.history.innerHTML};
    localStorage.setItem(this.name, JSON.stringify(data));
  }

  /**
   * @param {string} expression
   * @param {string | number} result
   * @returns {Node}
   */
  generateHistoryItem(expression, result) {
    const item = this.ui.templates.historyItem.cloneNode();
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
    this.ui.display.result.innerHTML = "0";
  }

  /**
   * @param {string} expression
   * @param {string | number} result
   */
  updateDisplay(expression = "0", result = "") {
    this.ui.display.result.innerHTML = "" + result;
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
  validateExpr(expression) {
    return VALID_EXPRESSION_REGEX.test(expression);
  }

  /**
   * @returns {number}
   * @throws {Error} if expression is invalid
   */
  calculateExpression() {
    if (!this.validateExpr(this.ui.display.innerHTML)) {
      throw new Error("Invalid expression");
    }
    //@ts-expect-error
    return math.evaluate(
      this.prepareExpression(this.ui.display.expression.innerHTML)
    );
  }

  historyItemClickHandler(e) {
    if (!e.target.classList.contains("calculator-history-item")) return;
    this.ui.display.innerHTML = e.target.innerText;
    navigator.clipboard.writeText(e.target.innerText);
  }
}

class Converter {
  //
}

const app = new Calculator().init();
