import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface ZoaGithubOidcStackProps extends cdk.StackProps {
  stage: string;
  /** GitHub org or user, e.g. "my-org" */
  githubOwner: string;
  /** Repository name, e.g. "zoa" */
  githubRepo: string;
  /**
   * Set false if the account already has a GitHub Actions OIDC provider
   * (only one is allowed per account for this issuer).
   */
  createOidcProvider?: boolean;
}

/**
 * GitHub Actions OIDC provider + deploy roles (no long-lived access keys).
 * Wire role ARNs into GitHub repo variables AWS_DEPLOY_ROLE_ARN / AWS_INFRA_ROLE_ARN.
 */
export class ZoaGithubOidcStack extends cdk.Stack {
  public readonly apiDeployRole: iam.Role;
  public readonly infraDeployRole: iam.Role;

  constructor(scope: Construct, id: string, props: ZoaGithubOidcStackProps) {
    super(scope, id, props);

    const {
      stage,
      githubOwner,
      githubRepo,
      createOidcProvider = true,
    } = props;
    const repoSub = `repo:${githubOwner}/${githubRepo}:*`;

    const oidcProvider = createOidcProvider
      ? new iam.OpenIdConnectProvider(this, "GithubOidc", {
          url: "https://token.actions.githubusercontent.com",
          clientIds: ["sts.amazonaws.com"],
          thumbprints: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
        })
      : iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
          this,
          "GithubOidc",
          `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
        );

    const githubPrincipal = new iam.OpenIdConnectPrincipal(oidcProvider, {
      StringEquals: {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      },
      StringLike: {
        "token.actions.githubusercontent.com:sub": repoSub,
      },
    });

    this.apiDeployRole = new iam.Role(this, "ApiDeployRole", {
      roleName: `zoa-gha-api-deploy-${stage}`,
      assumedBy: githubPrincipal,
      description: "GitHub Actions role for Serverless API deploys",
      maxSessionDuration: cdk.Duration.hours(1),
    });

    this.apiDeployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ServerlessDeployCore",
        actions: [
          "cloudformation:*",
          "lambda:*",
          "apigateway:*",
          "logs:*",
          "s3:*",
          "iam:GetRole",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PassRole",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:ListRolePolicies",
          "iam:GetRolePolicy",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfilesForRole",
          "events:*",
          "ssm:GetParameter",
          "ssm:PutParameter",
          "ssm:GetParameters",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
        ],
        resources: ["*"],
      }),
    );

    this.infraDeployRole = new iam.Role(this, "InfraDeployRole", {
      roleName: `zoa-gha-infra-deploy-${stage}`,
      assumedBy: githubPrincipal,
      description: "GitHub Actions role for CDK infra deploys",
      maxSessionDuration: cdk.Duration.hours(1),
    });

    this.infraDeployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CdkDeploy",
        actions: [
          "cloudformation:*",
          "s3:*",
          "dynamodb:*",
          "cognito-idp:*",
          "iam:*",
          "logs:*",
          "ssm:*",
          "ecr:*",
          "sts:AssumeRole",
          "sts:GetCallerIdentity",
        ],
        resources: ["*"],
      }),
    );

    new cdk.CfnOutput(this, "ApiDeployRoleArn", {
      value: this.apiDeployRole.roleArn,
      exportName: `zoa-${stage}-gha-api-role-arn`,
      description: "Set as GitHub variable AWS_DEPLOY_ROLE_ARN",
    });

    new cdk.CfnOutput(this, "InfraDeployRoleArn", {
      value: this.infraDeployRole.roleArn,
      exportName: `zoa-${stage}-gha-infra-role-arn`,
      description: "Set as GitHub variable AWS_INFRA_ROLE_ARN",
    });

    if (createOidcProvider && "openIdConnectProviderArn" in oidcProvider) {
      new cdk.CfnOutput(this, "OidcProviderArn", {
        value: oidcProvider.openIdConnectProviderArn,
        exportName: `zoa-${stage}-gha-oidc-provider-arn`,
      });
    }
  }
}
