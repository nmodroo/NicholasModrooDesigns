/* Nicholas Modroo Designs — shared site script (loaded on every page).
   1. Sends inquiry forms to Formspree and only shows the thank-you page when the
      message really went through; otherwise shows an error with direct contact info.
   2. Reports phone and email link clicks to Google Analytics as leads. */

function track(name, params) {
  if (typeof gtag === 'function') gtag('event', name, params || {});
}

// Phone / email clicks
document.addEventListener('click', function(e) {
  var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
  if (!a) return;
  var isPhone = a.getAttribute('href').indexOf('tel:') === 0;
  track(isPhone ? 'phone_click' : 'email_click', {page_path: location.pathname, transport_type: 'beacon'});
});

// Inquiry forms
document.querySelectorAll('form.inquiry-form').forEach(function(form) {
  var button = form.querySelector('button[type="submit"]');
  var error = form.querySelector('.form-error');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var label = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    if (error) error.hidden = true;

    var data = new FormData(form);
    // Project Type is optional on the site, but a blank value gets rejected by the
    // form service — send "Not specified" instead so the inquiry always goes through.
    if (!String(data.get('project_type') || '').trim()) data.set('project_type', 'Not specified');
    fetch(form.action, {method: 'POST', body: data, headers: {'Accept': 'application/json'}})
      .then(function(res) {
        if (!res.ok) throw new Error('Form service returned ' + res.status);
        var done = false;
        function go() { if (!done) { done = true; window.location.href = 'thanks.html'; } }
        track('generate_lead', {
          form_location: data.get('source_page') || location.pathname,
          project_type: data.get('project_type') || 'Not specified',
          event_callback: go
        });
        setTimeout(go, 1000); // don't wait on analytics if it's blocked or slow
      })
      .catch(function() {
        button.disabled = false;
        button.textContent = label;
        if (error) error.hidden = false;
        track('form_error', {page_path: location.pathname});
      });
  });
});
