const core = require("@actions/core")
const github = require("@actions/github")
const shell = require("shelljs")
const yaml = require("js-yaml")
const fs = require("fs")

const context = github.context

const branch = "gh-pages"

// User defined input
const jazzyVersion = core.getInput("version")
const configFilePath = core.getInput("config")
const jazzyArgs = core.getInput("args")
const token = core.getInput("personal_access_token")

const remote = `https://${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`

const generateJazzyInstallCommand = () => {
  let gemInstall = "sudo gem install jazzy"

  if (jazzyVersion) {
    gemInstall += ` -v ${jazzyVersion}`
  }

  return gemInstall
}

const generateJazzyArguments = () => {
  if (configFilePath) {
    return `jazzy --config ${configFilePath}`
  }

  if (jazzyArgs) {
    return `jazzy ${jazzyArgs}`
  }

  return "jazzy"
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

  if (jazzyArgs) {
    // --output needs to be checked first, because --output includes -o
    if (jazzyArgs.includes("--output")) {
      return sliceDocumentsFromJazzyArgs("--output")
    }

    if (jazzyArgs.includes("-o")) {
      return sliceDocumentsFromJazzyArgs("-o")
    }
  }

  return "docs"
}

const generateAndDeploy = () => {
  shell.exec(generateJazzyInstallCommand())
  shell.exec(generateJazzyArguments())
  shell.exec("mkdir ../.docs")
  shell.cp("-r", `${getDocumentationFolder()}/*`, "../.docs/")
  shell.cp("CNAME", "../.docs/")

  shell.cd("../.docs")

  shell.exec("git init")
  shell.exec(`git config user.name ${context.actor}`)
  shell.exec(`git config user.email ${context.actor}@users.noreply.github.com`)
  shell.exec("git add .")
  shell.exec("git commit -m 'Deploying Updated Jazzy Docs'")
  shell.exec(`git push --force ${remote} master:${branch}`)
  
  shell.cd(process.env.GITHUB_WORKSPACE)
}

try {
  generateAndDeploy()
} catch (error) {
  core.setFailed(error.message)
}

