---
name: get-search-view-results
description: 'Get the current search results from the Search view in Pointer'
---

# Getting Search View Results

1. Pointer has a search view, and it can have existing search results.
2. To get the current search results, you can use the Pointer command `search.action.getSearchResults`.
3. Run that command via the `copilot_runVscodeCommand` tool. Make sure to pass the `skipCheck` argument as true to avoid checking if the command exists, as we know it does.