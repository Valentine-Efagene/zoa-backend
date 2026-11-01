#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ZoaAuthStack } from "../lib/auth-stack";
import { ZoaGithubOidcStack } from "../lib/github-oidc-stack";
import { ZoaEmailStack } from "../lib/email-stack";
import { ZoaStorageStack } from "../lib/storage-stack";

const app = new cdk.App();

function parseStringListContext(key: string, fallback: string[]): string[] {
  const raw = app.node.tryGetContext(key);
  if (raw == null) return fallback;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return fallback;
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

const stage = app.node.tryGetContext("stage") ?? "dev";
const githubOwner = app.node.tryGetContext("githubOwner") ?? "REPLACE_GITHUB_OWNER";
const githubRepo = app.node.tryGetContext("githubRepo") ?? "zoa-backend";

const defaultCallbackUrls =
  stage === "prod"
    ? ["http://localhost:3000", "https://zoa-theta.vercel.app"]
    : [
        "http://localhost:3000",
        "https://zoa-dev.vercel.app",
        "https://zoa-theta.vercel.app",
      ];
const defaultLogoutUrls =
  stage === "prod"
    ? ["http://localhost:3000", "https://zoa-theta.vercel.app"]
    : [
        "http://localhost:3000",
        "https://zoa-dev.vercel.app",
        "https://zoa-theta.vercel.app",
      ];

new ZoaStorageStack(app, `ZoaStorage-${stage}`, {
  env,
  stage,
});

new ZoaAuthStack(app, `ZoaAuth-${stage}`, {
  env,
  stage,
  callbackUrls: parseStringListContext("callbackUrls", defaultCallbackUrls),
  logoutUrls: parseStringListContext("logoutUrls", defaultLogoutUrls),
});

new ZoaGithubOidcStack(app, `ZoaGithubOidc-${stage}`, {
  env,
  stage,
  githubOwner,
  githubRepo,
  // Only one GitHub OIDC provider per AWS account is allowed.
  createOidcProvider: app.node.tryGetContext("createOidcProvider") !== "false",
});

const emailApexDomain =
  app.node.tryGetContext("emailApexDomain") ?? "zaynababdussalam.com";
const deployEmailStack =
  stage !== "prod" &&
  app.node.tryGetContext("deployEmailStack") !== "false";

if (deployEmailStack) {
  new ZoaEmailStack(app, `ZoaEmail-${stage}`, {
    env,
    apexDomain: emailApexDomain,
    mailSubdomain: app.node.tryGetContext("emailMailSubdomain") ?? "mail",
    dmarcReportEmail: app.node.tryGetContext("emailDmarcReport"),
  });
}

app.synth();
