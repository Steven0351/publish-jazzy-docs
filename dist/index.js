module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 450:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

const core = __webpack_require__(809)
const github = __webpack_require__(404)
const shell = __webpack_require__(600)
const yaml = __webpack_require__(464)
const fs = __webpack_require__(747)

const context = github.context

shell.config.fatal = true

// User defined input
var branch = core.getInput("branch")
var history = core.getInput("history")
const jazzyVersion = core.getInput("version")
const configFilePath = core.getInput("config")
const jazzyArgs = core.getInput("args")
const token = core.getInput("personal_access_token")

if (branch == '' || branch == null || branch == undefined) {
    branch = "gh-pages"
}

if (history == '' || history == null || history == undefined) {
    history = true
}

const remote = `https://${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`

const generateJazzyInstallCommand = () => {
  let gemInstall = "sudo gem install jazzy"

  if (jazzyVersion) {
    gemInstall += ` -v ${jazzyVersion}`
  }

  return gemInstall
}

const generateJazzyArguments = () => {
  let command = `jazzy`

  if (jazzyArgs) {
    command += ` ${jazzyArgs}`
  }

  if (configFilePath) {
    command += ` --config ${configFilePath}`
  }

  return command
}

const sliceDocumentsFromJazzyArgs = (outputArg) => {
  const startIndexOfDocsDir = jazzyArgs.indexOf(outputArg) + outputArg.length + 1
  const endIndexOfDocsDir = jazzyArgs.indexOf(" ", startIndexOfDocsDir)

  if (endIndexOfDocsDir != -1) {
    return jazzyArgs.slice(startIndexOfDocsDir, endIndexOfDocsDir)
  } else {
    return jazzyArgs.slice(startIndexOfDocsDir)
  }
}

const getDocumentationFolder = () => {
  if (jazzyArgs) {
    // --output needs to be checked first, because --output includes -o
    if (jazzyArgs.includes("--output")) {
      return sliceDocumentsFromJazzyArgs("--output")
    }

    if (jazzyArgs.includes("-o")) {
      return sliceDocumentsFromJazzyArgs("-o")
    }
  }

  if (configFilePath) {
    let config
    const fileExt = configFilePath.split(".").pop().toLowerCase()

    if (fileExt === "yml" || fileExt === "yaml") {
      config = yaml.safeLoad(fs.readFileSync(configFilePath, "utf8"))
    } else if (fileExt === "json") {
      const rawData = fs.readFileSync(configFilePath)
      config = JSON.parse(rawData)
    }

    if (config.output) {
      return config.output
    }
  }

  return "docs"
}

const generateAndDeploy = () => {
  shell.exec(generateJazzyInstallCommand())
  shell.exec(generateJazzyArguments())
  var folder = getDocumentationFolder()
  if (folder.charAt(folder.length - 1) != '/') {
      folder += '/'
  }
  shell.exec("mkdir -p ../.staging/" + folder)
  // we don't want it to nest on move
  shell.exec("rm -r ../.staging/" + folder)
  shell.mv(folder, "../.staging/" + folder)
  shell.exec("mkdir ../.docs")
  shell.cd("../.docs")

  if (history) {
    shell.exec(`git clone ${remote} .`)
    shell.exec(`git checkout ${branch}`)
  } else {
    shell.exec("git init")
    shell.exec(`git checkout -b ${branch}`)
  }

  shell.exec("mkdir -p " + folder, {fatal: false})
  // we don't want it to nest on move
  shell.exec("rm -rf " + folder)
  shell.mv("../.staging/" + folder, folder)
  shell.exec("rm " + folder + "undocumented.json")
  shell.exec(`git config user.name ${context.actor}`)
  shell.exec(`git config user.email ${context.actor}@users.noreply.github.com`)
  shell.exec("git add .")
  shell.exec("git commit -m 'Deploying Updated Jazzy Docs'")
  shell.exec(`git push --force ${remote} ${branch}`)

  shell.cd(process.env.GITHUB_WORKSPACE)
}

try {
  generateAndDeploy()
} catch (error) {
  core.setFailed(error.message)
}


/***/ }),

/***/ 809:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 404:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 464:
/***/ ((module) => {

module.exports = eval("require")("js-yaml");


/***/ }),

/***/ 600:
/***/ ((module) => {

module.exports = eval("require")("shelljs");


/***/ }),

/***/ 747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__webpack_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(450);
/******/ })()
;