import { expect, type Page } from "@playwright/test";

export async function signInViaUi(
  page: Page,
  email = "uat@zoa.test",
  password = "password",
) {
  const register = await page.request.post("/api/auth/mock/register", {
    data: { email, password },
  });
  if (register.status() === 404) {
    // Mock auth email disabled — legacy mock accepts any password
  } else if (!register.ok()) {
    throw new Error(`Failed to seed mock user: ${register.status()}`);
  }

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByText("Welcome back")).toBeVisible();
}
