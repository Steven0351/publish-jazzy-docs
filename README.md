# Publish Jazzy Docs to Github Pages
This is a GitHub Action generate and publish [Jazzy](https://github.com/realm/jazzy/) documentation for your Swift and/or Objective-C projects.

## Assumptions
This Action expects the following to be true:
* Your workflow runs on macOS
* You have documentation comments present in your Swift/Objective-C project (otherwise you will be generating a pretty useless website)
* You have a `gh-pages` branch in your repository
* A personal access token with `repo` scope. The `GITHUB_TOKEN` available as part of an action will not trigger a Github Pages build. See [this discussion thread](https://github.community/t5/GitHub-Actions/Github-action-not-triggering-gh-pages-upon-push/td-p/26869) for more information.

## Configuration
|Key|Description|Required|
|---|---|:---:|
| `personal_access_token` | A personal access token with repo scope for pushing documentation to `gh-pages` branch. See [Creating a Personal Access Token](https://help.github.com/en/enterprise/2.17/user/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) for creating the token and [Creating and Using Secrets](https://help.github.com/en/github/automating-your-workflow-with-github-actions/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables) for including secrets to be used in tandem with Github Actions. | Yes |
| `config` | The path to a Jazzy yaml configuration file| No |
| `args` | Command line arguments to be passed to Jazzy. See `jazzy --help` on your local machine for available options| No |
| `version` | The Jazzy version to run. Defaults to latest | No

## Limitations
This Action will never support the following:
* Generating and deploying documentation to `master` or in a docs folder on `master`
* Maintain commit history of the `gh-pages` branch.

This Action does not currently support the following:
* .json configuration files
* Specifying both `config` and `args`. Any `args` provided along with `config` will be ignored.

## Usage
Documentation generation can be as minimal as the following:
```yaml
name: PublishDocumentation

on: 
  release:
    types: [published]

jobs:
  deploy_docs:
    runs-on: macOS-latest
    steps:
    - uses: actions/checkout@v1
    - name: Publish Jazzy Docs
      uses: steven0351/publish-jazzy-docs@v1
      with:
        personal_access_token: ${{ secrets.ACCESS_TOKEN }}
```

Specify a Jazzy config file:
```yaml
...
    - name: Publish Jazzy Docs
      uses: steven0351/publish-jazzy-docs@v1
      with:
        personal_access_token: ${{ secrets.ACCESS_TOKEN }}
        config: .jazzy.yml
```

Pass CLI args:
```yaml
...
    - name: Publish Jazzy Docs
      uses: steven0351/publish-jazzy-docs@v1
      with:
        personal_access_token: ${{ secrets.ACCESS_TOKEN }}
        args: "--theme fullwidth --author Johnny Appleseed"
```

Specify a Jazzy version:
```yaml
...
    - name: Publish Jazzy Docs
      uses: steven0351/publish-jazzy-docs@v1
      with:
        personal_access_token: ${{ secrets.ACCESS_TOKEN }}
        version: 0.11.2
```

## Contributions
Pull requests are the preferred method of contributing. If you are unable to create a pull request, a detailed GitHub Issue describing the bug or feature request is more than welcome.