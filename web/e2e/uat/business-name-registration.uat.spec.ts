import { test } from "@playwright/test";
import { signInViaUi } from "../helpers/auth";
import { expectSectionHeading, fillByLabel, selectByLabel } from "../helpers/fill-form";
import { startRegistrationApplication } from "../helpers/start-application";
import { submitApplication } from "../helpers/submit";
import { uploadRequiredDocument, UAT_FILES } from "../helpers/upload";

const WORKFLOW_NAME = "Business Name Registration";

test.describe("UAT: Business Name Registration", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUi(page);
  });

  test("full submit with visible form sections", async ({ page }) => {
    await startRegistrationApplication(page, WORKFLOW_NAME);

    await fillByLabel(page, "Surname", "Okafor");
    await fillByLabel(page, "First name", "Emeka");
    await fillByLabel(page, "Date of birth", "1992-11-02");
    await selectByLabel(page, "Gender", "Male");
    await fillByLabel(page, "Phone number", "+2348033333333");
    await fillByLabel(page, "Personal email address", "proprietor@uat-zoa.test");

    await fillByLabel(page, "Home address — state", "Lagos");
    await fillByLabel(page, "Home address — LGA", "Surulere");
    await fillByLabel(page, "Home address — city / town / village", "Surulere");
    await fillByLabel(page, "Home address — house number", "14");
    await fillByLabel(page, "Home address — street name", "Bode Thomas");

    await fillByLabel(page, "Company address — state", "Lagos");
    await fillByLabel(page, "Company address — LGA", "Ikeja");
    await fillByLabel(page, "Company address — city / town / village", "Ikeja");
    await fillByLabel(page, "Company address — house number", "8");
    await fillByLabel(page, "Company address — street name", "Obafemi Awolowo Way");
    await fillByLabel(page, "Company email", "business@uat-zoa.test");
    await fillByLabel(page, "Nature of business", "Retail fashion");
    await fillByLabel(page, "Proposed business name — option 1", "UAT Styles");
    await fillByLabel(page, "Proposed business name — option 2", "UAT Fashion BN");

    await expectSectionHeading(page, "Supporting documents");
    await uploadRequiredDocument(page, page, "ID card", UAT_FILES.id);
    await uploadRequiredDocument(page, page, "Signature", UAT_FILES.signature);
    await uploadRequiredDocument(
      page,
      page,
      "Passport photograph",
      UAT_FILES.passport,
    );

    await submitApplication(page);
  });
});
