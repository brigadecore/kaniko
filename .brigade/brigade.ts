import { events, Event, Job, Container } from "@brigadecore/brigadier"

const releaseTagRegex = /^refs\/tags\/(v[0-9]+(?:\.[0-9]+)*(?:\-.+)?)$/

const kanikoImg = "brigadecore/kaniko:v0.2.0"
const dindImg = "docker:stable-dind"
const localPath = "/workspaces/kaniko"

class DinDJob extends Job {
  constructor(target: string, event: Event, env?: {[key: string]: string}) {
    super(target, kanikoImg, event)
    this.primaryContainer.sourceMountPath = localPath
    this.primaryContainer.workingDirectory = localPath
    this.primaryContainer.environment = env || {}
    this.primaryContainer.environment.DOCKER_HOST = "localhost:2375"
    if (event.worker?.git?.ref) {
      const matchStr = event.worker.git.ref.match(releaseTagRegex)
      if (matchStr) {
        this.primaryContainer.environment["VERSION"] = Array.from(matchStr)[1] as string
      }
    }
    this.primaryContainer.command = ["sh"]
    this.primaryContainer.arguments = ["-c", `sleep 20 && make ${target}`]
    // DinD running as a sidecar...
    this.sidecarContainers = {
      "docker": new Container(dindImg)
    }
    this.sidecarContainers.docker.privileged = true
    this.sidecarContainers.docker.environment.DOCKER_TLS_CERTDIR=""
    
  }
}

// A map of all jobs. When a check_run:rerequested event wants to re-run a
// single job, this allows us to easily find that job by name.
const jobs: {[key: string]: (event: Event) => Job } = {}

// Build / publish stuff:

const buildJobName = "build"
const buildJob = (event: Event) => {
  return new DinDJob(buildJobName, event)
}
jobs[buildJobName] = buildJob

const pushJobName = "push"
const pushJob = (event: Event) => {
  return new DinDJob(pushJobName, event, {
    "DOCKER_ORG": event.project.secrets.dockerhubOrg,
    "DOCKER_USERNAME": event.project.secrets.dockerhubUsername,
    "DOCKER_PASSWORD": event.project.secrets.dockerhubPassword
  })
}
jobs[pushJobName] = pushJob

// Just build, unless this is a merge to main, then build and push.
async function runSuite(event: Event): Promise<void> {
  if (event.worker?.git?.ref != "main") {
    // Just build
    await buildJob(event).run()
  } else {
    // Build and push
    await pushJob(event).run()
  }
}

// Either of these events should initiate execution of the entire test suite.
events.on("brigade.sh/github", "check_suite:requested", runSuite)
events.on("brigade.sh/github", "check_suite:rerequested", runSuite)

// This event indicates a specific job is to be re-run.
events.on("brigade.sh/github", "check_run:rerequested", async event => {
  // Check run names are of the form <project name>:<job name>, so we strip
  // event.project.id.length + 1 characters off the start of the check run name
  // to find the job name.
  const jobName = JSON.parse(event.payload).check_run.name.slice(event.project.id.length + 1)
  const job = jobs[jobName]
  if (job) {
    await job(event).run()
    return
  }
  throw new Error(`No job found with name: ${jobName}`)
})

// Pushing new commits to any branch in github triggers a check suite. Such
// events are already handled above. Here we're only concerned with the case
// wherein a new TAG has been pushed-- and even then, we're only concerned with
// tags that look like a semantic version and indicate a formal release should
// be performed.
events.on("brigade.sh/github", "push", async event => {
  const matchStr = event.worker.git.ref.match(releaseTagRegex)
  if (matchStr) {
    // This is an official release with a semantically versioned tag
    await pushJob(event).run()
  } else {
    console.log(`Ref ${event.worker.git.ref} does not match release tag regex (${releaseTagRegex}); not releasing.`)
  }
})

events.process()
