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

const WORKFLOW_NAME = "SCUML Registration";

test.describe("UAT: SCUML Registration", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUi(page);
  });

  test("full submit with visible form sections", async ({ page }) => {
    await startRegistrationApplication(page, WORKFLOW_NAME);

    await selectByLabel(page, "Category", "Company");
    await selectByLabel(page, "CAC registration type", "RC");
    await fillByLabel(page, "Business sector", "Professional services");
    await fillByLabel(
      page,
      "Main business objectives",
      "Consulting and advisory services",
    );
    await fillByLabel(page, "Incorporation number", "RC123456");
    await fillByLabel(page, "Date incorporated", "2020-01-15");
    await fillByLabel(page, "Tax ID number", "TIN-998877");
    await fillByLabel(
      page,
      "Head office address",
      "100 SCUML Plaza, Victoria Island, Lagos",
    );
    await fillByLabel(page, "Bank name (director account)", "UAT Bank");
    await fillByLabel(page, "Account number", "0123456789");
    await fillByLabel(page, "Account name", "UAT Company Ltd");
    await fillByLabel(page, "Organisation phone number", "+2348055555555");
    await fillByLabel(page, "Organisation email", "scuml@uat-zoa.test");

    await expectSectionHeading(page, "Beneficial ownership");
    const owner = groupArticle(page, "Beneficial owner", 1);
    await fillByLabel(owner, "Full name", "Kemi Adebayo");
    await fillByLabel(owner, "Date of birth", "1984-04-04");
    await fillByLabel(owner, "National Identity Number (NIN)", "99887766554");
    await fillByLabel(owner, "Mobile", "+2348066666666");
    await fillByLabel(owner, "Address", "Lagos, Nigeria");

    await expectSectionHeading(page, "Directors / trustees");
    const official = groupArticle(page, "Official", 1);
    await fillByLabel(official, "Full name", "Kemi Adebayo");
    await fillByLabel(official, "Date of birth", "1984-04-04");
    await fillByLabel(official, "National Identity Number (NIN)", "99887766554");
    await fillByLabel(official, "Mobile", "+2348066666666");
    await fillByLabel(official, "Address", "Lagos, Nigeria");
    await selectByLabel(official, "Gender", "Female");
    await fillByLabel(official, "Email", "official@uat-zoa.test");
    await fillByLabel(official, "Bank Verification Number (BVN)", "22334455667");

    await expectSectionHeading(page, "Organisation contact person");
    const contact = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: "Organisation contact person" }),
      });
    await fillByLabel(contact, "Name", "Kemi Adebayo");
    await fillByLabel(contact, "Address", "Lagos, Nigeria");
    await fillByLabel(contact, "NIN", "99887766554");
    await fillByLabel(contact, "Email", "contact@uat-zoa.test");
    await fillByLabel(contact, "Phone number", "+2348077777777");

    await expectSectionHeading(page, "Supporting documents");
    await uploadRequiredDocument(
      page,
      page,
      "Certificate of incorporation",
      UAT_FILES.id,
    );
    await uploadRequiredDocument(page, page, "Status report", UAT_FILES.id);
    await uploadRequiredDocument(
      page,
      page,
      "Memorandum of Association / Constitution",
      UAT_FILES.id,
    );
    await uploadRequiredDocument(
      page,
      page,
      "Tax clearance certificate",
      UAT_FILES.id,
    );

    await submitApplication(page);
  });
});
