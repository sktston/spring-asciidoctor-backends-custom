/*
 * Copyright 2021-2022 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.spring.asciidoctor.backend.testsupport;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.function.Consumer;
import java.util.logging.Level;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.assertj.core.api.AbstractStringAssert;
import org.assertj.core.api.AssertProvider;
import org.assertj.core.api.Assertions;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.openqa.selenium.logging.LogEntries;
import org.openqa.selenium.logging.LogEntry;
import org.openqa.selenium.logging.LogType;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testcontainers.images.builder.Transferable;
import org.testcontainers.utility.MountableFile;

/**
 * Represents a converted HTML document.
 *
 * @author Phillip Webb
 * @see AsciidoctorExtension
 */
public class ConvertedHtml implements AssertProvider<AbstractStringAssert<?>> {

	private final Path directory;

	private final String html;

	private final Document document;

	ConvertedHtml(Path directory, Path html) throws IOException {
		this(directory, read(html));
	}

	public ConvertedHtml(Path directory, String html) {
		this.directory = directory;
		this.html = html;
		this.document = Jsoup.parse(html);
	}

	public String getElementByTag(String tagName) {
		Elements elements = this.document.getElementsByTag(tagName);
		Assertions.assertThat(elements.size()).isEqualTo(1);
		return elements.get(0).html();
	}

	public String getElementByClass(String className) {
		Elements elements = this.document.getElementsByClass(className);
		Assertions.assertThat(elements.size()).isEqualTo(1);
		return elements.get(0).html();
	}

	@Override
	public String toString() {
		return this.html;
	}

	@Override
	public AbstractStringAssert<?> assertThat() {
		return Assertions.assertThat(this.html);
	}

	public RemoteWebDriver inWebBrowser(ChromeContainer chrome) {
		return inWebBrowser(chrome, (String) null);
	}

	public RemoteWebDriver inWebBrowser(ChromeContainer chrome, String anchor) {
		return inWebBrowser(chrome, anchor, (logs) -> Assertions.assertThat(logs).isEmpty());
	}

	public RemoteWebDriver inWebBrowser(ChromeContainer chrome, Consumer<LogEntries> logChecks) {
		return inWebBrowser(chrome, null, logChecks);
	}

	public RemoteWebDriver inWebBrowser(ChromeContainer chrome, String anchor, Consumer<LogEntries> logChecks) {
		chrome.copyFileToContainer(Transferable.of(this.html.getBytes(StandardCharsets.UTF_8)), "/test.html");
		copyAssets(chrome);
		RemoteWebDriver driver = chrome.getWebDriver();
		String url = "file:///test.html";
		if (anchor != null) {
			url = url + "#" + anchor;
		}
		driver.get(url);
		LogEntries logs = driver.manage().logs().get(LogType.BROWSER);
		List<LogEntry> nonIgnorable = logs.getAll().stream().filter((entry) -> !isIgnorable(entry))
				.collect(Collectors.toList());
		logChecks.accept(new LogEntries(nonIgnorable));
		return driver;
	}

	private void copyAssets(ChromeContainer chrome) {
		try {
			copyDirectory("css", chrome);
			copyDirectory("img", chrome);
			copyDirectory("js", chrome);
		}
		catch (IOException ex) {
			throw new IllegalStateException(ex);
		}
	}

	private void copyDirectory(String name, ChromeContainer chrome) throws IOException {
		Path directory = this.directory.resolve(name);
		try (Stream<Path> walk = Files.walk(directory)) {
			walk.filter((path) -> !path.equals(directory))
					.forEach((path) -> chrome.copyFileToContainer(MountableFile.forHostPath(path),
							'/' + name + '/' + path.getFileName().toString()));
		}
	}

	private static String read(Path path) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		Files.copy(path, out);
		return new String(out.toByteArray(), StandardCharsets.UTF_8);
	}

	private boolean isIgnorable(LogEntry entry) {
		String message = entry.getMessage();
		return message.contains("highlightBlock will be removed") || message.contains("highlightElement now")
				|| message.contains("fontawesome-webfont") || message.contains("LocalTOC")
				|| message.contains("Search index not loaded or not available")
				|| message.contains("search-bundle.min.json") || entry.getLevel() == Level.FINE;
	}

}
