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

const CONVERSION_RATES = {
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

export {
  DEBUG,
  FUNCTIONS,
  REPLACEMENTS,
  VALID_EXPRESSION_REGEX,
  CONVERSION_RATES
};
