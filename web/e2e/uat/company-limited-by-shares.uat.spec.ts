import { test } from "@playwright/test";
import { signInViaUi } from "../helpers/auth";
import {
  expectSectionHeading,
  fillByLabel,
  fillPersonWithIdDocuments,
  groupArticle,
  selectByLabel,
} from "../helpers/fill-form";
import { startRegistrationApplication } from "../helpers/start-application";
import { submitApplication } from "../helpers/submit";
import { uploadPersonDocuments } from "../helpers/upload";

const WORKFLOW_NAME = "Company Limited by Shares";

test.describe("UAT: Company Limited by Shares", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUi(page);
  });

  test("full submit with visible form sections", async ({ page }) => {
    await startRegistrationApplication(page, WORKFLOW_NAME);

    await fillByLabel(page, "Proposed name — option 1", "UAT Ventures Limited");
    await fillByLabel(page, "Proposed name — option 2", "UAT Holdings Limited");
    await fillByLabel(page, "Proposed name — option 3", "UAT Global Limited");
    await fillByLabel(
      page,
      "Registered address of company (include LGA)",
      "10 Broad Street, Lagos Island, Lagos",
    );
    await fillByLabel(
      page,
      "Description of principal activity",
      "General trading and consultancy",
    );
    await fillByLabel(
      page,
      "Email address of proposed company",
      "company@uat-zoa.test",
    );
    await fillByLabel(page, "Objects / business of the company", "i. Trading");
    await fillByLabel(page, "Total proposed share capital (NGN)", "1000000");

    await expectSectionHeading(page, "Shareholders");
    const shareholder = groupArticle(page, "Shareholder", 1);
    await fillPersonWithIdDocuments(shareholder, page, {
      surname: "Okonkwo",
      firstName: "Ada",
      email: "shareholder@uat-zoa.test",
      phone: "+2348012345678",
    });
    await fillByLabel(
      shareholder,
      "Total shares / % of shares subscribed",
      "1000000 shares (100%)",
    );
    await uploadPersonDocuments(page, shareholder);

    await expectSectionHeading(page, "Directors");
    const director = groupArticle(page, "Director", 1);
    await fillPersonWithIdDocuments(director, page, {
      surname: "Bello",
      firstName: "Chidi",
      email: "director@uat-zoa.test",
      phone: "+2348098765432",
    });
    await uploadPersonDocuments(page, director);

    await expectSectionHeading(page, "Details of witness");
    const witness = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: "Details of witness" }),
      });
    await fillByLabel(witness, "Surname", "Eze");
    await fillByLabel(witness, "First name", "Ngozi");
    await fillByLabel(witness, "Date of birth", "1985-03-20");
    await selectByLabel(witness, "Gender", "Female");
    await fillByLabel(witness, "Occupation", "Lawyer");
    await fillByLabel(witness, "Phone number", "+2347011122233");
    await fillByLabel(witness, "Email address", "witness@uat-zoa.test");
    await selectByLabel(witness, "Country", "Nigeria");
    await fillByLabel(witness, "State", "Lagos");
    await fillByLabel(witness, "LGA", "Ikeja");
    await fillByLabel(witness, "City", "Ikeja");
    await fillByLabel(witness, "House number / building name", "5");
    await fillByLabel(witness, "Street name", "Allen Avenue");

    await submitApplication(page);
  });
});
