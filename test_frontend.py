import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)

try:
    driver.get("http://localhost:8000")
    time.sleep(2)
    
    # Check console logs
    logs = driver.get_log('browser')
    for log in logs:
        print("CONSOLE:", log)
        
    btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Access Portal')]")
    btn.click()
    time.sleep(1)
    
    modal = driver.find_element(By.ID, "authModal")
    print("Modal is displayed:", modal.is_displayed())
    
    logs = driver.get_log('browser')
    for log in logs:
        print("CONSOLE:", log)

finally:
    driver.quit()
