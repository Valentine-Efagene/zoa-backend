import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ses from "aws-cdk-lib/aws-ses";
import { Construct } from "constructs";

export interface ZoaEmailStackProps extends cdk.StackProps {
  /** Apex domain in Route53 (e.g. zaynababdussalam.com). */
  apexDomain: string;
  /** Subdomain used for SES identity (e.g. mail → mail.zaynababdussalam.com). */
  mailSubdomain?: string;
  /** DMARC aggregate reports (optional). */
  dmarcReportEmail?: string;
}

/**
 * SES domain identity + Route53 DKIM/verification records, SPF on mail subdomain, DMARC on apex.
 * Deploy in us-east-1 (same region as API Lambda SES sends).
 */
export class ZoaEmailStack extends cdk.Stack {
  public readonly sendingDomain: string;
  public readonly fromAddress: string;

  constructor(scope: Construct, id: string, props: ZoaEmailStackProps) {
    super(scope, id, props);

    const mailSub = props.mailSubdomain ?? "mail";
    this.sendingDomain = `${mailSub}.${props.apexDomain}`;
    this.fromAddress = `filings@${this.sendingDomain}`;

    const zone = route53.HostedZone.fromLookup(this, "ApexZone", {
      domainName: props.apexDomain,
    });

    const identity = new ses.EmailIdentity(this, "MailIdentity", {
      identity: ses.Identity.domain(this.sendingDomain),
      dkimSigning: true,
    });

    identity.dkimRecords.forEach((record, index) => {
      new route53.CnameRecord(this, `DkimRecord${index}`, {
        zone,
        recordName: record.name,
        domainName: record.value,
      });
    });

    new route53.TxtRecord(this, "MailSpf", {
      zone,
      recordName: mailSub,
      ttl: cdk.Duration.minutes(5),
      values: ["v=spf1 include:amazonses.com ~all"],
    });

    const dmarcEmail =
      props.dmarcReportEmail ?? `abdussalamzaynab@gmail.com`;
    new route53.TxtRecord(this, "Dmarc", {
      zone,
      recordName: "_dmarc",
      ttl: cdk.Duration.minutes(5),
      values: [`v=DMARC1; p=none; rua=mailto:${dmarcEmail}`],
    });

    new cdk.CfnOutput(this, "SendingDomain", {
      value: this.sendingDomain,
      description: "SES verified sending domain",
    });

    new cdk.CfnOutput(this, "SuggestedFromAddress", {
      value: `Z.O.A Filings <${this.fromAddress}>`,
      description: "Set EMAIL_FROM in API env",
    });
  }
}
