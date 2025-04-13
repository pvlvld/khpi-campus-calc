import { CONVERSION_RATES } from "./consts.js";

export class Converter {
  constructor() {
    /**
     * @type {"Length" | "Weight" | "Temperature"}
     */
    this.layout = "Temperature";
    this.ui = {
      input: /** @type {HTMLInputElement} */ (
        document.getElementById("converter-input-from")
      ),
      selectFrom: /** @type {HTMLSelectElement} */ (
        document.getElementById("converter-select-from")
      ),
      selectTo: /** @type {HTMLSelectElement} */ (
        document.getElementById("converter-select-to")
      ),
      convertFrom: /** @type {HTMLDivElement} */ (
        document.getElementById("converter-convert-from")
      ),
      convertTo: /** @type {HTMLDivElement} */ (
        document.getElementById("converter-convert-to")
      )
    };

    this.conversionRates = CONVERSION_RATES;
  }

  init() {
    this.ui.selectFrom.addEventListener("change", () => {
      this.convert(this.ui.input);
    });

    this.ui.selectTo.addEventListener("change", () => {
      this.convert(this.ui.input);
    });

    this.ui.input.addEventListener("input", (e) => {
      let currentValue = e.target.value || "0";

      if (!/^-?\d*\.?\d*$/.test(currentValue)) {
        return void (e.target.value = this.ui.convertFrom.innerText);
      }

      if (currentValue === "0" || currentValue === "-0") {
        void (this.ui.convertFrom.innerText = currentValue);
      } else {
        if (/^-?0\d+/.test(currentValue)) {
          let cleanValue = currentValue.replace(/^-?0+/, "") || "0";
          e.target.value = currentValue.startsWith("-")
            ? -Math.abs(cleanValue)
            : Math.abs(cleanValue);
        }

        this.ui.convertFrom.innerText = e.target.value;
      }

      this.convert(e.target);
    });

    const modes = document.getElementById("conversion-modes");

    Object.keys(this.conversionRates).forEach((key) => {
      const button = document.createElement("div");
      button.innerText = key;
      modes.appendChild(button);
    });

    function updateSelectedModeStyle() {
      Array.from(modes.children).forEach((btn) => {
        btn.classList.remove("active");
        if (btn.innerText === this.layout) {
          btn.classList.add("active");
        }
      });
    }

    modes.childNodes.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.ui.input.value = "";
        this.ui.convertFrom.innerText = "0";
        this.ui.convertTo.innerText = "0";
        this.switchLayout(e.target.innerText);
        updateSelectedModeStyle.bind(this)();
      });
    });
    updateSelectedModeStyle.bind(this)();
    this.switchLayout(this.layout);
  }

  convert(input) {
    return (this.ui.convertTo.innerText = this.convertUnits(
      parseFloat(input.value || "0"),
      this.ui.selectFrom.value,
      this.ui.selectTo.value
    ).toFixed(3));
  }

  convertUnits(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;

    const toBase = this.conversionRates[this.layout].toBase[fromUnit](value);
    return this.conversionRates[this.layout].fromBase[toUnit](toBase);
  }

  switchLayout(layout) {
    if (!this.conversionRates[layout]) {
      throw new Error(`Unexpected layout: ${layout}`);
    }
    this.layout = layout;

    this.ui.selectFrom.innerHTML = "";
    this.ui.selectTo.innerHTML = "";

    const units = Object.keys(this.conversionRates[this.layout].fromBase);

    units.forEach((unit, index) => {
      const optionFrom = document.createElement("option");
      optionFrom.value = unit;
      optionFrom.textContent = unit;
      this.ui.selectFrom.appendChild(optionFrom);

      const optionTo = document.createElement("option");
      optionTo.value = unit;
      optionTo.textContent = unit;

      if (index === 1) optionTo.selected = true;

      this.ui.selectTo.appendChild(optionTo);
    });

    this.convert(this.ui.input);
  }
}