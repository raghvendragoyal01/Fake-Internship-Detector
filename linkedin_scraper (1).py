
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import random
from fake_useragent import UserAgent
from datetime import datetime
import re
import hashlib
import os


ua = UserAgent()

def get_headers():

    return {
        "User-Agent": ua.random,
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
    }



keywords = [

    "Work From Home Internship",
    "Part Time Remote Jobs",
    "Online Internship",
    "Remote Internship",
    "Instant Joining Jobs",
    "Data Entry Jobs",

]

locations = [

    "Mumbai",
    "Pune"

]


def extract_email(text):

    emails = re.findall(

        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text

    )

    if emails:
        return emails[0]

    return "N/A"



def generate_job_id(title, company):

    raw = f"{title}{company}"

    return hashlib.md5(
        raw.encode()
    ).hexdigest()


def extract_company_website(soup):

    links = soup.find_all(
        "a",
        href=True
    )

    for link in links:

        href = link["href"]

        if (
            "http" in href
            and "linkedin" not in href
        ):

            return href

    return "N/A"



def scrape_job_details(job_url):

    try:

        response = requests.get(

            job_url,
            headers=get_headers(),
            timeout=20

        )

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

      

        desc_div = soup.find(

            "div",
            class_="show-more-less-html__markup"

        )

        description = (

            desc_div.get_text(
                separator=" "
            ).strip()

            if desc_div else "N/A"

        )

       
        recruiter_email = extract_email(
            description
        )


        company_website = extract_company_website(
            soup
        )

        return {

            "description":
                description,

            "recruiter_email":
                recruiter_email,

            "company_website":
                company_website
        }

    except Exception as e:

        print("Job Detail Error:", e)

        return {

            "description":
                "N/A",

            "recruiter_email":
                "N/A",

            "company_website":
                "N/A"
        }


def scrape_linkedin(

    keyword,
    location,
    pages=1

):

    all_jobs = []

    for page in range(pages):

        start = page * 25

        url = (

            f"https://www.linkedin.com/jobs/search?"
            f"keywords={keyword.replace(' ', '%20')}"
            f"&location={location.replace(' ', '%20')}"
            f"&start={start}"

        )

        print("\n" + "="*60)
        print(f"Scraping Page {page+1}")
        print(url)

        try:

            response = requests.get(

                url,
                headers=get_headers(),
                timeout=20

            )

            print("Status:", response.status_code)

           
            if response.status_code == 429:

                print(
                    "Rate Limited. Waiting 60 sec..."
                )

                time.sleep(60)

                continue

            if response.status_code != 200:

                print("Failed Request")

                continue

            soup = BeautifulSoup(

                response.text,
                "html.parser"

            )

            job_cards = soup.find_all(

                "div",
                class_="base-card"

            )

            print(
                f"Found {len(job_cards)} jobs"
            )

            if not job_cards:

                print("No jobs found")

                break

            

            for card in job_cards:

                try:

                    title = card.find(

                        "h3",
                        class_="base-search-card__title"

                    )

                    company = card.find(

                        "h4",
                        class_="base-search-card__subtitle"

                    )

                    location_tag = card.find(

                        "span",
                        class_="job-search-card__location"

                    )

                    link = card.find(

                        "a",
                        class_="base-card__full-link"

                    )

                    date = card.find("time")

                    

                    title_text = (

                        title.text.strip()
                        if title else "N/A"

                    )

                    company_text = (

                        company.text.strip()
                        if company else "N/A"

                    )

                    location_text = (

                        location_tag.text.strip()
                        if location_tag else "N/A"

                    )

                    job_url = (

                        link["href"]
                        if link else "N/A"

                    )

                    posted_date = (

                        date["datetime"]
                        if date else "N/A"

                    )

                   

                    extra_data = scrape_job_details(
                        job_url
                    )

                    
                    job = {

                        "job_id":

                            generate_job_id(

                                title_text,
                                company_text

                            ),

                        "job_title":
                            title_text,

                        "company_name":
                            company_text,

                        "salary":
                            "N/A",

                        "location":
                            location_text,

                        "job_description":

                            extra_data[
                                "description"
                            ],

                        "recruiter_email":

                            extra_data[
                                "recruiter_email"
                            ],

                        "company_website":

                            extra_data[
                                "company_website"
                            ],

                        "posting_date":
                            posted_date,

                        "job_url":
                            job_url,

                        "keyword":
                            keyword,

                        "scraped_at":

                            datetime.now().strftime(
                                "%Y-%m-%d %H:%M:%S"
                            )
                    }

                    all_jobs.append(job)

                    print(
                        f"Collected: {title_text}"
                    )

                   

                    time.sleep(
                        random.uniform(3, 6)
                    )

                except Exception as e:

                    print("Card Error:", e)

                    continue

        except Exception as e:

            print("Request Error:", e)

            continue

       

        delay = random.uniform(5, 10)

        print(
            f"Waiting {delay:.1f} sec"
        )

        time.sleep(delay)

    return all_jobs



if __name__ == "__main__":

    
    if os.path.exists(
        "linkedin_jobs_partial.csv"
    ):

        old_df = pd.read_csv(
            "linkedin_jobs_partial.csv"
        )

        all_results = old_df.to_dict(
            "records"
        )

        existing_ids = set(
            old_df["job_id"]
        )

        print(
            f"Loaded {len(existing_ids)} old jobs"
        )

    else:

        all_results = []

        existing_ids = set()

    

    for keyword in keywords:

        for location in locations:

            print("\n" + "="*60)

            print(
                f"Searching: {keyword} | {location}"
            )

            print("="*60)

            jobs = scrape_linkedin(

                keyword=keyword,
                location=location,
                pages=1

            )

            
            for job in jobs:

                if job["job_id"] in existing_ids:

                    continue

                existing_ids.add(
                    job["job_id"]
                )

                all_results.append(job)

           

            temp_df = pd.DataFrame(
                all_results
            )

            temp_df.drop_duplicates(

                subset=["job_id"],
                inplace=True

            )

            temp_df.to_csv(

                "linkedin_jobs_partial.csv",
                index=False

            )

            print(
                "Progress Saved"
            )


            time.sleep(
                random.uniform(5, 12)
            )

   
    final_df = pd.DataFrame(
        all_results
    )

    final_df.drop_duplicates(

        subset=["job_id"],
        inplace=True

    )

    final_df.to_csv(

        "linkedin_jobs_full.csv",
        index=False

    )

    print("\n✅ SCRAPING COMPLETED")

    print(
        f"Final Jobs: {len(final_df)}"
    )

    print("\nSample Data:")

    print(final_df.head())


