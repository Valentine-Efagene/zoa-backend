import { expect, test } from "@playwright/test";
import { signInViaUi } from "../helpers/auth";
import { waitForResetCode } from "../helpers/mailpit";

const EMAIL = "forgot-pw@uat-zoa.test";
const OLD_PASSWORD = "OldPass1word";
const NEW_PASSWORD = "NewPass2word";

test.describe("UAT: Forgot password", () => {
  test("reset via email code and sign in with new password", async ({
    page,
  }) => {
    await page.request.post("/api/auth/mock/register", {
      data: { email: EMAIL, password: OLD_PASSWORD },
    });

    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(
      page.getByRole("heading", { name: "Forgot password" }),
    ).toBeVisible();

    await page.getByLabel("Email").fill(EMAIL);
    await page.getByRole("button", { name: "Send reset code" }).click();
    await expect(
      page.getByRole("heading", { name: "Reset password" }),
    ).toBeVisible({ timeout: 15_000 });

    const code = await waitForResetCode(EMAIL);
    await page.getByLabel("Verification code").fill(code);
    await page.getByLabel("New password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Update password and sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText("Welcome back")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(OLD_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password")).toBeVisible({
      timeout: 10_000,
    });

    await signInViaUi(page, EMAIL, NEW_PASSWORD);
  });
});
