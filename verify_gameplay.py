import asyncio
from playwright.async_api import async_playwright
import time
import os

async def verify_gameplay():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        # 1. Login
        print("Logging in...")
        await page.goto("http://localhost:5173/login")
        await page.fill('input[type="text"]', "admin")
        await page.fill('input[type="password"]', "admin123")
        await page.click('button:has-text("Sign In")')

        await page.wait_for_url("http://localhost:5173/game")
        print("Logged in successfully.")

        # 2. Check Sidebar
        await page.wait_for_selector("aside button")
        sidebar_links = await page.locator("aside button").all_text_contents()
        sidebar_links = [link.strip() for link in sidebar_links]
        print(f"Sidebar links: {sidebar_links}")
        assert "Aviator" in sidebar_links
        # It's actually one <a> tag but might have multiple elements inside.
        # But wait, it should be just the label "Aviator" in all_text_contents()

        # 3. Place Bet
        print("Placing bet...")
        # Wait for "BET" button in the first panel
        # First panel is the left one.
        bet_buttons = page.locator('button:has-text("BET")')
        await bet_buttons.nth(0).click()
        print("Bet placed in Slot 1.")

        # 4. Wait for MANUAL CASHOUT button
        print("Waiting for MANUAL CASHOUT button to appear and become active...")
        # It should appear immediately after bet, but be disabled until round starts.
        cashout_button = page.locator('button:has-text("MANUAL CASHOUT")').nth(0)

        # Wait up to 30 seconds for the round to start and button to be enabled
        start_time = time.time()
        found = False
        while time.time() - start_time < 30:
            if await cashout_button.is_visible():
                is_disabled = await cashout_button.get_attribute("disabled")
                if is_disabled is None: # Playwright returns None if attribute is missing (i.e. enabled)
                    print("MANUAL CASHOUT button is now ENABLED.")
                    found = True
                    break
            await asyncio.sleep(1)

        if not found:
            await page.screenshot(path="/home/jules/verification/screenshots/failed_cashout.png")
            print("Failed to find enabled MANUAL CASHOUT button within 30s")
            await browser.close()
            return

        # 5. Take screenshot of active cashout
        await page.screenshot(path="/home/jules/verification/screenshots/active_cashout.png")

        # 6. Click Cashout
        multiplier_text = await cashout_button.inner_text()
        print(f"Clicking cashout at: {multiplier_text}")
        await cashout_button.click()

        # 7. Check for success notification or balance update
        await asyncio.sleep(2)
        await page.screenshot(path="/home/jules/verification/screenshots/after_cashout.py.png")

        # 8. Check Admin Panel
        print("Checking Admin Panel...")
        await page.goto("http://localhost:5173/admin")
        await page.wait_for_selector("text=Admin Dashboard")
        await page.screenshot(path="/home/jules/verification/screenshots/admin_panel.png")

        users_table = await page.locator("table").is_visible()
        print(f"Users table visible: {users_table}")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("/home/jules/verification/screenshots"):
        os.makedirs("/home/jules/verification/screenshots")
    asyncio.run(verify_gameplay())
