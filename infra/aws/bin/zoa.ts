#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ZoaAuthStack } from "../lib/auth-stack";
import { ZoaGithubOidcStack } from "../lib/github-oidc-stack";
import { ZoaStorageStack } from "../lib/storage-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "eu-west-1",
};

const stage = app.node.tryGetContext("stage") ?? "dev";
const githubOwner = app.node.tryGetContext("githubOwner") ?? "REPLACE_GITHUB_OWNER";
const githubRepo = app.node.tryGetContext("githubRepo") ?? "zoa";

new ZoaStorageStack(app, `ZoaStorage-${stage}`, {
  env,
  stage,
});

new ZoaAuthStack(app, `ZoaAuth-${stage}`, {
  env,
  stage,
  callbackUrls: app.node.tryGetContext("callbackUrls") ?? [
    "http://localhost:3000/auth/callback",
  ],
  logoutUrls: app.node.tryGetContext("logoutUrls") ?? ["http://localhost:3000"],
});

new ZoaGithubOidcStack(app, `ZoaGithubOidc-${stage}`, {
  env,
  stage,
  githubOwner,
  githubRepo,
  // Only one GitHub OIDC provider per AWS account is allowed.
  createOidcProvider: app.node.tryGetContext("createOidcProvider") !== "false",
});

app.synth();
