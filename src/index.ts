import { Application } from "probot";
import https from "https";
import * as child from 'child_process';

export = (app: Application) => {
  app.on("push", async (context) => {
    let repoOwner = context.payload.repository.owner.name;
    let repoName = context.payload.repository.name;
    https
      .get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/package.json`,
        (resp) => {
          let data = "";
          resp.on("data", (chunk) => {
            data += chunk;
          });
          resp.on("end", () => {
            let result = JSON.parse(data)["dependencies"];
            for (const [value, version] of Object.entries(result)) {
              if (version != child.exec(`npm view ${value} version`)) {
                let issueParams = {
                  title: `${value} ${version} available in npm packages`,
                  body: `Please upgrade ${value} package to version ${version}`
                }
                let createIssueParams = Object.assign({}, context.payload.repository, issueParams || {})
                context.github.issues.create(createIssueParams);
              }
            }
          }
        }
      )
      .on("error", (err) => {
        console.log("Error: " + err.message);
      });
  });
};
