import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should navigate to signin page', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page).toHaveTitle(/Sign In/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.click('text=Sign up')
    await expect(page).toHaveURL(/\/auth\/signup/)
  })
})

test.describe('Home Page', () => {
  test('should have correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('AltiTeam')
  })
})