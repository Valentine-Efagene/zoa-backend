#!/usr/bin/env npx tsx
/**
 * Create prod Cognito admin users (admin group).
 *
 *   PROD_USER_POOL_ID=us-east-1_wOS1H6CvG \
 *   npx tsx scripts/provision-prod-admins.ts
 *
 * Passwords: set ADMIN_TEMP_PASSWORD env or generated and printed once.
 */
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { randomBytes } from "node:crypto";

const ADMINS = [
  {
    email: "efagenevalentine@gmail.com",
    givenName: "Valentine",
    familyName: "Efagene",
  },
  {
    email: "abdussalamzaynab@gmail.com",
    givenName: "Zaynab",
    familyName: "Abdussalam",
  },
];

const region = process.env.AWS_REGION ?? "us-east-1";
const prodPool = process.env.PROD_USER_POOL_ID ?? "us-east-1_wOS1H6CvG";
const sharedPassword = process.env.ADMIN_TEMP_PASSWORD;

const cognito = new CognitoIdentityProviderClient({ region });

function tempPassword(): string {
  if (sharedPassword) return sharedPassword;
  return `Zoa!${randomBytes(6).toString("base64url")}9a`;
}

async function ensureAdmin(user: (typeof ADMINS)[number]) {
  let exists = false;
  try {
    await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: prodPool,
        Username: user.email,
      }),
    );
    exists = true;
    console.log(`User exists: ${user.email}`);
  } catch (err: unknown) {
    const name =
      err && typeof err === "object" && "name" in err
        ? String((err as { name: string }).name)
        : "";
    if (name !== "UserNotFoundException") throw err;
  }

  if (!exists) {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: prodPool,
        Username: user.email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: user.email },
          { Name: "email_verified", Value: "true" },
          { Name: "given_name", Value: user.givenName },
          { Name: "family_name", Value: user.familyName },
        ],
      }),
    );
    console.log(`Created: ${user.email}`);
  }

  const password = tempPassword();
  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: prodPool,
      Username: user.email,
      Password: password,
      Permanent: true,
    }),
  );

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: prodPool,
      Username: user.email,
      GroupName: "admin",
    }),
  );

  console.log(`Admin group: ${user.email}`);
  if (!sharedPassword) {
    console.log(`  Password (save securely): ${password}`);
  }
}

async function main() {
  for (const admin of ADMINS) {
    await ensureAdmin(admin);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
