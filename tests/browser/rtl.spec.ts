import {test, expect} from '@playwright/test';
test('Arabic account view is RTL and fits a small light-mode screen', async ({page}) => {
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(() => localStorage.setItem('neuroLift_workspace_guest',JSON.stringify({version:0,dirty:false,data:{language:'ar',neuroLift_theme:'light'}})));
 await page.goto('/#account');
 await expect(page.getByRole('heading',{name:'الحساب والمزامنة'})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('dir','rtl');
 await expect(page.locator('html')).toHaveClass(/light/);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await expect.poll(() => page.getByRole('heading').first().evaluate(el => getComputedStyle(el.parentElement!.parentElement!).opacity)).toBe('1');
 await page.screenshot({path:'test-results/account-ar-light.png',fullPage:true});
});
