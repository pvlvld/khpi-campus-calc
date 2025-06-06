const DEBUG = false;

const FUNCTIONS = ["√", "^", "!", "%", "/", "*"];
const REPLACEMENTS = {",": ".", s: "√"};

function escapeRegex(str) {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
}

const ESCAPED_FUNCTIONS = FUNCTIONS.map(escapeRegex).join("|");

const VALID_EXPRESSION_REGEX = new RegExp(
  `^([+\\-*/^(),]|(?:\\d+(?:[.,]\\d+)?|[.,]\\d+)|${ESCAPED_FUNCTIONS})+$`
);

const CONFIG = {
  limits: {
    maxConverterInputLength: 15,
    maxCalculatorInputLength: 120
  },
  preserveConverterInput: true,
}

const CONVERSION_RATES = {
  Length: {
    icon: `<i class="fa-solid fa-ruler" data-c="Length" ></i>`,
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
    icon: `<i class="fa-solid fa-weight-scale" data-c="Weight"></i>`,
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
    icon: `<i class="fa-solid fa-temperature-half" data-c="Temperature"></i>`,
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
    icon: `<i class="fa-solid fa-square" data-c="Area"></i>`,
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
    icon: `<i class="fa-solid fa-gauge" data-c="Speed"></i>`,
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
    icon: `<i class="fa-solid fa-clock" data-c="Time"></i>`,
    fromBase: {
      s: (value) => value,
      min: (value) => value / 60,
      h: (value) => value / 3600,
      day: (value) => value / 86400,
      week: (value) => value / 604800,
      month: (value) => value / 2592000,
      year: (value) => value / 31536000
    },
    toBase: {
      s: (value) => value,
      min: (value) => value * 60,
      h: (value) => value * 3600,
      day: (value) => value * 86400,
      week: (value) => value * 604800,
      month: (value) => value * 2592000,
      year: (value) => value * 31536000
    }
  },
  Angle: {
    icon: `<i class="fa-solid fa-angle-right" data-c="Angle"></i>`,
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
    icon: `<i class="fa-solid fa-database" data-c="Data"></i>`,
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
  },
  Energy: {
    icon: `<i class="fa-solid fa-bolt" data-c="Energy"></i>`,
    fromBase: {
      J: (value) => value,
      kJ: (value) => value / 1000,
      eV: (value) => value / 1.602176634e-19,
      cal: (value) => value / 4.184,
      kcal: (value) => value / 4184,
      ftlb: (value) => value / 1.3558179483314,
      BTU: (value) => value / 1055.06,
      Wh: (value) => value / 3600,
      kWh: (value) => value / 3600000
    },
    toBase: {
      J: (value) => value,
      kJ: (value) => value * 1000,
      eV: (value) => value * 1.602176634e-19,
      cal: (value) => value * 4.184,
      kcal: (value) => value * 4184,
      ftlb: (value) => value * 1.3558179483314,
      BTU: (value) => value * 1055.06,
      Wh: (value) => value * 3600,
      kWh: (value) => value * 3600000
    }
  },
  Volume: {
    icon: `<i class="fa-solid fa-cube" data-c="Volume"></i>`,
    fromBase: {
      m3: (value) => value,
      L: (value) => value * 1000,
      mL: (value) => value * 1000000,
      cm3: (value) => value * 1000000,
      mm3: (value) => value * 1000000000,
      ft3: (value) => value * 35.3147,
      in3: (value) => value * 61023.7,
      gal_us: (value) => value * 264.172,
      gal_uk: (value) => value * 219.969,
      qt_us: (value) => value * 1056.69,
      qt_uk: (value) => value * 879.877,
      pt_us: (value) => value * 2113.38,
      pt_uk: (value) => value * 1759.75,
      floz_us: (value) => value * 33814,
      floz_uk: (value) => value * 35195.1,
      cup: (value) => value * 4226.75,
      tbsp: (value) => value * 67628,
      tsp: (value) => value * 202884
    },
    toBase: {
      m3: (value) => value,
      L: (value) => value / 1000,
      mL: (value) => value / 1000000,
      cm3: (value) => value / 1000000,
      mm3: (value) => value / 1000000000,
      ft3: (value) => value / 35.3147,
      in3: (value) => value / 61023.7,
      gal_us: (value) => value / 264.172,
      gal_uk: (value) => value / 219.969,
      qt_us: (value) => value / 1056.69,
      qt_uk: (value) => value / 879.877,
      pt_us: (value) => value / 2113.38,
      pt_uk: (value) => value / 1759.75,
      floz_us: (value) => value / 33814,
      floz_uk: (value) => value / 35195.1,
      cup: (value) => value / 4226.75,
      tbsp: (value) => value / 67628,
      tsp: (value) => value / 202884
    }
  }
};

export {
  DEBUG,
  FUNCTIONS,
  REPLACEMENTS,
  VALID_EXPRESSION_REGEX,
  CONVERSION_RATES,
  CONFIG
};
