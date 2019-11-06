const core = require("@actions/core")
const github = require("@actions/github")
const shell = require("shelljs")
const yaml = require("js-yaml")
const fs = require("fs")

const context = github.context

const pagesBranch = "gh-pages"
const masterBranch = "master"

// User defined input
const jazzyVersion = core.getInput("version")
const configFilePath = core.getInput("config")
const jazzyArgs = core.getInput("args")
const token = core.getInput("personal_access_token")
const branch = core.getInput("branch") || pagesBranch
const message = core.getInput("message") || 'Deploying Updated Jazzy Docs'

const remote = `https://${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`

const gitArguments = () => {
  if (branch === pagesBranch) {
    return [
      "git init",
      `git config user.name ${context.actor}`,
      `git config user.email ${context.actor}@users.noreply.github.com`,
      "git add .",
      `git commit -m '${message}'`,
      `git push --force ${remote} master:${branch}`
    ]
  }
  
  if (branch === masterBranch) {
    return [
      `git config --global user.name ${context.actor}`,
      `git config --global user.email ${context.actor}@users.noreply.github.com`,
      `git config --global user.password "${token}"`,
      "git add .",
      `git commit -m '${message}'`,
      `git push origin HEAD:${branch}`
    ]
  }
}

const generateJazzyInstallCommand = () => {
  let gemInstall = "sudo gem install jazzy"

  if (jazzyVersion) {
    gemInstall + ` -v ${jazzyVersion}`
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
  if (branch !== pagesBranch || branch !== masterBranch) {
    core.setFailed
  }

  shell.exec(generateJazzyInstallCommand())
  shell.exec(generateJazzyArguments())

  if(branch == pagesBranch) {
    shell.cp("-r", `${getDocumentationFolder()}/*`, "../")

    shell.cd("../")
    shell.rm("-rf", `${process.env.GITHUB_WORKSPACE}`)  
  }

  gitArguments().forEach(command => {
    shell.exec(command, { fatal: true })
  })
}

try {
  generateAndDeploy()
} catch (error) {
  core.setFailed(error.message)
}
