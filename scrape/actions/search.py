from scraper.search import bc_search


def search(initials, period):
    """Search for a initial and period in BuscaCursosUC.
    Prints the results. Useful for testing only.
    """
    print("Searching in BC:", initials)
    courses = bc_search(initials, period)
    for c in courses:
        print(c["initials"], c["section"], c["name"], "-", c["teacher"])
    if len(courses) >= 50:
        print("> Some results may have been truncated.")
