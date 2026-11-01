import path from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";

const FIXTURES = path.join(__dirname, "../fixtures/files");

export const UAT_FILES = {
  id: path.join(FIXTURES, "id.pdf"),
  signature: path.join(FIXTURES, "signature.png"),
  passport: path.join(FIXTURES, "passport.jpg"),
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fileInputForDocument(scope: Page | Locator, documentLabel: string) {
  const labelPattern = new RegExp(`^${escapeRegex(documentLabel)}`);
  return scope
    .locator("p")
    .filter({ hasText: labelPattern })
    .first()
    .locator("xpath=ancestor::div[.//input[@type='file']][1]")
    .locator('input[type="file"]')
    .first();
}

export async function uploadRequiredDocument(
  page: Page,
  scope: Page | Locator,
  documentLabel: string,
  filePath: string,
) {
  const fileName = path.basename(filePath);
  const fileInput = fileInputForDocument(scope, documentLabel);
  await fileInput.scrollIntoViewIfNeeded();

  const putDone = page.waitForResponse(
    (res) =>
      res.request().method() === "PUT" &&
      (res.url().includes("zoa-documents-uat") ||
        res.url().includes("localhost:4566")),
    { timeout: 60_000 },
  );

  await fileInput.setInputFiles(filePath);
  const putResponse = await putDone;
  expect(putResponse.ok(), `S3 PUT failed: ${putResponse.status()}`).toBeTruthy();

  await expect(
    scope.getByText(fileName, { exact: false }).first(),
  ).toBeVisible({ timeout: 15_000 });
}

export async function uploadPersonDocuments(page: Page, article: Locator) {
  await uploadRequiredDocument(
    page,
    article,
    "Means of identification",
    UAT_FILES.id,
  );
  await uploadRequiredDocument(
    page,
    article,
    "Specimen signature",
    UAT_FILES.signature,
  );
}
