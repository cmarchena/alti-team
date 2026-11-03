import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
  })

  test.describe('Sign In Page', () => {
    test('should display sign in form with email and password fields', async ({ page }) => {
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should navigate to signup page when clicking sign up link', async ({ page }) => {
      await page.click('text=Sign up')
      await expect(page).toHaveURL(/\/signup/)
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input[name="email"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Sign Up Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup')
    })

    test('should display signup form with name, email and password fields', async ({ page }) => {
      await expect(page.locator('input[name="firstName"]')).toBeVisible()
      await expect(page.locator('input[name="lastName"]')).toBeVisible()
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should navigate to signin page when clicking sign in link', async ({ page }) => {
      await page.click('text=Sign in')
      await expect(page).toHaveURL(/\/signin/)
    })

    test('should show error for existing email', async ({ page }) => {
      await page.fill('input[name="firstName"]', 'Test')
      await page.fill('input[name="lastName"]', 'User')
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=already exists')).toBeVisible({ timeout: 5000 })
    })

    test('should show validation error for empty fields', async ({ page }) => {
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Email is required')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Registration Flow', () => {
    test('should register a new user successfully', async ({ page }) => {
      const uniqueEmail = `newuser${Date.now()}@test.com`

      await page.goto('/signup')
      await page.fill('input[name="firstName"]', 'New')
      await page.fill('input[name="lastName"]', 'User')
      await page.fill('input[name="email"]', uniqueEmail)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      await expect(page).not.toHaveURL(/\/signup/, { timeout: 10000 })
    })
  })

  test.describe('Login Flow', () => {
    test('should login successfully with correct credentials', async ({ page }) => {
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'admin123')
      await page.click('button[type="submit"]')

      await expect(page).not.toHaveURL(/\/signin/, { timeout: 10000 })
      await expect(page).toHaveTitle(/Alti/)
    })

    test('should show error for wrong password', async ({ page }) => {
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for non-existent user', async ({ page }) => {
      await page.fill('input[name="email"]', 'notarealuser@test.com')
      await page.fill('input[name="password"]', 'anypassword')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Session Management', () => {
    test('should remain logged in after page refresh', async ({ page }) => {
      await page.fill('input[name="email"]', 'admin@example.com')
      await page.fill('input[name="password"]', 'admin123')
      await page.click('button[type="submit"]')

      await page.reload()

      await expect(page).not.toHaveURL(/\/signin/, { timeout: 5000 })
    })
  })
})

test.describe('Home Page Auth State', () => {
  test('should redirect to signin when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/signin/)
  })
})
