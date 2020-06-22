import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {contactHandlerFactory} from "./handlers/contact";

const cfg = new pulumi.Config();
const stack: string = pulumi.getStack();
const env = stack.split(".")[1];
const infra = new pulumi.StackReference(`infra.${env}`);
const apiDomain = infra.requireOutputValue("apiDomain");
const contactEmail = infra.requireOutputValue("contactEmail");
const originDomain = infra.requireOutputValue("originDomain");
export const domain = pulumi.output(apiDomain).apply((s) => `contact.${s}`); // contact.api.domain.com
const tags = {
  "user:Project": pulumi.getProject(),
  "user:Stack": env,
};

// DNS Zone of contact API domain
const dnsZone = new aws.route53.Zone("contact-domain-zone", {
  name: domain,
  tags,
});

// Add NS records to base API domain
new aws.route53.Record("contact-api-domain:ns-records", {
  type: "NS",
  name: domain,
  zoneId: infra.requireOutput("dnsZone").apply((zone) => zone.id),
  ttl: 600,
  records: dnsZone.nameServers.apply((ns) => ns),
});

// Provision an SSL certificate to enable SSL -- ensuring to do so in us-east-1.
const awsUsEast1 = new aws.Provider("aws-us-east-1", {region: "us-east-1"});
const sslCert = new aws.acm.Certificate(
  "contact-ssl-cert",
  {
    domainName: domain,
    validationMethod: "DNS",
    tags,
  },
  {provider: awsUsEast1},
);

// Create the necessary DNS records for ACM to validate ownership, and wait for it.
const sslCertValidationRecord = new aws.route53.Record(
  "contact-ssl-cert-validation",
  {
    zoneId: dnsZone.id,
    name: sslCert.domainValidationOptions[0].resourceRecordName,
    type: sslCert.domainValidationOptions[0].resourceRecordType,
    records: [sslCert.domainValidationOptions[0].resourceRecordValue],
    ttl: 10 * 60 /* 10 minutes */,
  },
);
// Get SSL cert validation confirmation to use in dependsOn
const sslCertValidationIssued = new aws.acm.CertificateValidation(
  "contact-ssl-cert-issued",
  {
    certificateArn: sslCert.arn,
    validationRecordFqdns: [sslCertValidationRecord.fqdn],
  },
  {provider: awsUsEast1},
);

// based on https://medium.com/@adamboazbecker/guide-to-connecting-aws-lambda-to-s3-with-pulumi-15393df8bac7
const lambdaRole = new aws.iam.Role("contact-role", {
  tags,
  assumeRolePolicy: `{
   "Version": "2012-10-17",
   "Statement": [
     {
       "Action": "sts:AssumeRole",
       "Principal": {
         "Service": "lambda.amazonaws.com"
       },
       "Effect": "Allow"
     }
   ]
 }
 `,
});

// Define custom policy for Lambda, to restrict to only the resources used + SES
// https://www.pulumi.com/docs/guides/crosswalk/aws/iam/#policy-documents
const lambdaPolicy: aws.iam.PolicyDocument = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Resource: "*",
      Action: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        // https://aws.amazon.com/de/premiumsupport/knowledge-center/lambda-send-email-ses/
        "ses:SendEmail",
        "ses:SendRawEmail",
      ],
    },
  ],
};

const lambdaSESPolicy = new aws.iam.Policy("contact-lambda-to-ses-policy", {
  description: "IAM policy for contact Lambda to interact with SES",
  path: "/",
  policy: lambdaPolicy,
});

new aws.iam.RolePolicyAttachment("contact-lambda-to-ses-policy-attachment", {
  policyArn: lambdaSESPolicy.arn,
  role: lambdaRole.name,
});

const eventHandler = new aws.lambda.CallbackFunction("contact-handler", {
  tags,
  memorySize: 128,
  role: lambdaRole,
  callback: contactHandlerFactory({
    origin:
      cfg.get("originDomain") ||
      ((originDomain.then((x) => x) as unknown) as string),
    contactEmail:
      cfg.get("contactEmail") ||
      ((contactEmail.then((x) => x) as unknown) as string),
  }),
});

// Define the API endpoints for the contact-handler
// https://aws.amazon.com/blogs/compute/architecting-multiple-microservices-behind-a-single-domain-with-amazon-api-gateway/?nc1=h_ls
const api = new awsx.apigateway.API("contact-apigateway", {
  stageName: env,
  stageArgs: {tags},
  routes: [
    {path: "/", method: "OPTIONS", eventHandler},
    {path: "/", method: "POST", eventHandler},
  ],
});

// Configure an edge-optimized domain for our API Gateway. This will configure a Cloudfront CDN
// distribution behind the scenes and serve our API Gateway at a custom domain name over SSL.
const webDomain = new aws.apigateway.DomainName("contact-cdn", {
  certificateArn: sslCertValidationIssued.certificateArn,
  domainName: domain,
  tags,
});

new aws.apigateway.BasePathMapping("contact-api-domain-mapping", {
  basePath: "/",
  restApi: api.restAPI,
  stageName: env,
  domainName: webDomain.id,
});

// Finally create an A record for our domain that directs to our custom domain.
new aws.route53.Record(
  "contact-api-dns-records",
  {
    name: webDomain.domainName,
    type: "A",
    zoneId: dnsZone.id,
    aliases: [
      {
        evaluateTargetHealth: true,
        name: webDomain.cloudfrontDomainName,
        zoneId: webDomain.cloudfrontZoneId,
      },
    ],
  },
  {dependsOn: sslCertValidationIssued},
);
