import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export interface ZoaAuthStackProps extends cdk.StackProps {
  stage: string;
  callbackUrls: string[];
  logoutUrls: string[];
}

export class ZoaAuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: ZoaAuthStackProps) {
    super(scope, id, props);

    const { stage, callbackUrls, logoutUrls } = props;

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `zoa-users-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
        phoneNumber: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        stage === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const domain = this.userPool.addDomain("AuthDomain", {
      cognitoDomain: {
        domainPrefix: `zoa-${stage}-${this.account}`.slice(0, 63).toLowerCase(),
      },
    });

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: `zoa-web-${stage}`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls,
        logoutUrls,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      exportName: `zoa-${stage}-user-pool-id`,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      exportName: `zoa-${stage}-user-pool-client-id`,
    });

    new cdk.CfnOutput(this, "UserPoolArn", {
      value: this.userPool.userPoolArn,
      exportName: `zoa-${stage}-user-pool-arn`,
    });

    new cdk.CfnOutput(this, "CognitoDomain", {
      value: domain.baseUrl(),
      exportName: `zoa-${stage}-cognito-domain`,
    });

    new cdk.CfnOutput(this, "CognitoIssuer", {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
      exportName: `zoa-${stage}-cognito-issuer`,
    });
  }
}
