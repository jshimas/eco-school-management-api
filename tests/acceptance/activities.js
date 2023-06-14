require("dotenv").config();
const { Builder, Browser, By, Key } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const service = new firefox.ServiceBuilder("geckodriver");
const { Activity } = require("../../models");

exports.createActivity = async () => {
  try {
    let driver = await new Builder()
      .forBrowser(Browser.FIREFOX)
      .setFirefoxOptions(service)
      .build();

    await driver.get("http://localhost:5173");
    await driver.sleep(1000);

    // Login
    await driver.findElement(By.id("email")).sendKeys("User@owly.com");
    await driver.findElement(By.id("password")).sendKeys("Esmad_2223");
    await driver.findElement(By.className("btn")).click();
    await driver.sleep(3000);

    // navigate to activities
    await driver.findElement(By.css('a[href="/schools/1/activities"]')).click();
    await driver.sleep(1000);

    // open create activity form
    await driver.findElement(By.className("btn-success")).click();
    await driver.sleep(3000);

    // fill the activity form
    await driver.findElement(By.id("theme")).sendKeys("test-theme-456123");
    await driver.findElement(By.id("name")).sendKeys("test name");
    await driver.findElement(By.id("location")).sendKeys("test location");
    await driver.findElement(By.id("startDate")).sendKeys("2023-07-01");
    await driver.findElement(By.id("4")).click();

    // Click the button using JavaScript
    const button = await driver.findElement(By.css("button.btn.btn-success"));
    await driver.executeScript("arguments[0].click();", button);

    await driver.sleep(3000);

    // destroy the created instance
    await Activity.destroy({ where: { theme: "test-theme-456123" } });
    await driver.sleep(3000);

    await driver.quit();
  } catch (error) {
    console.log(error);
  }
};

exports.updateActivity = async () => {
  try {
    let driver = await new Builder()
      .forBrowser(Browser.FIREFOX)
      .setFirefoxOptions(service)
      .build();

    await driver.get("http://localhost:5173");
    await driver.sleep(1000);

    // Login
    await driver.findElement(By.id("email")).sendKeys("Coordinator@owly.com");
    await driver.findElement(By.id("password")).sendKeys("Esmad_2223");
    await driver.findElement(By.className("btn")).click();
    await driver.sleep(5000);

    // navigate to activities
    await driver.findElement(By.css('a[href="/schools/1/activities"]')).click();
    await driver.sleep(1000);

    // open activity
    await driver
      .findElement(
        By.xpath(
          "//*[contains(text(), 'Stopping food waste in school campus')]"
        )
      )
      .click();
    await driver.sleep(2000);

    // activate editing mode
    await driver.findElement(By.className("btn-outline-primary")).click();
    await driver.sleep(500);

    // select new supervisor and modify the form
    const originalActivity = await Activity.findOne({
      where: { name: "Stopping food waste in school campus" },
    });

    await driver.findElement(By.id("4")).click();
    await driver.findElement(By.id("location")).sendKeys(" in the wilderness");

    // Click the save button using JavaScript
    const button = await driver.findElement(By.css("button.btn.btn-success"));
    await driver.executeScript("arguments[0].click();", button);
    await driver.sleep(3000);

    // bring back the original activity
    await Activity.update(
      { location: originalActivity.location },
      { where: { id: originalActivity.id } }
    );
    await driver.sleep(3000);

    await driver.quit();
  } catch (error) {
    console.log(error);
  }
};
