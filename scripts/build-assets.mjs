/**
 * Builds static assets for the Next.js port from the original Rails project.
 *
 * - Copies template images, fonts and documents from the Rails public/ dir
 * - Copies app/assets/images (served by Rails at /assets/*)
 * - Compiles the Slowave SCSS bundle (application.scss) to /assets/application.css
 * - Compiles the admin (Light Bootstrap Dashboard) bundle to /assets/admin.css
 * - Compiles the devise (login screen) bundle to /assets/devise.css
 * - Concatenates the public-web vendor JS bundle to /assets/application.js
 *   (jQuery + Slowave plugins, with small shims replacing turbolinks/rails-ujs)
 *
 * Usage: node scripts/build-assets.mjs [--rails-root <path>]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

const railsRootArg = process.argv.indexOf('--rails-root');
const RAILS_ROOT =
  railsRootArg !== -1
    ? path.resolve(process.argv[railsRootArg + 1])
    : path.resolve(APP_ROOT, '..');

const PUBLIC = path.join(APP_ROOT, 'public');
const ASSETS_OUT = path.join(PUBLIC, 'assets');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ! skipping missing dir: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`  copied ${path.relative(RAILS_ROOT, src)} -> ${path.relative(APP_ROOT, dest)}`);
}

/** Copies a stylesheet tree while rewriting Rails asset helpers to plain CSS urls. */
function copyScssTransformed(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyScssTransformed(s, d);
    } else if (/\.(scss|css)$/.test(entry.name)) {
      let content = fs.readFileSync(s, 'utf8');
      // image-url('foo.png') -> url('/assets/foo.png')  (Rails sass-rails helper)
      content = content.replace(/image-url\((['"]?)([^'")]+)\1\)/g, "url('/assets/$2')");
      content = content.replace(/asset-url\((['"]?)([^'")]+)\1\)/g, "url('/assets/$2')");
      content = content.replace(/font-url\((['"]?)([^'")]+)\1\)/g, "url('/assets/$2')");
      fs.writeFileSync(d, content);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function compileScss(entry, outFile, loadPaths) {
  const result = sass.compile(entry, {
    loadPaths,
    style: 'expanded',
    quietDeps: true,
    silenceDeprecations: [
      'import',
      'global-builtin',
      'color-functions',
      'slash-div',
      'mixed-decls',
      'legacy-js-api',
    ],
    logger: { warn() {}, debug() {} },
  });
  fs.writeFileSync(outFile, result.css);
  console.log(`  compiled ${path.basename(entry)} -> ${path.relative(APP_ROOT, outFile)} (${(result.css.length / 1024).toFixed(0)} kB)`);
}

console.log('== Copying static files ==');
// Rails public/* served as-is
for (const dir of ['style', 'img', 'fonts', 'documents', 'assets']) {
  copyDir(path.join(RAILS_ROOT, 'public', dir), path.join(PUBLIC, dir));
}
// Rails app/assets/images served at /assets/*
copyDir(path.join(RAILS_ROOT, 'app/assets/images'), ASSETS_OUT);
// Fancybox images referenced relative to the compiled css (/assets/*)
const fancyboxDir = path.join(RAILS_ROOT, 'vendor/assets/javascript/slowave/fancybox');
if (fs.existsSync(fancyboxDir)) {
  for (const f of fs.readdirSync(fancyboxDir)) {
    if (/\.(png|gif|jpg)$/.test(f)) {
      fs.copyFileSync(path.join(fancyboxDir, f), path.join(ASSETS_OUT, f));
    }
  }
  const helpers = path.join(fancyboxDir, 'helpers');
  for (const f of fs.readdirSync(helpers)) {
    if (/\.(png|gif|jpg)$/.test(f)) {
      fs.copyFileSync(path.join(helpers, f), path.join(ASSETS_OUT, f));
    }
  }
}
// font-awesome webfonts (Rails served them at /assets/* via font-awesome-rails)
const faFonts = path.join(APP_ROOT, 'node_modules/font-awesome/fonts');
if (fs.existsSync(faFonts)) {
  for (const f of fs.readdirSync(faFonts)) {
    fs.copyFileSync(path.join(faFonts, f), path.join(ASSETS_OUT, f));
  }
}

console.log('== Compiling stylesheets ==');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sapler-scss-'));
const appStyles = path.join(tmp, 'app');
const vendorStyles = path.join(tmp, 'vendor');
copyScssTransformed(path.join(RAILS_ROOT, 'app/assets/stylesheets'), appStyles);
copyScssTransformed(path.join(RAILS_ROOT, 'vendor/assets/stylesheets'), vendorStyles);

// font-awesome expects $fa-font-path; fonts are copied into /assets
fs.writeFileSync(
  path.join(tmp, 'font-awesome-config.scss'),
  '$fa-font-path: "/assets";\n@import "font-awesome/scss/font-awesome";\n'
);

const loadPaths = [
  appStyles,
  vendorStyles,
  tmp,
  path.join(APP_ROOT, 'node_modules/bootstrap/scss'),
  path.join(APP_ROOT, 'node_modules'),
  path.join(APP_ROOT, 'node_modules/bootstrap-datepicker/dist/css'),
];

compileScss(path.join(appStyles, 'application.scss'), path.join(ASSETS_OUT, 'application.css'), loadPaths);

// Admin manifest imports gem stylesheets by bare names; map them to npm equivalents.
{
  let manifest = fs.readFileSync(path.join(appStyles, 'admin/manifest.scss'), 'utf8');
  manifest = manifest.replace('@import "font-awesome";', '@import "font-awesome-config";');
  manifest = manifest.replace('@import "bootstrap-datepicker";', '@import "bootstrap-datepicker3";');
  fs.writeFileSync(path.join(tmp, 'admin-manifest.scss'), manifest);
  compileScss(path.join(tmp, 'admin-manifest.scss'), path.join(ASSETS_OUT, 'admin.css'), [path.join(appStyles), ...loadPaths]);
}

// Devise (login screen) bundle
if (fs.existsSync(path.join(appStyles, 'devise/manifest.scss'))) {
  compileScss(path.join(appStyles, 'devise/manifest.scss'), path.join(ASSETS_OUT, 'devise.css'), loadPaths);
}

console.log('== Building public JS bundle ==');
// Order mirrors app/assets/javascripts/application.js (sprockets manifest).
// turbolinks / rails-ujs / activestorage are replaced by shims (see below).
const jsFiles = [
  'vendor/assets/javascript/slowave/jquery.min.js',
  'SHIM',
  'vendor/assets/javascript/slowave/bootstrap.min.js',
  'vendor/assets/javascript/jquery.validate.min.js',
  'vendor/assets/javascript/messages_cs.js',
  'vendor/assets/javascript/blueimp-gallery.js',
  'app/assets/javascripts/widgets/contact_form.js',
  'app/assets/javascripts/utils/cookie_manager.js',
  'vendor/assets/javascript/slowave/twitter-bootstrap-hover-dropdown.min.js',
  'vendor/assets/javascript/slowave/jquery.themepunch.plugins.min.js',
  'vendor/assets/javascript/slowave/jquery.themepunch.revolution.min.js',
  'vendor/assets/javascript/slowave/jquery.fancybox.pack.js',
  'vendor/assets/javascript/slowave/fancybox/helpers/jquery.fancybox-thumbs.js',
  'vendor/assets/javascript/slowave/fancybox/helpers/jquery.fancybox-media.js',
  'vendor/assets/javascript/slowave/jquery.isotope.min.js',
  'vendor/assets/javascript/slowave/jquery.easytabs.min.js',
  'vendor/assets/javascript/slowave/owl.carousel.min.js',
  'vendor/assets/javascript/slowave/jquery.fitvids.js',
  'vendor/assets/javascript/slowave/google-code-prettify/prettify.js',
  'vendor/assets/javascript/slowave/jquery.slickforms.js',
  'vendor/assets/javascript/slowave/retina.js',
  'vendor/assets/javascript/slowave/scripts.js',
  'app/assets/javascripts/general.js',
  'app/assets/javascripts/gallery.js',
  'app/assets/javascripts/main.js',
];

const shim = `
// --- Next.js port shims (replaces turbolinks + rails-ujs) ---
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.dispatchEvent(new Event('turbolinks:load'));
  });
})();
(function ($) {
  // Minimal rails-ujs replacement: submit form[data-remote=true] over fetch
  // and re-emit jQuery ajax:success / ajax:error events.
  $(function () {
    $(document).on('submit', 'form[data-remote="true"]', function (e) {
      e.preventDefault();
      var form = this;
      if ($(form).data('validator') && !$(form).valid()) return;
      fetch(form.action, {
        method: (form.method || 'post').toUpperCase(),
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
        .then(function (res) {
          if (res.ok) {
            $(form).trigger('ajax:success', res);
          } else {
            $(form).trigger('ajax:error', res);
          }
        })
        .catch(function () {
          $(form).trigger('ajax:error');
        });
    });
  });
})(jQuery);
`;

let bundle = '';
for (const f of jsFiles) {
  if (f === 'SHIM') {
    bundle += shim + '\n;\n';
    continue;
  }
  const p = path.join(RAILS_ROOT, f);
  if (!fs.existsSync(p)) {
    console.warn(`  ! missing JS file: ${f}`);
    continue;
  }
  bundle += fs.readFileSync(p, 'utf8') + '\n;\n';
}
fs.writeFileSync(path.join(ASSETS_OUT, 'application.js'), bundle);
console.log(`  built application.js (${(bundle.length / 1024).toFixed(0)} kB)`);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('Done.');
