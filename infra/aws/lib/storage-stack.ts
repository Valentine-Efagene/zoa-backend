import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface ZoaStorageStackProps extends cdk.StackProps {
  stage: string;
}

export class ZoaStorageStack extends cdk.Stack {
  public readonly documentsBucket: s3.Bucket;
  public readonly applicationsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ZoaStorageStackProps) {
    super(scope, id, props);

    const { stage } = props;

    this.documentsBucket = new s3.Bucket(this, "DocumentsBucket", {
      bucketName: `zoa-documents-${stage}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: "AbortIncompleteMultipart",
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy:
        stage === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== "prod",
    });

    this.applicationsTable = new dynamodb.Table(this, "ApplicationsTable", {
      tableName: `zoa-applications-${stage}`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: stage === "prod",
      },
      removalPolicy:
        stage === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    this.applicationsTable.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new cdk.CfnOutput(this, "DocumentsBucketName", {
      value: this.documentsBucket.bucketName,
      exportName: `zoa-${stage}-documents-bucket`,
    });

    new cdk.CfnOutput(this, "DocumentsBucketArn", {
      value: this.documentsBucket.bucketArn,
      exportName: `zoa-${stage}-documents-bucket-arn`,
    });

    new cdk.CfnOutput(this, "ApplicationsTableName", {
      value: this.applicationsTable.tableName,
      exportName: `zoa-${stage}-applications-table`,
    });

    new cdk.CfnOutput(this, "ApplicationsTableArn", {
      value: this.applicationsTable.tableArn,
      exportName: `zoa-${stage}-applications-table-arn`,
    });
  }
}
