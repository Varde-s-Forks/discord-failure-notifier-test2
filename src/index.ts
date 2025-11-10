import * as core from "@actions/core";
import * as github from "@actions/github";

const AVATAR_URL = "https://github.githubassets.com/favicons/favicon.png";
const AUTHOR_ICON_URL =
  "https://em-content.zobj.net/source/twitter/408/face-with-tears-of-joy_1f602.png";

async function run(): Promise<void> {
  try {
    const inputs = {
      webhookUrl: core.getInput("webhook-url", { required: true }),
      token: core.getInput("token", { required: true }),
    };

    const server_url = process.env.GITHUB_SERVER_URL;

    const repo = process.env.GITHUB_REPOSITORY || "";
    const workflow = process.env.GITHUB_WORKFLOW;
    const jobName = process.env.GITHUB_JOB;
    const jobHtmlUrl = await getCurrentJob(inputs.token);
    const head_ref = process.env.GITHUB_HEAD_REF;
    const ref = process.env.GITHUB_REF;
    const branch = head_ref || (ref || "").replace("refs/heads/", "");

    const embed = {
      color: 0xff0000,
      author: {
        name: repo,
        url: `${server_url}/${repo}/tree/${branch}`,
        icon_url: AUTHOR_ICON_URL,
      },
      title: `"${jobName}" failed on ${branch} branch`,
      url: jobHtmlUrl,
      description: `**Workflow:** ${workflow}`,
      timestamp: new Date().toISOString(),
    };

    const payload = {
      username: "Github",
      avatar_url: AVATAR_URL,
      embeds: [embed],
    };

    const res = await fetch(inputs.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to send Discord webhook: ` +
          `${res.status} ${res.statusText} - ${await res.text()}`,
      );
    }

    core.info("Discord notification sent.");
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}

async function getCurrentJob(token: string): Promise<string> {
  const octokit = github.getOctokit(token);

  const jobs = await octokit.rest.actions.listJobsForWorkflowRun({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    run_id: github.context.runId,
  });

  const currentJob = jobs.data.jobs.find(
    (j) => j.name === process.env.GITHUB_JOB,
  );

  return currentJob?.html_url ?? "";
}

run();
