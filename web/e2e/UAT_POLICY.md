# Z.O.A Playwright UAT policy

These rules apply to every test under `e2e/uat/`.

## UI-first assertions

- Assert registration flows using Playwright locators: `getByRole`, `getByLabel`, `getByText`, and visible headings.
- Tests represent what an applicant **sees** on screen, not what the API schema contains.

## Forbidden

- Calling `page.request.get('/workflows/...')` (or any workflow API) to build expectations.
- Importing `api/src/lib/workflows.ts` or duplicating workflow definitions from the API package in tests.
- Asserting form content by parsing JSON responses instead of visible UI.

## Allowed

- UI interactions that trigger the app’s own network calls (save, submit, upload).
- Waiting for visible success feedback (toast copy, navigation) after submit.

## Full submit

Each registration-type UAT completes **Submit application** in the browser and verifies success in the UI.
