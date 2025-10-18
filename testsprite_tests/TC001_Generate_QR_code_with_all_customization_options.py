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
        # Select custom colors for QR code foreground and background
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/main/div/div/div[3]/div[2]/div/div[2]/div/div[2]/div/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Try to change foreground and background colors using click or other interaction instead of text input
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/main/div/div/div[3]/div[2]/div/div[2]/div/div[2]/div/div[4]/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/main/div/div/div[3]/div[2]/div/div[2]/div/div[2]/div/div[4]/div/div/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select a custom background color from the color picker UI
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/main/div/div/div[3]/div[2]/div/div[2]/div/div[2]/div/div[4]/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select dot style and corner style from available options
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/main/div/div/div[3]/div[2]/div/div[2]/div/div[2]/div/div[4]/div[3]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select a corner style from the available options
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Upload a logo image to embed within the QR code
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/main/div/div/div[3]/div[2]/div/div[2]/div/div[2]/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Upload a logo image to embed within the QR code
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/main/div/div/div[3]/div[2]/div/div[2]/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert QR code is generated successfully
        qr_code_locator = frame.locator('xpath=//div[contains(@class, "qr-code-preview")]')
        await qr_code_locator.wait_for(state='visible', timeout=10000)
        assert await qr_code_locator.is_visible(), "QR code preview is not visible"
          
        # Assert custom foreground and background colors are applied
        foreground_color_elem = frame.locator('xpath=//div[contains(@class, "qr-code-preview")]//*[contains(@style, "color") or contains(@style, "fill")]')
        background_color_elem = frame.locator('xpath=//div[contains(@class, "qr-code-preview")]')
        fg_color = await foreground_color_elem.evaluate('(el) => window.getComputedStyle(el).color')
        bg_color = await background_color_elem.evaluate('(el) => window.getComputedStyle(el).backgroundColor')
        assert fg_color != 'rgba(0, 0, 0, 0)' and fg_color is not None, "Foreground color is not applied or transparent"
        assert bg_color != 'rgba(0, 0, 0, 0)' and bg_color is not None, "Background color is not applied or transparent"
          
        # Assert dot style and corner style are applied by checking presence of specific classes or styles
        dot_style_elem = frame.locator('xpath=//div[contains(@class, "qr-code-preview")]//*[contains(@class, "dot-style")]')
        corner_style_elem = frame.locator('xpath=//div[contains(@class, "qr-code-preview")]//*[contains(@class, "corner-style")]')
        assert await dot_style_elem.count() > 0, "Dot style is not applied"
        assert await corner_style_elem.count() > 0, "Corner style is not applied"
          
        # Assert logo is embedded within the QR code
        logo_elem = frame.locator('xpath=//div[contains(@class, "qr-code-preview")]//img[contains(@src, "logo")]')
        assert await logo_elem.is_visible(), "Logo is not visible in QR code"
          
        # Assert watermark toggle is applied
        watermark_elem = frame.locator('xpath=//div[contains(@class, "qr-code-preview")]//*[contains(text(), "Botrix") or contains(@class, "watermark")]')
        assert await watermark_elem.is_visible(), "Watermark is not visible in QR code"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    