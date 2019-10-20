const core = require("@actions/core")
const exec = require("@actions/exec")
const github = require("@actions/github")
const io = require("@actions/io")
const yaml = require("js-yaml")
const fs = require("fs")

const context = github.context

const configFilePath = core.getInput("config")
const jazzyArgs = core.getInput("jazzy_args")
const branch = core.getInput("branch")
const token = core.getInput("personal_access_token")

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
  const startIndexOfDocsDir = jazzyArgs.indexOf(outputArg) + 3
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
    if (jazzyArgs.includes("-o")) {
      return sliceDocumentsFromJazzyArgs("-o")
    }

    if (jazzyArgs.includes("--output")) {
      return sliceDocumentsFromJazzyArgs("--output")
    }
  }

  return "docs"
}

const generateAndDeploy = async () => {
  await exec.exec("pwd")
  const jazzyDocs = getDocumentationFolder()
  await exec.exec("sudo gem install jazzy")
  await exec.exec(generateJazzyArguments())
  await io.rmRF(".git")

  await exec.exec(`cd ${jazzyDocs}`)
  await exec.exec("pwd")
  
  const remote = `https://${token}@github.com/${context.repo.owner}/${context.repo.repo}.git`
  
  await exec.exec("git init")
  await exec.exec(`git config user.name ${context.actor}`)
  await exec.exec(`git config user.email ${context.actor}@users.noreply.github.com`)
  await exec.exec(`git remote add origin ${remote}`)
  await exec.exec("git add .")
  await exec.exec("git", ["commit", "-m", "'Deploying Updated Jazzy Docs'"])
  await exec.exec(`git push --force origin master:${branch}`)
}

try {
  generateAndDeploy()
} catch (error) {
  core.setFailed(error.message)
}

