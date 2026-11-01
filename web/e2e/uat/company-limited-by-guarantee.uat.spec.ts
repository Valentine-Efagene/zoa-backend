import { test } from "@playwright/test";
import { signInViaUi } from "../helpers/auth";
import {
  expectSectionHeading,
  fillByLabel,
  fillPersonWithIdDocuments,
  groupArticle,
} from "../helpers/fill-form";
import { startRegistrationApplication } from "../helpers/start-application";
import { submitApplication } from "../helpers/submit";
import { uploadPersonDocuments } from "../helpers/upload";

const WORKFLOW_NAME = "Company Limited by Guarantee";

test.describe("UAT: Company Limited by Guarantee", () => {
  test.beforeEach(async ({ page }) => {
    await signInViaUi(page);
  });

  test("full submit with visible form sections", async ({ page }) => {
    await startRegistrationApplication(page, WORKFLOW_NAME);

    await fillByLabel(
      page,
      "Proposed name — option 1",
      "UAT Foundation Limited by Guarantee",
    );
    await fillByLabel(
      page,
      "Proposed name — option 2",
      "UAT Charity LTD/GTE",
    );
    await fillByLabel(
      page,
      "Proposed name — option 3",
      "UAT Impact Limited by Guarantee",
    );
    await fillByLabel(
      page,
      "Registered address of company (include LGA)",
      "22 Awolowo Road, Ikoyi, Lagos",
    );
    await fillByLabel(
      page,
      "Description of principal activity",
      "Community development programmes",
    );
    await fillByLabel(
      page,
      "Email address of proposed company",
      "gte@uat-zoa.test",
    );
    await fillByLabel(
      page,
      "Objects / business of the company",
      "i. Charitable objects",
    );
    await fillByLabel(page, "Total proposed guarantee sum (NGN)", "100000");

    await expectSectionHeading(page, "Subscribers");
    const subscriber = groupArticle(page, "Subscriber", 1);
    await fillPersonWithIdDocuments(subscriber, page, {
      surname: "Adeyemi",
      firstName: "Tunde",
      email: "subscriber@uat-zoa.test",
      phone: "+2348011111111",
    });
    await fillByLabel(subscriber, "Amount guaranteed (NGN)", "100000");
    await uploadPersonDocuments(page, subscriber);

    await expectSectionHeading(page, "Directors");
    const director = groupArticle(page, "Director", 1);
    await fillPersonWithIdDocuments(director, page, {
      surname: "Musa",
      firstName: "Fatima",
      email: "gte-director@uat-zoa.test",
      phone: "+2348022222222",
    });
    await uploadPersonDocuments(page, director);

    await submitApplication(page);
  });
});
