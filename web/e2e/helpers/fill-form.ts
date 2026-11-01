import { expect, type Locator, type Page } from "@playwright/test";

export async function fillByLabel(
  scope: Page | Locator,
  label: string,
  value: string,
) {
  const field = scope.getByLabel(label, { exact: false });
  await field.scrollIntoViewIfNeeded();
  const tag = await field.evaluate((el) => el.tagName.toLowerCase());
  if (tag === "button" || (await field.getAttribute("role")) === "combobox") {
    await selectByLabel(scope, label, value);
    return;
  }
  await field.fill(value);
}

function resolvePage(scope: Page | Locator): Page {
  return "goto" in scope ? scope : scope.page();
}

export async function selectByLabel(
  scope: Page | Locator,
  label: string,
  option: string,
) {
  const page = resolvePage(scope);
  const trigger = scope.getByLabel(label, { exact: false });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const listbox = page.getByRole("listbox").last();
  await expect(listbox).toBeVisible({ timeout: 10_000 });
  await listbox.getByRole("option", { name: option, exact: true }).click();
}

export async function fillPersonWithIdDocuments(
  scope: Locator,
  page: Page,
  person: {
    surname: string;
    firstName: string;
    email: string;
    phone: string;
  },
) {
  await fillByLabel(scope, "Surname", person.surname);
  await fillByLabel(scope, "First name", person.firstName);
  await fillByLabel(scope, "Date of birth", "1990-06-15");
  await selectByLabel(scope, "Gender", "Male");
  await fillByLabel(scope, "Nationality", "Nigerian");
  await fillByLabel(scope, "Phone number", person.phone);
  await fillByLabel(scope, "Email", person.email);
  await fillByLabel(scope, "Occupation", "Consultant");
  await fillByLabel(
    scope,
    "Residential address",
    "12 Marina Road, Lagos Island, Lagos",
  );
  await selectByLabel(
    scope,
    "Means of identification",
    "National Identification Number (NIN)",
  );
  await fillByLabel(scope, "Identification number", "12345678901");
}

export function groupArticle(page: Page, itemLabel: string, index = 1) {
  const heading = new RegExp(`^${itemLabel} ${index}\\b`);
  return page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: heading }) });
}

export async function expectSectionHeading(page: Page, name: string) {
  await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
}
