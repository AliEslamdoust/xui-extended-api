const { setAPIKey } = require("./config/setAPIKey");
const { generateApiKey } = require("./utils/securityUtils");
const readline = require("readline").createInterface({
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

function print_success(text) {
  console.log(`${Colors.GREEN}✓ ${text}${Colors.ENDC}`);
}

function print_error(text) {
  console.log(`${Colors.RED}✗ ${text}${Colors.ENDC}`);
}

function print_info(text) {
  console.log(`${Colors.BLUE}ℹ ${text}${Colors.ENDC}`);
}

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
    print_info(
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
    print_error("Failed to generate API Key:");
    console.log(err);
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
    print_error("Failed to save API Key to config.yaml:");
    console.log(e);
  } finally {
    readline.close();
    process.exit(0);
  }
}
