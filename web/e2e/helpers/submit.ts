import { expect, type Page } from "@playwright/test";

export async function submitApplication(page: Page) {
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Application submitted")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page).toHaveURL(/\/dashboard/);
}
