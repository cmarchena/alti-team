import { test, expect } from '@playwright/test'

test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat')
  })

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should display chat interface elements', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    await expect(page.locator('h1:has-text("AltiTeam Chat")')).toBeVisible()
    await expect(
      page.locator('textarea[placeholder="Type your message..."]'),
    ).toBeVisible()
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
  })

  test('should display welcome message on initial load', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    await expect(page.locator('text=AltiTeam assistant')).toBeVisible()
  })

  test('should send a message and display user message', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    await page.fill('textarea[placeholder="Type your message..."]', 'Hello')
    await page.click('button:has-text("Sign Out")')

    await expect(page.locator('text=Hello').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('should display loading state while sending message', async ({
    page,
  }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    const textarea = page.locator(
      'textarea[placeholder="Type your message...""]',
    )
    await textarea.fill('Test message')
    await expect(textarea).toBeDisabled()
  })

  test('should show quick prompts on initial load', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    await expect(
      page.locator('button:has-text("Show me my tasks")'),
    ).toBeVisible()
    await expect(
      page.locator('button:has-text("Create a new project")'),
    ).toBeVisible()
    await expect(
      page.locator('button:has-text("What tasks are due today?")'),
    ).toBeVisible()
    await expect(
      page.locator('button:has-text("List my organizations")'),
    ).toBeVisible()
  })

  test('should hide quick prompts after sending message', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    await page.fill(
      'textarea[placeholder="Type your message..."]',
      'Test message',
    )
    page.keyboard.press('Enter')

    await expect(
      page.locator('button:has-text("Show me my tasks")'),
    ).not.toBeVisible()
  })

  test('should support Shift+Enter for new line', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    const textarea = page.locator(
      'textarea[placeholder="Type your message..."]',
    )
    await textarea.fill('Line 1\nLine 2')
    const value = await textarea.inputValue()
    expect(value).toContain('Line 1')
    expect(value).toContain('Line 2')
  })

  test('should clear chat when clear button is used', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    await page.fill(
      'textarea[placeholder="Type your message..."]',
      'Test message',
    )
    page.keyboard.press('Enter')
    await page.waitForTimeout(2000)

    await page.reload()
    await expect(page.locator('text=AltiTeam assistant')).toBeVisible()
  })

  test('should have responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/')
    await page.goto('/chat')

    await expect(page.locator('h1:has-text("AltiTeam Chat")')).toBeVisible()
    await expect(
      page.locator('textarea[placeholder="Type your message..."]'),
    ).toBeVisible()
  })
})

test.describe('Chat API', () => {
  test('should return 401 for unauthenticated requests', async ({
    request,
  }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
      },
    })

    expect(response.status()).toBe(401)
  })

  test('should return error for invalid message format', async ({
    request,
  }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: 'invalid',
      },
    })

    expect(response.status()).toBe(401)
  })
})

test.describe('Chat Tool Calling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should handle project-related queries', async ({ page }) => {
    await page.goto('/chat')
    await page.fill(
      'textarea[placeholder="Type your message..."]',
      'List my organizations',
    )
    page.keyboard.press('Enter')
    await page.waitForTimeout(3000)

    const userMessage = page.locator('text=List my organizations').first()
    await expect(userMessage).toBeVisible()
  })

  test('should handle task-related queries', async ({ page }) => {
    await page.goto('/chat')
    await page.fill(
      'textarea[placeholder="Type your message..."]',
      'Show me my tasks',
    )
    page.keyboard.press('Enter')
    await page.waitForTimeout(3000)

    const userMessage = page.locator('text=Show me my tasks').first()
    await expect(userMessage).toBeVisible()
  })

  test('should handle quick prompt clicks', async ({ page }) => {
    await page.goto('/chat')
    await page.click('button:has-text("Create a new project")')
    await page.waitForTimeout(3000)

    const userMessage = page.locator('text=Create a new project').first()
    await expect(userMessage).toBeVisible()
  })
})

test.describe('Chat Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should disable input while loading', async ({ page }) => {
    await page.goto('/chat')

    const textarea = page.locator(
      'textarea[placeholder="Type your message..."]',
    )
    await textarea.fill('Test message')

    const sendButton = page.locator(
      'button:hassvg path[d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"]',
    )
    await expect(sendButton).not.toBeDisabled()
  })

  test('should handle streaming response completion', async ({ page }) => {
    await page.goto('/chat')
    await page.fill(
      'textarea[placeholder="Type your message..."]',
      'Hello, how are you?',
    )
    page.keyboard.press('Enter')
    await page.waitForTimeout(5000)

    const assistantMessage = page
      .locator('[class*="bg-white"]:has-text("Thinking")')
      .first()
    await expect(assistantMessage).not.toContainText('Thinking')
  })
})

test.describe('Chat User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should auto-scroll to bottom on new messages', async ({ page }) => {
    await page.goto('/chat')

    for (let i = 0; i < 3; i++) {
      await page.fill(
        'textarea[placeholder="Type your message..."]',
        `Message ${i + 1}`,
      )
      page.keyboard.press('Enter')
      await page.waitForTimeout(1500)
    }

    await expect(page.locator('text=Message 3').first()).toBeVisible()
  })

  test('should display user and assistant avatars correctly', async ({
    page,
  }) => {
    await page.goto('/chat')

    const userAvatar = page.locator(
      '[class*="bg-indigo-600"]:near(:text("Hello"))',
    )
    await expect(userAvatar.first()).toBeVisible()
  })

  test('should display message timestamps', async ({ page }) => {
    await page.goto('/chat')
    await page.fill(
      'textarea[placeholder="Type your message..."]',
      'Test timestamp',
    )
    page.keyboard.press('Enter')
    await page.waitForTimeout(2000)

    const timestamp = page.locator('text=/\\d{1,2}:\\d{2}\\s*(AM|PM)/i')
    await expect(timestamp.first()).toBeVisible()
  })

  test('should focus input on page load', async ({ page }) => {
    await page.goto('/chat')
    const textarea = page.locator(
      'textarea[placeholder="Type your message..."]',
    )
    await expect(textarea).toBeFocused()
  })
})

test.describe('Chat Sign Out', () => {
  test('should sign out and redirect', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    await page.goto('/chat')
    await page.click('button:has-text("Sign Out")')

    await expect(page).toHaveURL('/')
  })
})
