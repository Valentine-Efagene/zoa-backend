import { expect, type Page } from "@playwright/test";

export async function startRegistrationApplication(
  page: Page,
  workflowName: string,
) {
  await page.goto("/applications/new");
  await expect(
    page.getByRole("heading", { name: "New application" }),
  ).toBeVisible();
  const workflowButton = page.getByRole("button", { name: workflowName });
  await expect(workflowButton).toBeVisible({ timeout: 30_000 });
  await workflowButton.click();
  await page.getByRole("button", { name: "Continue to form" }).click();
  await expect(page.getByRole("heading", { name: workflowName })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Organisation details" }),
  ).toBeVisible();
}
