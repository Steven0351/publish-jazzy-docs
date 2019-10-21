const core = require("@actions/core")
const github = require("@actions/github")
const shell = require("shelljs")
const yaml = require("js-yaml")
const fs = require("fs")

const context = github.context

const configFilePath = core.getInput("config")
const jazzyArgs = core.getInput("jazzy_args")
const branch = core.getInput("branch")
const token = core.getInput("personal_access_token")

const remote = `https://${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`

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
    const config = yaml.safeLoad(fs.readFileSync(configFilePath, "utf8"))
    if (config.output) {
      return config.output
    }
  }

  if (jazzyArgs) {
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
  const jazzyDocs = getDocumentationFolder()
  shell.exec("sudo gem install jazzy")
  shell.exec(generateJazzyArguments())
  shell.cp("-r", `${jazzyDocs}/*`, "../")
  shell.cd("../")
  shell.rm("-rf", `${process.env.GITHUB_WORKSPACE}`)

  shell.exec("git init")
  shell.exec(`git config user.name ${context.actor}`)
  shell.exec(`git config user.email ${context.actor}@users.noreply.github.com`)
  shell.exec("git add .")
  shell.exec("git commit -m 'Deploying Updated Jazzy Docs'")
  shell.exec(`git push --force ${remote} master:${branch}`)
}

try {
  generateAndDeploy()
} catch (error) {
  core.setFailed(error.message)
}

