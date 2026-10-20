import { test, expect } from '@playwright/test'

// See here how to get started:
// https://playwright.dev/docs/intro
test('shows the GameHub dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu próxima partida empieza acá')
  await expect(page.getByRole('heading', { name: 'Juegos para vos' })).toBeVisible()
})
