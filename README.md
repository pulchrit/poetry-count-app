# poetry-count-app
Help users analyze the words used by a poet or poets by calling the PoetryDB API and analyzing the response data.

- Asynchronous web app that uses the Fetch API to request data from the PoetryDB API based on user search term(s).
    - Predefined searches are also available. 
- The program extracts words from the poem(s), tallies word frequency, and plots/displays it using HighCharts. 
- When searching multiple poets, their word frequency charts can be compared using small multiples.
- A table or partial table of word data is displayed. 
- The actual poem(s) are also displayed.
