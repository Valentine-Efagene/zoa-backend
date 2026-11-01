import { test } from "@playwright/test";
import { signInViaUi } from "../helpers/auth";
import {
  expectSectionHeading,
  fillByLabel,
  groupArticle,
  selectByLabel,
} from "../helpers/fill-form";
import { startRegistrationApplication } from "../helpers/start-application";
import { submitApplication } from "../helpers/submit";
import { uploadRequiredDocument, UAT_FILES } from "../helpers/upload";

const WORKFLOW_NAME = "Incorporated Trustees";

test.describe("UAT: Incorporated Trustees", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUi(page);
  });

  test("full submit with visible form sections", async ({ page }) => {
    await startRegistrationApplication(page, WORKFLOW_NAME);

    await fillByLabel(page, "Proposed name — option 1", "UAT Good Works Association");
    await fillByLabel(page, "Proposed name — option 2", "UAT Hope Foundation");
    await fillByLabel(page, "Proposed name — option 3", "UAT Charity Group");
    await fillByLabel(
      page,
      "Description of the association",
      "A non-profit community association",
    );
    await fillByLabel(page, "Email of organisation", "it@uat-zoa.test");
    await fillByLabel(
      page,
      "Registered office address",
      "3 Charity Lane, Abuja, FCT",
    );
    await fillByLabel(page, "Minimum number of trustees", "2");
    await fillByLabel(page, "Maximum number of trustees", "7");
    await fillByLabel(page, "Trustee tenure", "3 years");
    await fillByLabel(page, "Custodian of common seal", "Secretary");
    await fillByLabel(page, "Governing body", "Board of trustees");
    await fillByLabel(page, "Application of funds", "Programme delivery");
    await fillByLabel(page, "Keeping of accounts", "Annual audited accounts");
    await fillByLabel(
      page,
      "Aims and objectives of the association",
      "i. Community service",
    );

    await expectSectionHeading(page, "Trustees");
    const trustee = groupArticle(page, "Trustee", 1);
    await fillByLabel(trustee, "Surname", "Yusuf");
    await fillByLabel(trustee, "First name", "Amina");
    await fillByLabel(trustee, "Date of birth", "1988-07-10");
    await selectByLabel(trustee, "Gender", "Female");
    await fillByLabel(trustee, "Nationality", "Nigerian");
    await fillByLabel(trustee, "Phone number", "+2348044444444");
    await fillByLabel(trustee, "Email", "trustee@uat-zoa.test");
    await fillByLabel(trustee, "Occupation", "Teacher");
    await fillByLabel(trustee, "Residential address", "12 Garki, Abuja");
    await selectByLabel(
      trustee,
      "Means of identification",
      "National Identification Number (NIN)",
    );
    await uploadRequiredDocument(
      page,
      trustee,
      "Means of identification",
      UAT_FILES.id,
    );

    await selectByLabel(
      page,
      "Which trustee acts as Chairman?",
      "Trustee 1 — Amina Yusuf",
    );

    await submitApplication(page);
  });
});
