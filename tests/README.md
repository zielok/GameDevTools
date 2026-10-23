# Tests

End-to-end tests that open each tool in headless Chrome and drive it with real
mouse and keyboard events (via the Chrome DevTools Protocol). No npm install.

```
node tests/run.mjs          # all tests
node tests/run.mjs pixel    # only test files whose name contains "pixel"
```

Requirements: Node 22+ and Google Chrome (or Chromium). If Chrome isn't found
automatically, point `CHROME` at its executable. `sprite.test.mjs` also uses the
system `unzip` to validate the exported ZIP.

Each test file takes the work directory prepared by `run.mjs` as its first
argument; pages are loaded from `<work>/pages/`.
