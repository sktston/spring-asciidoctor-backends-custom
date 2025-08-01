#
# Copyright 2021 the original author or authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# coding: utf-8

require_relative "spring-asciidoctor-backends/spring-docinfo-processor"
require_relative "spring-asciidoctor-backends/spring-html5-converter"
require_relative "spring-asciidoctor-backends/skt-custom-footer-processor"

begin
  require_relative "spring-asciidoctor-backends/spring-pdf-converter"
rescue LoadError
end