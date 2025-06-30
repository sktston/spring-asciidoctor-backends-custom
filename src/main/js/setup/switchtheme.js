/*
 * Copyright 2021 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  "use strict";

  const delay = require("lodash/delay");

  const localStorage = window.localStorage;
  const htmlElement = document.documentElement;
  const prefersDarkColorScheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  switchInitialTheme();
  window.addEventListener("DOMContentLoaded", onDOMContentLoaded);

  function switchInitialTheme() {
    if (isInitialThemeDark()) {
      htmlElement.classList.add("dark-theme");
    }
  }

  function onDOMContentLoaded() {
    const toggleCheckboxElement = document.querySelector(
      "#switch-theme-checkbox"
    );
    toggleCheckboxElement.checked = isInitialThemeDark();
    toggleCheckboxElement.classList.remove("hidden");
    toggleCheckboxElement.addEventListener(
      "change",
      onThemeChange.bind(toggleCheckboxElement)
    );
  }

  function isInitialThemeDark() {
    const theme = loadTheme();
    return theme ? theme === "dark" : prefersDarkColorScheme.matches;
  }

  function onThemeChange() {
    // Remove no-transitions class to enable animation for user interaction
    htmlElement.classList.remove("no-transitions");

    if (this.checked) {
      delay(function () {
        htmlElement.classList.add("dark-theme");
      }, 100);
      saveTheme("dark");
    } else {
      delay(function () {
        htmlElement.classList.remove("dark-theme");
      }, 100);
      saveTheme("light");
    }
  }

  function saveTheme(theme) {
    if (localStorage) {
      localStorage.setItem("theme", theme);
    }
  }

  function loadTheme() {
    return localStorage !== null ? localStorage.getItem("theme") : null;
  }
})();
