class CustomFooter < Asciidoctor::Extensions::DocinfoProcessor
  use_dsl

  at_location :footer

  def process(doc)

    <<~HTML
      <div id="footer">
        <div id="footer-text">
          Version #{doc.attr('revnumber')}, Last updated #{doc.attr('revdate')}, Authored in <a href="https://asciidoc.org" target="_blank" rel="noopener">AsciiDoc</a>,
          Produced by <a href="https://asciidoctor.org" target="_blank" rel="noopener">Asciidoctor</a>.
          <br>
          Copyright ⓒ SK Telecom. All Rights Reserved.
        </div>
        <div class="footer-logo">
          <a href="https://www.sktelecom.com/" target="_blank">
            <span class="img-skt"><span class="hide">SK Telecom</span></span>
          </a>
          <a href="https://github.com/skt-passkey/" target="_blank">
            <span class="img-github"><span class="hide">Github</span></span>
          </a>
          <a href="https://fidoalliance.org/" target="_blank">
            <span class="img-fido"><span class="hide">Fido Certified</span></span>
          </a>
        </div>
      </div>
    HTML
  end
end

Asciidoctor::Extensions.register do
  docinfo_processor CustomFooter
end
