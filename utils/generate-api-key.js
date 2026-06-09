const { setAPIKey } = require("../config/setup-api-key");
const { generateApiKey } = require("./auth");
const readline = require("readline");

const Colors = {
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  CYAN: "\x1b[36m",
  GREEN: "\x1b[32m",
  RED: "\x1b[31m",
  ENDC: "\x1b[0m",
  BOLD: "\x1b[1m",
  ITALIC: "\x1b[3m",
};

const readlineInstance = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class ColorsClass {
  constructor() {
    this.YELLOW = "\x1b[33m";
    this.BLUE = "\x1b[34m";
    this.CYAN = "\x1b[36m";
    this.GREEN = "\x1b[32m";
    this.RED = "\x1b[31m";
    this.ENDC = "\x1b[0m";
    this.BOLD = "\x1b[1m";
    this.ITALIC = "\x1b[3m";
  }
}

const Colors = new ColorsClass();

function printHeader(text = "") {
  const placeholderLength = 60;
  const placeholder = "=".repeat(placeholderLength);
  const txt = String(text);
  const width = placeholderLength;
  const centered =
    txt.length >= width
      ? txt
      : " ".repeat(Math.floor((width - txt.length) / 2)) +
        txt +
        " ".repeat(Math.ceil((width - txt.length) / 2));
  console.log(`\n${Colors.BOLD}${Colors.CYAN}${placeholder}${Colors.ENDC}`);
  console.log(`${Colors.YELLOW}${centered}${Colors.ENDC}`);
  console.log(`${Colors.BOLD}${Colors.CYAN}${placeholder}${Colors.ENDC}\n`);
}

printHeader("Generate Access Code for X-UI Extended API");

const printSuccess = (text) =>
  console.log(`${Colors.GREEN}✓ ${text}${Colors.ENDC}`);
const printError = (text) =>
  console.log(`${Colors.RED}✗ ${text}${Colors.ENDC}`);
const printInfo = (text) =>
  console.log(`${Colors.BLUE}ℹ ${text}${Colors.ENDC}`);


function main() {
  try {
    const arg = process.argv.slice(2);
    const autoYes =
      arg.includes("--yes") || arg.includes("-y") || arg.includes("-Y");

    const { key, hash } = generateApiKey();
    print_success("Generated API Key:");
    console.log(key + "\n");
    print_success("API Key Hash (to be stored in config.yaml):");
    console.log(hash + "\n");

    printInfo(
      `${Colors.BLUE}Save the hash of the API Key to config.yaml file? ${Colors.ENDC}(${Colors.ITALIC}${Colors.BOLD}${Colors.GREEN}Y${Colors.ENDC}/${Colors.RED}n${Colors.ENDC})`
    );

    if (autoYes) {
      saveAndExit(hash);
    }

    readline.question("", (choice) => {
      if (
        choice.trim() === "Y" ||
        choice.trim() === "y" ||
        choice.trim() === ""
      ) {
        saveAndExit(hash);
      } else {
        readline.close();
      }
      process.exit(0);
    });
  } catch (err) {
    printError(err.message || err);
    process.exit(1);
  }
}

main();

function saveAndExit(hash) {
  try {
    const setAPI = setAPIKey(hash);
    if (setAPI) {
      print_success("API Key saved to config.yaml");
    } else {
      throw new Error("Failed to set API Key in config.yaml");
    }
  } catch (e) {
    printError(e.message || e);
    process.exit(1);
  } finally {
    readline.close();
    process.exit(0);
  }
}
