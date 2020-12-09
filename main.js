const core = require("@actions/core")
const github = require("@actions/github")
const shell = require("shelljs")
const yaml = require("js-yaml")
const fs = require("fs")

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
