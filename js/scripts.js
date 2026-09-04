/* Flour Math — vanilla step flow. Same formulas as before, decimals supported. */
(function () {
  'use strict';

  var GLUTEN_PROTEIN = 0.75; // vital wheat gluten treated as 75% protein (hidden)
  var DASH = '\u2014';

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var v = parseFloat(String(el.value).trim());
    return isFinite(v) ? v : NaN;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function calcFields() {
    var serving = num('target');
    var protein = num('target3');
    var targetAmt = num('target5');
    var targetPct = num('target6');

    var currentPct = NaN;
    if (isFinite(serving) && serving > 0 && isFinite(protein) && protein >= 0) {
      currentPct = (protein / serving) * 100;
    }

    var glutenNeed = NaN;
    var flourNeed = NaN;
    var note = '';

    if (isFinite(currentPct)) {
      setText('target4', currentPct.toFixed(2));
    } else {
      setText('target4', DASH);
    }

    if (isFinite(currentPct) && isFinite(targetAmt) && targetAmt > 0 &&
        isFinite(targetPct) && targetPct >= 0) {
      if (targetPct <= currentPct) {
        glutenNeed = 0;
        flourNeed = targetAmt;
        note = 'Your flour already meets the target — no vital wheat gluten needed.';
      } else if (targetPct > GLUTEN_PROTEIN * 100) {
        note = 'That target is above vital wheat gluten (75%) — it can\u2019t be reached by adding gluten.';
      } else {
        glutenNeed = Math.abs((((targetPct - currentPct) / 100) /
          (GLUTEN_PROTEIN - currentPct / 100)) * targetAmt);
        flourNeed = targetAmt - glutenNeed;
      }
    }

    setText('target7', isFinite(flourNeed) ? flourNeed.toFixed(2) : DASH);
    setText('target8', isFinite(glutenNeed) ? glutenNeed.toFixed(2) : DASH);
    setText('target-total', isFinite(targetAmt) && targetAmt > 0 ? targetAmt.toFixed(2) : DASH);

    var noteEl = document.getElementById('result-note');
    if (noteEl) {
      noteEl.textContent = note;
      noteEl.hidden = !note;
    }

    updateSummaries(currentPct, targetAmt, targetPct, flourNeed, glutenNeed);
  }

  function updateSummaries(currentPct, targetAmt, targetPct, flourNeed, glutenNeed) {
    var s1 = document.getElementById('summary-1');
    var s2 = document.getElementById('summary-2');
    var s3 = document.getElementById('summary-3');

    if (s1) {
      s1.textContent = isFinite(currentPct)
        ? 'Protein ' + currentPct.toFixed(2) + '%'
        : 'Enter values below';
    }
    if (s2) {
      s2.textContent = (isFinite(targetAmt) && targetAmt > 0 && isFinite(targetPct))
        ? targetAmt + ' g at ' + targetPct + '%'
        : 'Enter values below';
    }
    if (s3) {
      s3.textContent = (isFinite(targetAmt) && targetAmt > 0 && isFinite(flourNeed) && isFinite(glutenNeed))
        ? targetAmt + ' g bread flour = ' + flourNeed.toFixed(2) + 'g flour + ' + glutenNeed.toFixed(2) + 'g gluten'
        : 'Shows after steps 1–2';
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function stopAnims(body) {
    var anims = body.getAnimations ? body.getAnimations() : [];
    for (var i = 0; i < anims.length; i++) anims[i].cancel();
    body.style.overflow = '';
  }

  function showBody(body, animate) {
    stopAnims(body);
    if (!animate || prefersReducedMotion() || !body.animate) {
      body.hidden = false;
      return;
    }
    body.hidden = false;
    var target = body.scrollHeight;
    body.style.overflow = 'hidden';
    var anim = body.animate(
      [{ height: '0px' }, { height: target + 'px' }],
      { duration: 250, easing: 'ease' }
    );
    anim.onfinish = function () { body.style.overflow = ''; };
  }

  function hideBody(body, animate) {
    stopAnims(body);
    if (!animate || prefersReducedMotion() || !body.animate) {
      body.hidden = true;
      return;
    }
    var start = body.offsetHeight;
    body.style.overflow = 'hidden';
    var anim = body.animate(
      [{ height: start + 'px' }, { height: '0px' }],
      { duration: 220, easing: 'ease' }
    );
    anim.onfinish = function () {
      body.hidden = true;
      body.style.overflow = '';
    };
  }

  function openStep(n, focusFirst, animate) {
    for (var i = 1; i <= 3; i++) {
      var header = document.getElementById('header-' + i);
      var body = document.getElementById('body-' + i);
      var open = i === n;
      if (header) header.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (body) {
        if (open) showBody(body, animate);
        else if (!body.hidden) hideBody(body, animate);
      }
    }
    var section = document.getElementById('step-' + n);
    if (!section) return;
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function pinToTop() {
      try {
        section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      } catch (e) {
        section.scrollIntoView();
      }
    }
    if (focusFirst) {
      var input = section.querySelector('input');
      if (input) {
        try {
          input.focus({ preventScroll: true });
        } catch (e) {
          input.focus();
        }
      }
      // Wait for the keyboard to open before pinning, or it covers Next.
      setTimeout(pinToTop, 350);
    } else {
      setTimeout(pinToTop, animate && !reduceMotion ? 260 : 0);
    }
  }

  function goNext(fromStep) {
    calcFields();
    if (fromStep < 3) openStep(fromStep + 1, true, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var inputs = document.querySelectorAll('input');
    for (var k = 0; k < inputs.length; k++) {
      inputs[k].addEventListener('input', calcFields);
    }

    for (var s = 1; s <= 3; s++) {
      (function (step) {
        var header = document.getElementById('header-' + step);
        if (header) {
          header.addEventListener('click', function () {
            var isOpen = header.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
              header.setAttribute('aria-expanded', 'false');
              hideBody(document.getElementById('body-' + step), true);
            } else {
              openStep(step, false, true);
            }
          });
        }
      })(s);
    }

    var n1 = document.getElementById('next-1');
    var n2 = document.getElementById('next-2');
    if (n1) n1.addEventListener('click', function () { goNext(1); });
    if (n2) n2.addEventListener('click', function () { goNext(2); });

    var resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var defaults = { target: '30', target3: '3', target5: '100', target6: '15' };
        for (var id in defaults) {
          if (Object.prototype.hasOwnProperty.call(defaults, id)) {
            document.getElementById(id).value = defaults[id];
          }
        }
        calcFields();
        openStep(1, true, true);
      });
    }

    calcFields();
  });
})();
