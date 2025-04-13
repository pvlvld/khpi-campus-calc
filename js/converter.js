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

    this.conversionRates = {
      Length: {
        fromBase: {
          m: (value) => value,
          km: (value) => value / 1000,
          cm: (value) => value * 100,
          mm: (value) => value * 1000,
          ft: (value) => value * 3.28084,
          in: (value) => value * 39.3701
        },
        toBase: {
          m: (value) => value,
          km: (value) => value * 1000,
          cm: (value) => value / 100,
          mm: (value) => value / 1000,
          ft: (value) => value / 3.28084,
          in: (value) => value / 39.3701
        }
      },
      Weight: {
        fromBase: {
          kg: (value) => value,
          g: (value) => value * 1000,
          lb: (value) => value * 2.20462,
          oz: (value) => value * 35.274
        },
        toBase: {
          kg: (value) => value,
          g: (value) => value / 1000,
          lb: (value) => value / 2.20462,
          oz: (value) => value / 35.274
        }
      },
      Temperature: {
        fromBase: {
          C: (value) => value,
          F: (value) => (value * 9) / 5 + 32,
          K: (value) => value + 273.15
        },
        toBase: {
          C: (value) => value,
          F: (value) => ((value - 32) * 5) / 9,
          K: (value) => value - 273.15
        }
      },
      Area: {
        fromBase: {
          m2: (value) => value,
          km2: (value) => value / 1000000,
          cm2: (value) => value * 10000,
          mm2: (value) => value * 1000000,
          ft2: (value) => value * 10.7639,
          in2: (value) => value * 1550.0031,
          acre: (value) => value / 4046.8564,
          ha: (value) => value / 10000
        },
        toBase: {
          m2: (value) => value,
          km2: (value) => value * 1000000,
          cm2: (value) => value / 10000,
          mm2: (value) => value / 1000000,
          ft2: (value) => value / 10.7639,
          in2: (value) => value / 1550.0031,
          acre: (value) => value * 4046.8564,
          ha: (value) => value * 10000
        }
      },
      Speed: {
        fromBase: {
          mps: (value) => value,
          kph: (value) => value * 3.6,
          mph: (value) => value * 2.23694,
          knot: (value) => value * 1.94384,
          fts: (value) => value * 3.28084
        },
        toBase: {
          mps: (value) => value,
          kph: (value) => value / 3.6,
          mph: (value) => value / 2.23694,
          knot: (value) => value / 1.94384,
          fts: (value) => value / 3.28084
        }
      },
      Time: {
        fromBase: {
          s: (value) => value,
          min: (value) => value / 60,
          h: (value) => value / 3600,
          day: (value) => value / 86400,
          week: (value) => value / 604800,
          month: (value) => value / 2592000, // Approximated as 30 days
          year: (value) => value / 31536000 // Approximated as 365 days
        },
        toBase: {
          s: (value) => value,
          min: (value) => value * 60,
          h: (value) => value * 3600,
          day: (value) => value * 86400,
          week: (value) => value * 604800,
          month: (value) => value * 2592000, // Approximated as 30 days
          year: (value) => value * 31536000 // Approximated as 365 days
        }
      },
      Angle: {
        fromBase: {
          rad: (value) => value,
          deg: (value) => value * (180 / Math.PI),
          grad: (value) => value * (200 / Math.PI)
        },
        toBase: {
          rad: (value) => value,
          deg: (value) => value * (Math.PI / 180),
          grad: (value) => value * (Math.PI / 200)
        }
      },
      Data: {
        fromBase: {
          bit: (value) => value,
          byte: (value) => value / 8,
          KB: (value) => value / 8 / 1000,
          KiB: (value) => value / 8 / 1024,
          MB: (value) => value / 8 / 1000000,
          MiB: (value) => value / 8 / 1048576,
          GB: (value) => value / 8 / 1000000000,
          GiB: (value) => value / 8 / 1073741824,
          TB: (value) => value / 8 / 1000000000000,
          TiB: (value) => value / 8 / 1099511627776,
          PB: (value) => value / 8 / 1000000000000000,
          PiB: (value) => value / 8 / 1125899906842624,
          EB: (value) => value / 8 / 1000000000000000000,
          EiB: (value) => value / 8 / 1152921504606847000,
          ZB: (value) => value / 8 / 1000000000000000000000,
          ZiB: (value) => value / 8 / 1180591620717411303424,
          YB: (value) => value / 8 / 1000000000000000000000000,
          YiB: (value) => value / 8 / 1208925819614629174706176
        },
        toBase: {
          bit: (value) => value,
          byte: (value) => value * 8,
          KB: (value) => value * 8 * 1000,
          KiB: (value) => value * 8 * 1024,
          MB: (value) => value * 8 * 1000000,
          MiB: (value) => value * 8 * 1048576,
          GB: (value) => value * 8 * 1000000000,
          GiB: (value) => value * 8 * 1073741824,
          TB: (value) => value * 8 * 1000000000000,
          TiB: (value) => value * 8 * 1099511627776,
          PB: (value) => value * 8 * 1000000000000000,
          PiB: (value) => value * 8 * 1125899906842624,
          EB: (value) => value * 8 * 1000000000000000000,
          EiB: (value) => value * 8 * 1152921504606847000,
          ZB: (value) => value * 8 * 1000000000000000000000,
          ZiB: (value) => value * 8 * 1180591620717411303424,
          YB: (value) => value * 8 * 1000000000000000000000000,
          YiB: (value) => value * 8 * 1208925819614629174706176
        }
      }
    };
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