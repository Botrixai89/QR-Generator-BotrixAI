import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3001", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Toggle theme from light to dark by clicking the toggle theme button
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Reload the page to verify dark mode preference persistence
        await page.goto('http://localhost:3001/', timeout=10000)
        

        # Toggle theme back to light mode by clicking the toggle theme button again
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Verify all UI components switch to dark theme colors properly with no layout or content issues
        dark_mode_class = await frame.get_attribute('html', 'class')
        assert 'dark' in dark_mode_class, 'Dark mode class not applied to html element'
        # Check key UI elements for dark mode styles
        nav_bg_color = await frame.locator('nav').evaluate("el => window.getComputedStyle(el).backgroundColor")
        assert nav_bg_color in ['rgb(18, 18, 18)', 'rgb(0, 0, 0)'], f'Unexpected nav background color in dark mode: {nav_bg_color}'
        page_bg_color = await frame.locator('body').evaluate("el => window.getComputedStyle(el).backgroundColor")
        assert page_bg_color in ['rgb(18, 18, 18)', 'rgb(0, 0, 0)'], f'Unexpected page background color in dark mode: {page_bg_color}'
        # Verify no content loss by checking presence of key text elements
        assert await frame.locator('text=Create Beautiful QR Codes').is_visible(), 'Title text missing in dark mode'
        assert await frame.locator('text=Generate customizable QR codes with logos, colors, and watermarks.').is_visible(), 'Description text missing in dark mode'
        assert await frame.locator('text=Get Started').is_visible(), 'Get Started button missing in dark mode'
        assert await frame.locator('text=Sign In').is_visible(), 'Sign In button missing in dark mode'
        # Assertion: Verify dark mode preference persists after reload
        dark_mode_class_after_reload = await frame.get_attribute('html', 'class')
        assert 'dark' in dark_mode_class_after_reload, 'Dark mode preference did not persist after reload'
        # Assertion: Verify UI switches to light theme correctly
        light_mode_class = await frame.get_attribute('html', 'class')
        assert 'dark' not in light_mode_class, 'Dark mode class still present after toggling back to light mode'
        # Check key UI elements for light mode styles
        nav_bg_color_light = await frame.locator('nav').evaluate("el => window.getComputedStyle(el).backgroundColor")
        assert nav_bg_color_light in ['rgb(255, 255, 255)', 'rgb(248, 249, 250)'], f'Unexpected nav background color in light mode: {nav_bg_color_light}'
        page_bg_color_light = await frame.locator('body').evaluate("el => window.getComputedStyle(el).backgroundColor")
        assert page_bg_color_light in ['rgb(255, 255, 255)', 'rgb(248, 249, 250)'], f'Unexpected page background color in light mode: {page_bg_color_light}'
        # Verify no content loss by checking presence of key text elements in light mode
        assert await frame.locator('text=Create Beautiful QR Codes').is_visible(), 'Title text missing in light mode'
        assert await frame.locator('text=Generate customizable QR codes with logos, colors, and watermarks.').is_visible(), 'Description text missing in light mode'
        assert await frame.locator('text=Get Started').is_visible(), 'Get Started button missing in light mode'
        assert await frame.locator('text=Sign In').is_visible(), 'Sign In button missing in light mode'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    